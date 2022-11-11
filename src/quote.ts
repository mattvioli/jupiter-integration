import {
  AccountData,
  Decimal,
  LiquidityPoolsCalculator,
  PoolState,
  TokenAccount,
  TokenMint,
} from "@hydraprotocol/sdk";
import { PriceData } from "@pythnetwork/client";
import { PublicKey } from "@solana/web3.js";
import JSBI from "jsbi";
import { Quote } from "./types";

const COMPUTE_SCALE = 12n;

export class QuoteCalculator {
  constructor() {}

  public getQuote = async (
    tokenXMint: AccountData<TokenMint>,
    tokenYMint: AccountData<TokenMint>,
    tokenXVault: AccountData<TokenAccount>,
    tokenYVault: AccountData<TokenAccount>,
    poolState: AccountData<PoolState>,
    notEnoughLiquidity: boolean,
    tokenXPythPrice: PriceData,
    tokenYPythPrice: PriceData,
    amount: JSBI,
    direction: "xy" | "yx",
    sourceMint: PublicKey,
    calculator: LiquidityPoolsCalculator
  ): Promise<Quote> => {
    const swap = await calculator.calculateSwap(
      tokenXMint,
      tokenYMint,
      tokenXVault,
      tokenYVault,
      poolState,
      BigInt(amount.toString()),
      direction,
      console.log,
      Decimal.fromNumber(tokenXPythPrice.price || 0),
      Decimal.fromNumber(tokenYPythPrice.price || 0)
    );
    const fees = await calculator.calculateFees(
      tokenXMint,
      tokenYMint,
      poolState,
      BigInt(amount.toString()),
      direction,
      BigInt(Math.round(Date.now() / 1000)),
      console.log,
      Decimal.fromNumber(tokenXPythPrice.price || 0),
      Decimal.fromNumber(tokenYPythPrice.price || 0)
    );

    const feeAmount = JSBI.BigInt(fees[0].toString());
    const feePct = Decimal.from(fees[1], COMPUTE_SCALE)
      .mul(Decimal.from(100n))
      .toNumber();
    const inAmount =
      direction === "xy"
        ? JSBI.BigInt(swap[0].toString())
        : JSBI.BigInt(swap[1].toString());
    const outAmount =
      direction === "xy"
        ? JSBI.BigInt(swap[1].toString())
        : JSBI.BigInt(swap[0].toString());

    // Calculations for price impact
    const amountInForImpact =
      direction === "xy"
        ? Decimal.from(swap[0], BigInt(tokenXMint.account.data.decimals))
        : Decimal.from(swap[1], BigInt(tokenYMint.account.data.decimals));
    const amountInWithFee = amountInForImpact.toNumber() * (1 - feePct);
    const tokenAInitial =
      direction === "xy"
        ? tokenXVault.account.data.amount
        : tokenYVault.account.data.amount;
    const tokenAMint =
      direction === "xy" ? tokenXMint.account : tokenYMint.account;

    const tokenAInitialNumber = Decimal.from(
      tokenAInitial,
      BigInt(tokenAMint.data.decimals)
    ).toNumber();

    const priceImpactPct =
      (amountInWithFee / (tokenAInitialNumber + amountInWithFee)) * 100;

    return {
      notEnoughLiquidity,
      inAmount,
      outAmount,
      feeAmount,
      feeMint: sourceMint.toString(),
      feePct,
      priceImpactPct,
    };
  };

  static create() {
    return new QuoteCalculator();
  }
}
