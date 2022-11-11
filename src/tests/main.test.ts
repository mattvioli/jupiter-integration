import { HydraAmm, AccountInfoMap, SwapMode } from "..";
import { Network, Parsers } from "@hydraprotocol/sdk";
import { AccountInfo, PublicKey } from "@solana/web3.js";
import JSBI from "jsbi";
import { FakeParsers } from "./fakeParsers";

describe("HydraAmm for Jupiter", () => {
  it("Updates the accounts and returns the quote", async () => {
    const parsers = new FakeParsers() as unknown as Parsers;
    const poolKey = "qyA5uS1i95LVo9dDZjfqoWwTVNTEv784TzhcdBz2cAv";
    const demoAccountInfo = {} as unknown as AccountInfo<Buffer>;

    const HydraAMM = new HydraAmm(
      new PublicKey(poolKey),
      demoAccountInfo,
      Network.LOCALNET,
      parsers
    );

    const QuoteParams = {
      sourceMint: new PublicKey("So11111111111111111111111111111111111111112"),
      destinationMint: new PublicKey(
        "usdKFrwicfVCmFMHDLM1SKeTEhzFFnHR4gMNzauRr5f"
      ),
      amount: JSBI.BigInt(50000000),
      swapMode: "exactIn" as SwapMode,
    };

    HydraAMM.update(
      new Map([
        [poolKey, poolKey],
        ["So11111111111111111111111111111111111111112", "x"],
        ["usdKFrwicfVCmFMHDLM1SKeTEhzFFnHR4gMNzauRr5f", "y"],
        ["AM3Lsq37KAs5t6rSCML6kbJpb5USsB41pz5aBfRKXcS5", "x"],
        ["8hhWYsCatDMWE2qrkf72meMQC3xjur3kHZNfZVcburY3", "y"],
        ["11111111111111111111111111111111", "x"],
      ]) as any as AccountInfoMap
    );

    expect(await HydraAMM.getQuote(QuoteParams)).toStrictEqual({
      feeAmount: JSBI.BigInt(25000),
      feeMint: "So11111111111111111111111111111111111111112",
      feePct: 0.05,
      inAmount: JSBI.BigInt(50000000),
      notEnoughLiquidity: false,
      outAmount: JSBI.BigInt(5499725),
      priceImpactPct: 0.004749774385716678,
    });
  });
});
