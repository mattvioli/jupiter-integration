export class FakeParsers {
  constructor() {}

  poolState = () => {
    return () => {
      return {
        tokenXMint: "So11111111111111111111111111111111111111112",
        tokenYMint: "usdKFrwicfVCmFMHDLM1SKeTEhzFFnHR4gMNzauRr5f",
        tokenXVault: "AM3Lsq37KAs5t6rSCML6kbJpb5USsB41pz5aBfRKXcS5",
        tokenYVault: "8hhWYsCatDMWE2qrkf72meMQC3xjur3kHZNfZVcburY3",
        prices: {
          priceAccountX: "11111111111111111111111111111111",
          priceAccountY: "11111111111111111111111111111111",
        },
        cValue: 0,
        fees: {
          feeCalculation: "Percent",
          feeMinPct: 500000000,
          feeMaxPct: 20000000000,
          feeLastUpdate: 0,
          feeLastPrice: 0,
          feeLastEwma: 17836758,
          feeEwmaWindow: 3600,
          feeLambda: 545000000000,
          feeVelocity: 4166666667,
        },
      };
    };
  };

  tokenMint = () => {
    return (token: string) => {
      return token === "x" ? { decimals: 9 } : { decimals: 6 };
    };
  };

  tokenAccount = () => {
    return (token: string) => {
      return token === "x"
        ? { amount: 1000000000000n }
        : { amount: 110000000000n };
    };
  };

  pythPriceData = () => {
    return function pythPriceParser() {
      return {};
    };
  };
}
