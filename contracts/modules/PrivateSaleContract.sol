// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IReferralCenter {
    function registerReferral(address referrer) external;
    function registerReferralFor(address user, address referrer) external;
    function updatePoints(address user, uint256 amount) external;
    function checkBadgeEligibility(address user) external;
    function freezeBadges() external;
}

/**
 * @title PrivateSaleContract
 * @dev 私募合约，支持双池设计和推荐奖励
 */
contract PrivateSaleContract is Ownable, ReentrancyGuard {
    // 代币合约地址
    IERC20 public immutable sanciaToken;
    // USDT代币合约地址
    IERC20 public immutable usdtToken;
    // 推荐中心合约地址
    IReferralCenter public immutable referralCenter;
    
    // 私募参数
    uint256 public constant PRICE_PER_TOKEN = 1 * 10**17; // 1 SCIA = 0.1 USDT
    uint256 public constant PER_PACKAGE_USDT = 100 * 10**18; // 100 USDT per package
    uint256 public constant PER_PACKAGE_SCIAs = 1000 * 10**18; // 1000 SCIA per package
    uint256 public constant MIN_PACKAGES = 1; // Minimum 1 package
    uint256 public constant MAX_PACKAGES = 1000; // Maximum 1000 packages
    
    // 推荐奖励参数
    uint256 public constant REFERRAL_SCIAs_RATE = 500; // 5% SCIA reward
    uint256 public constant REFERRAL_USDT_RATE = 500; // 5% USDT reward
    uint256 public constant RATE_DENOMINATOR = 10000;
    
    // 池信息
    uint256 public immutable privateSalePoolSize = 1000000000 * 10**18; // 10亿 SCIA
    uint256 public immutable rewardPoolSize = 50000000 * 10**18; // 5千万 SCIA
    uint256 public privateSalePoolBalance = 0; // 私募池当前余额
    uint256 public rewardPoolBalance = 0; // 奖励池当前余额
    uint256 public totalSold = 0; // Total SCIA sold
    uint256 public totalRewardDistributed = 0; // Total SCIA rewards distributed
    
    // 销售状态
    bool public isPaused = false;
    bool public isEnded = false;
    
    // 购买记录
    mapping(address => uint256) public purchaseAmounts;
    
    // 事件定义
    event SaleStatusChanged(bool isPaused, bool isEnded);
    event TokensPurchased(address indexed buyer, uint256 usdtAmount, uint256 sciaAmount, address referrer);
    event ReferralRewardDistributed(address indexed referrer, uint256 sciaReward, uint256 usdtReward);
    event SaleEnded(uint256 totalSold, uint256 totalRewardDistributed);
    
    /**
     * @dev 构造函数
     * @param initialOwner 初始所有者地址
     * @param _sanciaToken SCIA代币合约地址
     * @param _usdtToken USDT代币合约地址
     * @param _referralCenter 推荐中心合约地址
     */
    constructor(
        address initialOwner,
        address _sanciaToken,
        address _usdtToken,
        address _referralCenter
    ) Ownable(initialOwner) {
        require(_sanciaToken != address(0), "Invalid SCIA token address");
        require(_usdtToken != address(0), "Invalid USDT token address");
        require(_referralCenter != address(0), "Invalid referral center address");
        
        sanciaToken = IERC20(_sanciaToken);
        usdtToken = IERC20(_usdtToken);
        referralCenter = IReferralCenter(_referralCenter);
    }
    
    /**
     * @dev 销售状态修饰符
     */
    modifier saleActive() {
        require(!isPaused && !isEnded, "Sale is paused or ended");
        require(totalSold < privateSalePoolSize, "Private sale pool is sold out");
        _;
    }
    
    /**
     * @dev 设置销售状态
     * @param _isPaused 是否暂停
     */
    function setSaleStatus(bool _isPaused) external onlyOwner {
        isPaused = _isPaused;
        emit SaleStatusChanged(_isPaused, isEnded);
    }
    
    /**
     * @dev 结束销售
     */
    function endSale() external onlyOwner {
        isEnded = true;
        emit SaleEnded(totalSold, totalRewardDistributed);
        emit SaleStatusChanged(isPaused, true);
        
        // 自动冻结徽章状态
        referralCenter.freezeBadges();
    }
    
    /**
     * @dev 向池中存入代币
     * @param privateSaleAmount 存入私募池的SCIA数量
     * @param rewardAmount 存入奖励池的SCIA数量
     */
    function depositTokens(uint256 privateSaleAmount, uint256 rewardAmount) external onlyOwner {
        require(privateSaleAmount + privateSalePoolBalance <= privateSalePoolSize, "Exceeds private sale pool size");
        require(rewardAmount + rewardPoolBalance <= rewardPoolSize, "Exceeds reward pool size");
        
        // 从owner转移代币到合约
        require(sanciaToken.transferFrom(msg.sender, address(this), privateSaleAmount + rewardAmount), "Token transfer failed");
        
        // 更新池余额
        privateSalePoolBalance += privateSaleAmount;
        rewardPoolBalance += rewardAmount;
    }
    

    
    /**
     * @dev 购买代币
     * @param packages 购买份数
     * @param referrer 推荐人地址
     */
    function buyTokens(uint256 packages, address referrer) external nonReentrant saleActive {
        require(packages >= MIN_PACKAGES, "Amount below minimum packages");
        require(packages <= MAX_PACKAGES, "Amount above maximum packages");
        
        // 计算金额和代币数量
        uint256 usdtAmount = packages * PER_PACKAGE_USDT;
        uint256 sciaAmount = packages * PER_PACKAGE_SCIAs;
        
        // 检查私募池是否足够
        require(sciaAmount <= privateSalePoolBalance, "Insufficient tokens in private sale pool");
        require(totalSold + sciaAmount <= privateSalePoolSize, "Exceeds private sale pool size");
        
        // 转移USDT到合约
        require(usdtToken.transferFrom(msg.sender, address(this), usdtAmount), "USDT transfer failed");
        
        // 转移SCIA代币给买家
        require(sanciaToken.transfer(msg.sender, sciaAmount), "SCIA transfer failed");
        privateSalePoolBalance -= sciaAmount;
        
        // 处理推荐奖励
        if (referrer != address(0) && referrer != msg.sender) {
            // 注册推荐关系 - 为购买者注册，而不是为合约注册
            referralCenter.registerReferralFor(msg.sender, referrer);
            
            // 计算推荐奖励
            uint256 sciaReward = sciaAmount * REFERRAL_SCIAs_RATE / RATE_DENOMINATOR;
            uint256 usdtReward = usdtAmount * REFERRAL_USDT_RATE / RATE_DENOMINATOR;
            
            // 检查奖励池是否足够
            require(sciaReward <= rewardPoolBalance, "Insufficient tokens in reward pool");
            require(totalRewardDistributed + sciaReward <= rewardPoolSize, "Exceeds reward pool size");
            
            // 转移SCIA奖励给推荐人
            require(sanciaToken.transfer(referrer, sciaReward), "SCIA reward transfer failed");
            rewardPoolBalance -= sciaReward;
            
            // 转移USDT奖励给推荐人
            require(usdtToken.transfer(referrer, usdtReward), "USDT reward transfer failed");
            
            // 更新推荐奖励分发记录
            totalRewardDistributed += sciaReward;
            
            // 推荐人会通过updatePoints的内部逻辑自动获得积分（因为购买者的积分会沿着推荐链传递）
            // 检查推荐人徽章资格
            referralCenter.checkBadgeEligibility(referrer);
            
            emit ReferralRewardDistributed(referrer, sciaReward, usdtReward);
        }
        
        // 给购买者更新积分
        referralCenter.updatePoints(msg.sender, usdtAmount);
        // 检查购买者徽章资格
        referralCenter.checkBadgeEligibility(msg.sender);
        
        // 更新购买记录
        purchaseAmounts[msg.sender] += usdtAmount;
        totalSold += sciaAmount;
        
        // 检查是否售罄
        if (totalSold >= privateSalePoolSize || privateSalePoolBalance == 0) {
            isEnded = true;
            emit SaleEnded(totalSold, totalRewardDistributed);
            emit SaleStatusChanged(isPaused, true);
            
            // 自动冻结徽章状态
            referralCenter.freezeBadges();
        }
        
        emit TokensPurchased(msg.sender, usdtAmount, sciaAmount, referrer);
    }
    
    /**
     * @dev 提取USDT
     * @param amount 提取金额
     */
    function withdrawUSDT(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= usdtToken.balanceOf(address(this)), "Insufficient USDT balance");
        require(usdtToken.transfer(msg.sender, amount), "USDT withdrawal failed");
    }
    
    /**
     * @dev 紧急提币 - 提取合约中的SCIA代币
     * @param amount 提取金额
     */
    function emergencyWithdrawTokens(uint256 amount) external onlyOwner nonReentrant {
        require(sanciaToken.transfer(msg.sender, amount), "Token withdrawal failed");
    }
    
    /**
     * @dev 获取池信息
     */
    function getPoolInfo() external view returns (
        uint256 remainingPrivateSale, 
        uint256 remainingRewardPool,
        uint256 currentPrivateSaleBalance,
        uint256 currentRewardPoolBalance,
        uint256 totalSoldSCIA,
        uint256 totalRewardDistributedSCIA
    ) {
        remainingPrivateSale = privateSalePoolSize - totalSold;
        remainingRewardPool = rewardPoolSize - totalRewardDistributed;
        currentPrivateSaleBalance = privateSalePoolBalance;
        currentRewardPoolBalance = rewardPoolBalance;
        totalSoldSCIA = totalSold;
        totalRewardDistributedSCIA = totalRewardDistributed;
    }
}
