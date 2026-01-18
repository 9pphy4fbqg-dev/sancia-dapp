// ReferralCenter ABI - Updated based on actual contract implementation
export const referralCenterAbi = [
  {
    "inputs": [
      { "name": "initialOwner", "type": "address" },
      { "name": "_usdtToken", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "name": "badgeLevel", "type": "uint8" },
      { "indexed": false, "name": "amount", "type": "uint256" }
    ],
    "name": "BadgePoolFunded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "user", "type": "address" },
      { "indexed": false, "name": "badgeLevel", "type": "uint8" },
      { "indexed": false, "name": "timestamp", "type": "uint256" }
    ],
    "name": "BadgeAchieved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "BadgesFrozen",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "name": "timestamp", "type": "uint256" },
      { "indexed": false, "name": "expiresAt", "type": "uint256" }
    ],
    "name": "DividendPeriodUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "user", "type": "address" },
      { "indexed": true, "name": "badgeLevel", "type": "uint8" },
      { "indexed": false, "name": "amount", "type": "uint256" }
    ],
    "name": "DividendClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "user", "type": "address" },
      { "indexed": false, "name": "badgeLevel", "type": "uint8" },
      { "indexed": false, "name": "amount", "type": "uint256" }
    ],
    "name": "DividendDistributed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "sender", "type": "address" },
      { "indexed": false, "name": "amount", "type": "uint256" }
    ],
    "name": "FundsReceived",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "user", "type": "address" },
      { "indexed": false, "name": "oldPoints", "type": "uint256" },
      { "indexed": false, "name": "newPoints", "type": "uint256" }
    ],
    "name": "PointsUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "user", "type": "address" },
      { "indexed": true, "name": "referrer", "type": "address" }
    ],
    "name": "ReferralRegistered",
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
    "inputs": [
      { "name": "user", "type": "address" }
    ],
    "name": "checkBadgeEligibility",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "badgeLevel", "type": "uint8" }
    ],
    "name": "claimDividend",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "amount", "type": "uint256" }
    ],
    "name": "fundBadgePool",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "userPoints", "type": "uint256" }
    ],
    "name": "getEligibleBadgeLevel",
    "outputs": [{ "name": "", "type": "uint8" }],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "freezeBadges",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "addr", "type": "address" }
    ],
    "name": "hasReferrerEligibility",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "user", "type": "address" }
    ],
    "name": "getUserBadgeInfo",
    "outputs": [
      { "name": "badgeLevel", "type": "uint8" },
      { "name": "userPoints", "type": "uint256" },
      { "name": "nextBadgeThreshold", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "user", "type": "address" }
    ],
    "name": "getUserClaimableDividends",
    "outputs": [{ "name": "totalClaimable", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "currentBadge", "type": "uint8" }
    ],
    "name": "getNextBadgeThreshold",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "badgeLevel", "type": "uint8" }
    ],
    "name": "getBadgeCount",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "referrer", "type": "address" }
    ],
    "name": "registerReferral",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "referrer", "type": "address" }
    ],
    "name": "registerReferralFor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "_privateSaleContract", "type": "address" }
    ],
    "name": "setPrivateSaleContract",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "updatePoints",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "user", "type": "address" }
    ],
    "name": "referrers",
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "referrer", "type": "address" },
      { "name": "index", "type": "uint256" }
    ],
    "name": "referrals",
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "user", "type": "address" }
    ],
    "name": "points",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "user", "type": "address" }
    ],
    "name": "userBadges",
    "outputs": [{ "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "badgeLevel", "type": "uint8" },
      { "name": "index", "type": "uint256" }
    ],
    "name": "badgeHolders",
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "badgeLevel", "type": "uint8" }
    ],
    "name": "badgeCounts",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isBadgeFrozen",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
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
      { "name": "badgeLevel", "type": "uint8" }
    ],
    "name": "badgePools",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "badgeLevel", "type": "uint8" }
    ],
    "name": "currentDividendPerBadge",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "badgeLevel", "type": "uint8" }
    ],
    "name": "hasClaimedCurrent",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentDividendTimestamp",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentDividendExpiresAt",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "privateSaleContract",
    "outputs": [{ "name": "", "type": "address" }],
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
    "inputs": [],
    "name": "renounceOwnership",
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
  }
] as const;