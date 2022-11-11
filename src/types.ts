import {
  AccountData,
  PoolState,
  TokenAccount,
  TokenMint,
} from "@hydraprotocol/sdk";
import { PriceData } from "@pythnetwork/client";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import JSBI from "jsbi";

export type TokenMintAddress = string;

export interface Quote {
  notEnoughLiquidity: boolean;
  inAmount: JSBI;
  outAmount: JSBI;
  feeAmount: JSBI;
  feeMint: TokenMintAddress;
  feePct: number;
  priceImpactPct: number;
}

export type AccountInfoMap = Map<string, AccountInfo<Buffer> | null>;

export enum SwapMode {
  ExactIn = "ExactIn",
  ExactOut = "ExactOut",
}

export interface QuoteParams {
  sourceMint: PublicKey;
  destinationMint: PublicKey;
  amount: JSBI;
  swapMode: SwapMode;
}

export type AccountDatas = {
  tokenXMint: AccountData<TokenMint>;
  tokenYMint: AccountData<TokenMint>;
  tokenXVault: AccountData<TokenAccount>;
  tokenYVault: AccountData<TokenAccount>;
  poolState: AccountData<PoolState>;
  notEnoughLiquidity: boolean;
  tokenXPythPrice: PriceData;
  tokenYPythPrice: PriceData;
};

export interface Amm {
  reserveTokenMints: PublicKey[];
  getAccountsForUpdate(): PublicKey[];
  update(accountInfoMap: AccountInfoMap): void;
  getQuote(quoteParams: QuoteParams): Promise<Quote>;
}
