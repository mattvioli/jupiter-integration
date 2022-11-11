import {
  HydraSDK,
  LiquidityPoolsCalculator,
  Network,
  Parsers,
} from "@hydraprotocol/sdk";
import { AnchorProvider } from "@project-serum/anchor";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import { QuoteCalculator } from "./quote";
import { AccountDatas, AccountInfoMap, Amm, Quote, QuoteParams } from "./types";

export function mapAddressToAccountDatas(
  accountInfoMap: AccountInfoMap,
  accountKeys: PublicKey[],
  parsers: Parsers
): AccountDatas {
  const [
    id,
    tokenXMintKey,
    tokenYMintKey,
    tokenXVaultKey,
    tokenYVaultKey,
    priceAccountXKey,
    priceAccountYKey,
  ] = accountKeys;
  const poolStateAccount = accountInfoMap.get(id.toString());
  const tokenXMintInfo = accountInfoMap.get(tokenXMintKey.toString());
  const tokenYMintInfo = accountInfoMap.get(tokenYMintKey.toString());
  const tokenXVaultInfo = accountInfoMap.get(tokenXVaultKey.toString());
  const tokenYVaultInfo = accountInfoMap.get(tokenYVaultKey.toString());
  const tokenXPriceInfo = accountInfoMap.get(priceAccountXKey.toString());
  const tokenYPriceInfo = accountInfoMap.get(priceAccountYKey.toString());

  if (
    !poolStateAccount ||
    !tokenXMintInfo ||
    !tokenYMintInfo ||
    !tokenXVaultInfo ||
    !tokenYVaultInfo ||
    !tokenXPriceInfo ||
    !tokenYPriceInfo
  )
    throw new Error("Problem occured mapping address to account data");
  const tokenMintParser = parsers.tokenMint();
  const tokenVaultParser = parsers.tokenAccount();
  const poolStateParser = parsers.poolState();
  const pythPriceParser = parsers.pythPriceData();

  const poolStateData = poolStateParser(poolStateAccount);
  const tokenXMintData = tokenMintParser(tokenXMintInfo);
  const tokenYMintData = tokenMintParser(tokenYMintInfo);
  const tokenXVaultData = tokenVaultParser(tokenXVaultInfo);
  const tokenYVaultData = tokenVaultParser(tokenYVaultInfo);
  const tokenXPythPrice = pythPriceParser(tokenXPriceInfo);
  const tokenYPythPrice = pythPriceParser(tokenYPriceInfo);

  const poolState = {
    pubkey: id,
    account: { ...poolStateAccount, data: poolStateData },
  };
  const tokenXMint = {
    pubkey: tokenXMintKey,
    account: { ...tokenXMintInfo, data: tokenXMintData },
  };
  const tokenYMint = {
    pubkey: tokenYMintKey,
    account: { ...tokenYMintInfo, data: tokenYMintData },
  };
  const tokenXVault = {
    pubkey: tokenXVaultKey,
    account: { ...tokenXVaultInfo, data: tokenXVaultData },
  };
  const tokenYVault = {
    pubkey: tokenYVaultKey,
    account: { ...tokenYVaultInfo, data: tokenYVaultData },
  };

  const notEnoughLiquidity =
    tokenXVaultData.amount === 0n && tokenYVaultData.amount === 0n;

  return {
    tokenXMint,
    tokenYMint,
    tokenXVault,
    tokenYVault,
    poolState,
    notEnoughLiquidity,
    tokenXPythPrice,
    tokenYPythPrice,
  };
}

export class HydraAmm implements Amm {
  public reserveTokenMints: [PublicKey, PublicKey];
  quoteInfos?: AccountDatas;
  constructor(
    private readonly address: PublicKey,
    private readonly accountInfo: AccountInfo<Buffer>,
    private readonly network: Network,
    private readonly parsers = Parsers.fromParserFactory(
      HydraSDK.fromAnchorProvider(AnchorProvider.env(), network).ctx.getParser
    ),
    private readonly poolStateParser = parsers.poolState(),
    private readonly quoteCalculator = QuoteCalculator.create()
  ) {
    const poolState = this.poolStateParser(this.accountInfo);
    this.reserveTokenMints = [poolState.tokenXMint, poolState.tokenYMint];
  }

  getAccountsForUpdate(): PublicKey[] {
    const poolState = this.poolStateParser(this.accountInfo);
    return [
      this.address,
      poolState.tokenXMint,
      poolState.tokenYMint,
      poolState.tokenXVault,
      poolState.tokenYVault,
      poolState.prices.priceAccountX,
      poolState.prices.priceAccountY,
    ];
  }

  update(
    accountInfoMap: AccountInfoMap,
    toAccountData = mapAddressToAccountDatas
  ): void {
    this.quoteInfos = toAccountData(
      accountInfoMap,
      this.getAccountsForUpdate(),
      this.parsers
    );
  }

  async getQuote(quoteParams: QuoteParams): Promise<Quote> {
    if (!this.quoteInfos) throw new Error("Account Data is undefined");
    const {
      tokenXMint,
      tokenYMint,
      tokenXVault,
      notEnoughLiquidity,
      poolState,
      tokenYVault,
      tokenXPythPrice,
      tokenYPythPrice,
    } = this.quoteInfos;
    const direction =
      `${quoteParams.sourceMint}` === `${tokenXMint.pubkey}`
        ? "xy"
        : `${quoteParams.sourceMint}` === `${tokenYMint}` && "yx";

    if (!direction) throw new Error("Mints do not align");

    return await this.quoteCalculator.getQuote(
      tokenXMint,
      tokenYMint,
      tokenXVault,
      tokenYVault,
      poolState,
      notEnoughLiquidity,
      tokenXPythPrice,
      tokenYPythPrice,
      quoteParams.amount,
      direction,
      quoteParams.sourceMint,
      LiquidityPoolsCalculator.create()
    );
  }
}
