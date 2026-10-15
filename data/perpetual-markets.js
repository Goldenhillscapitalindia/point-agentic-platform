// Researched market snapshot; update explicitly, never presented as a live feed.
(function(root){
  const snapshot = {
  "asOf": "2026-10-14T07:05:05Z",
  "asOfLabel": "14 Oct 2026, 12:35 p.m. IST / 07:05 UTC",
  "metric": "Reported rolling 24-hour perpetual trading volume in USD",
  "coverage": {
    "cex": 13,
    "dex": 29
  },
  "source": "https://loris.tools/markets/perps",
  "methodology": {
    "metric": "Reported rolling 24-hour USD notional perpetual volume",
    "source": "https://loris.tools/markets/perps",
    "candidate_screen": "50 largest symbols from https://loris.tools/volume/coin",
    "excluded": {
      "coinbaseus": "Perpetual-style contracts with expiry",
      "qfex": "Classification not independently confirmed"
    },
    "centralized_venues": [
      "binance",
      "bingx",
      "bitget",
      "bybit",
      "cryptocom",
      "deribit",
      "gateio",
      "huobi",
      "kalshi",
      "kucoin",
      "mexc",
      "okx",
      "phemex"
    ],
    "decentralized_or_hybrid_non_custodial_venues": [
      "arcus",
      "aster",
      "bluefin",
      "bullet",
      "decibel",
      "edgex",
      "entropyio",
      "extended",
      "grvt",
      "hibachi",
      "hyperliquid",
      "kinetiq",
      "lighter",
      "nado",
      "ondo",
      "ostium",
      "pacifica",
      "paradex",
      "phoenix",
      "polymarket",
      "reya",
      "rhlighter",
      "risex",
      "tradexyz",
      "txflow",
      "variational",
      "vest",
      "woofipro",
      "zo"
    ],
    "limitations": "Covered venues only, not exhaustive global coverage. Reported volumes are not independently audited. Source symbol normalization retained."
  },
  "cex": [
    {
      "rank": 1,
      "symbol": "BTC",
      "name": "Bitcoin",
      "assetType": "Crypto",
      "volumeUsd": 39233745987.1861,
      "venues": [
        "Binance",
        "Deribit",
        "OKX"
      ],
      "source": "https://loris.tools/markets/perps/btc"
    },
    {
      "rank": 2,
      "symbol": "ETH",
      "name": "Ether",
      "assetType": "Crypto",
      "volumeUsd": 26134879977.10298,
      "venues": [
        "Binance",
        "OKX",
        "Gate"
      ],
      "source": "https://loris.tools/markets/perps/eth"
    },
    {
      "rank": 3,
      "symbol": "SOL",
      "name": "Solana",
      "assetType": "Crypto",
      "volumeUsd": 5111097691.4991455,
      "venues": [
        "Binance",
        "OKX",
        "MEXC"
      ],
      "source": "https://loris.tools/markets/perps/sol"
    },
    {
      "rank": 4,
      "symbol": "ZEC",
      "name": "Zcash",
      "assetType": "Crypto",
      "volumeUsd": 5021349019.51625,
      "venues": [
        "Binance",
        "MEXC",
        "OKX"
      ],
      "source": "https://loris.tools/markets/perps/zec"
    },
    {
      "rank": 5,
      "symbol": "XAU",
      "name": "Gold",
      "assetType": "Commodity",
      "volumeUsd": 3949013943.1765003,
      "venues": [
        "Binance",
        "BingX",
        "Gate"
      ],
      "source": "https://loris.tools/markets/perps/xau"
    },
    {
      "rank": 6,
      "symbol": "SOXL",
      "name": "SOXL",
      "assetType": "Semiconductor ETF",
      "volumeUsd": 3823053151.2454,
      "venues": [
        "Binance",
        "OKX",
        "Bybit"
      ],
      "source": "https://loris.tools/markets/perps/soxl"
    },
    {
      "rank": 7,
      "symbol": "SNDK",
      "name": "Sandisk",
      "assetType": "Stock",
      "volumeUsd": 3208446824.84439,
      "venues": [
        "Binance",
        "OKX",
        "Bitget"
      ],
      "source": "https://loris.tools/markets/perps/sndk"
    },
    {
      "rank": 8,
      "symbol": "XRP",
      "name": "XRP",
      "assetType": "Crypto",
      "volumeUsd": 2220088966.9522605,
      "venues": [
        "MEXC",
        "Binance",
        "Bybit"
      ],
      "source": "https://loris.tools/markets/perps/xrp"
    },
    {
      "rank": 9,
      "symbol": "NEAR",
      "name": "NEAR",
      "assetType": "Crypto",
      "volumeUsd": 1990716780.2579148,
      "venues": [
        "Binance",
        "Bybit",
        "OKX"
      ],
      "source": "https://loris.tools/markets/perps/near"
    },
    {
      "rank": 10,
      "symbol": "SKHX",
      "name": "SK Hynix",
      "assetType": "Stock-linked market",
      "volumeUsd": 1625364353.10716,
      "venues": [
        "Binance",
        "OKX",
        "MEXC"
      ],
      "source": "https://loris.tools/markets/perps/skhx"
    }
  ],
  "dex": [
    {
      "rank": 1,
      "symbol": "BTC",
      "name": "Bitcoin",
      "assetType": "Crypto",
      "volumeUsd": 4897780621.861482,
      "venues": [
        "Hyperliquid",
        "Lighter",
        "Pacifica"
      ],
      "source": "https://loris.tools/markets/perps/btc"
    },
    {
      "rank": 2,
      "symbol": "ETH",
      "name": "Ether",
      "assetType": "Crypto",
      "volumeUsd": 2488715925.3375764,
      "venues": [
        "Hyperliquid",
        "Lighter",
        "Variational"
      ],
      "source": "https://loris.tools/markets/perps/eth"
    },
    {
      "rank": 3,
      "symbol": "NASDAQ100",
      "name": "Nasdaq-100",
      "assetType": "Equity index",
      "volumeUsd": 1212187870.210736,
      "venues": [
        "Variational",
        "Lighter",
        "Ondo Perps"
      ],
      "source": "https://loris.tools/markets/perps/nasdaq100"
    },
    {
      "rank": 4,
      "symbol": "SOL",
      "name": "Solana",
      "assetType": "Crypto",
      "volumeUsd": 641695676.1615753,
      "venues": [
        "Hyperliquid",
        "EdgeX",
        "Pacifica"
      ],
      "source": "https://loris.tools/markets/perps/sol"
    },
    {
      "rank": 5,
      "symbol": "SP500",
      "name": "S&P 500",
      "assetType": "Equity index",
      "volumeUsd": 626699911.3061547,
      "venues": [
        "Variational",
        "Trade[XYZ]",
        "Ondo Perps"
      ],
      "source": "https://loris.tools/markets/perps/sp500"
    },
    {
      "rank": 6,
      "symbol": "XAU",
      "name": "Gold",
      "assetType": "Commodity",
      "volumeUsd": 605125679.4188439,
      "venues": [
        "Aster",
        "Ondo Perps",
        "EdgeX"
      ],
      "source": "https://loris.tools/markets/perps/xau"
    },
    {
      "rank": 7,
      "symbol": "SNDK",
      "name": "Sandisk",
      "assetType": "Stock",
      "volumeUsd": 522567499.8657938,
      "venues": [
        "Trade[XYZ]",
        "Aster",
        "EntropyIO"
      ],
      "source": "https://loris.tools/markets/perps/sndk"
    },
    {
      "rank": 8,
      "symbol": "HYPE",
      "name": "Hyperliquid token",
      "assetType": "Crypto",
      "volumeUsd": 475145181.1890703,
      "venues": [
        "Hyperliquid",
        "Variational",
        "GRVT"
      ],
      "source": "https://loris.tools/markets/perps/hype"
    },
    {
      "rank": 9,
      "symbol": "ZEC",
      "name": "Zcash",
      "assetType": "Crypto",
      "volumeUsd": 394899162.656095,
      "venues": [
        "Hyperliquid",
        "Aster",
        "Lighter"
      ],
      "source": "https://loris.tools/markets/perps/zec"
    },
    {
      "rank": 10,
      "symbol": "SKHX",
      "name": "SK Hynix",
      "assetType": "Stock-linked market",
      "volumeUsd": 392669622.5692692,
      "venues": [
        "Trade[XYZ]",
        "Aster",
        "Lighter"
      ],
      "source": "https://loris.tools/markets/perps/skhx"
    }
  ],
  "contractRankings": {
    "asOfLabel": "15 Oct 2026 · approximately 9:29 a.m.–12:05 p.m. IST",
    "sourceLabel": "Verified exchange snapshots supplied for this static demo",
    "cex": [
      ["Binance", "BTC", "$80,942.06", "—", "—", "$23.12B", "$7.42B"],
      ["Binance", "ETH", "$2,363.63", "—", "—", "$18.96B", "$5.48B"],
      ["OKX", "ETH", "$2,371.20", "—", "—", "$10.44B", "$1.80B"],
      ["OKX", "BTC", "$81,376.90", "—", "—", "$9.54B", "$3.36B"],
      ["Gate.io", "ETH", "$2,355.98", "—", "—", "$8.13B", "$1.75B"],
      ["Gate.io", "BTC", "$80,849.00", "—", "—", "$7.94B", "$4.13B"],
      ["Deribit", "BTC", "$80,979.50", "—", "—", "$7.61B", "$1.03B"],
      ["Bybit", "BTC", "$80,772.80", "—", "—", "$6.98B", "$5.63B"],
      ["Bybit", "ETH", "$2,353.50", "—", "—", "$4.51B", "$2.14B"],
      ["Bybit", "XAU (Gold)", "$4,143.17", "—", "—", "$4.15B", "$623.93M"]
    ],
    "dex": [
      ["Hyperliquid", "BTC", "$80,755.37", "—", "—", "$4.06B", "$3.19B"],
      ["Hyperliquid", "ETH", "$2,353.70", "—", "—", "$1.81B", "$2.48B"],
      ["Variational", "NASDAQ100", "$29,613.30", "—", "—", "$1.77B", "$80.21M"],
      ["Lighter", "BTC", "$81,106.80", "—", "—", "$1.07B", "$315.51M"],
      ["Aster", "BTC", "$81,110.50", "—", "—", "$737.00M", "$449.18M"],
      ["Variational", "BTC", "$80,768.34", "—", "—", "$606.31M", "$194.02M"],
      ["Pacifica", "BTC", "$81,048.84", "—", "—", "$597.56M", "$43.30M"],
      ["Aster", "ETH", "$2,363.73", "—", "—", "$521.34M", "$203.70M"],
      ["edgeX", "ETH", "$2,346.98", "—", "—", "$517.81M", "$85.84M"],
      ["Lighter", "ETH", "$2,362.32", "—", "—", "$511.78M", "$147.66M"]
    ]
  }
};
  if(typeof module === "object" && module.exports) module.exports=snapshot;
  else root.PointPerpetualMarkets=snapshot;
})(typeof window !== "undefined" ? window : globalThis);
