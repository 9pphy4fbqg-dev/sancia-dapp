// PrivateSaleContract ABI - Updated based on actual contract implementation
export const privateSaleAbi = [
  {
    "inputs": [
      { "name": "initialOwner", "type": "address" },
      { "name": "_sanciaToken", "type": "address" },
      { "name": "_usdtToken", "type": "address" },
      { "name": "_referralCenter", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },

  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "referrer", "type": "address" },
      { "indexed": false, "name": "sciaReward", "type": "uint256" },
      { "indexed": false, "name": "usdtReward", "type": "uint256" }
    ],
    "name": "ReferralRewardDistributed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "previousOwner", "type": "address" },
      { "indexed": true, "name": "newOwner", "type": "address" }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "name": "isPaused", "type": "bool" },
      { "indexed": false, "name": "isEnded", "type": "bool" }
    ],
    "name": "SaleStatusChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "name": "totalSold", "type": "uint256" },
      { "indexed": false, "name": "totalRewardDistributed", "type": "uint256" }
    ],
    "name": "SaleEnded",
    "type": "event"
  },

  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "buyer", "type": "address" },
      { "indexed": false, "name": "usdtAmount", "type": "uint256" },
      { "indexed": false, "name": "sciaAmount", "type": "uint256" },
      { "indexed": true, "name": "referrer", "type": "address" }
    ],
    "name": "TokensPurchased",
    "type": "event"
  },

  {
    "inputs": [
      { "name": "packages", "type": "uint256" },
      { "name": "referrer", "type": "address" }
    ],
    "name": "buyTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "privateSaleAmount", "type": "uint256" },
      { "name": "rewardAmount", "type": "uint256" }
    ],
    "name": "depositTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "amount", "type": "uint256" }
    ],
    "name": "emergencyWithdrawTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "endSale",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPoolInfo",
    "outputs": [
      { "name": "remainingPrivateSale", "type": "uint256" },
      { "name": "remainingRewardPool", "type": "uint256" },
      { "name": "currentPrivateSaleBalance", "type": "uint256" },
      { "name": "currentRewardPoolBalance", "type": "uint256" },
      { "name": "totalSoldSCIA", "type": "uint256" },
      { "name": "totalRewardDistributedSCIA", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isEnded",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isPaused",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "addr", "type": "address" }
    ],
    "name": "owner",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "owner", "type": "address" }
    ],
    "name": "purchaseAmounts",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "privateSalePoolSize",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "referralCenter",
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rewardPoolSize",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "_isPaused", "type": "bool" }
    ],
    "name": "setSaleStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "newOwner", "type": "address" }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdtToken",
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "amount", "type": "uint256" }
    ],
    "name": "withdrawUSDT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;