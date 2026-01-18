// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// 私募合约接口定义
interface IPrivateSaleContract {
    function purchaseAmounts(address user) external view returns (uint256);
}

/**
 * @title ReferralCenter
 * @dev 推荐中心合约，实现积分和徽章系统
 */
contract ReferralCenter is Ownable, ReentrancyGuard {
    // 推荐关系
    mapping(address => address) public referrers; // 用户 -> 推荐人
    mapping(address => address[]) public referrals; // 推荐人 -> 被推荐人列表
    
    // 积分系统
    mapping(address => uint256) public points; // 用户 -> 积分
    
    // 徽章系统
    enum BadgeLevel {
        None,     // 0 - 无徽章
        Member,   // 1 - 会员徽章
        City,     // 2 - 市级徽章
        Province, // 3 - 省级徽章
        National  // 4 - 国级徽章
    }
    
    // 徽章阈值（积分）
    uint256 public constant MEMBER_BADGE_THRESHOLD = 1100 * 10**18;    // 1100积分
    uint256 public constant CITY_BADGE_THRESHOLD = 5500 * 10**18;     // 5500积分
    uint256 public constant PROVINCE_BADGE_THRESHOLD = 27500 * 10**18;   // 27500积分
    uint256 public constant NATIONAL_BADGE_THRESHOLD = 137500 * 10**18;  // 137500积分
    
    // 用户当前徽章
    mapping(address => BadgeLevel) public userBadges; // 用户 -> 当前徽章等级
    
    // 徽章持有者列表
    mapping(BadgeLevel => address[]) public badgeHolders; // 徽章等级 -> 持有者列表
    
    // 徽章数量统计
    mapping(BadgeLevel => uint256) public badgeCounts; // 徽章等级 -> 数量
    
    // 徽章冻结状态
    bool public isBadgeFrozen = false;
    
    // USDT代币合约地址（用于分红）
    IERC20 public immutable usdtToken;
    
    // 分红状态变量
    mapping(BadgeLevel => uint256) public badgePools; // 各徽章池当前金额
    mapping(BadgeLevel => uint256) public currentDividendPerBadge; // 当前单份分红金额
    mapping(address => mapping(BadgeLevel => bool)) public hasClaimedCurrent; // 用户领取状态
    uint256 public currentDividendTimestamp; // 当前分红周期开始时间
    uint256 public currentDividendExpiresAt; // 当前分红过期时间
    
    // 事件定义
    event ReferralRegistered(address indexed user, address indexed referrer);
    event PointsUpdated(address indexed user, uint256 oldPoints, uint256 newPoints);
    event BadgeAchieved(address indexed user, BadgeLevel badgeLevel, uint256 timestamp);
    event BadgePoolFunded(BadgeLevel badgeLevel, uint256 amount);
    event DividendDistributed(address indexed user, BadgeLevel badgeLevel, uint256 amount);
    event FundsReceived(address indexed sender, uint256 amount);
    event BadgesFrozen();
    event DividendClaimed(address indexed user, uint8 indexed badgeLevel, uint256 amount);
    event DividendPeriodUpdated(uint256 timestamp, uint256 expiresAt);
    
    /**
     * @dev 构造函数
     * @param initialOwner 初始所有者地址
     * @param _usdtToken USDT代币合约地址
     */
    constructor(address initialOwner, address _usdtToken) Ownable(initialOwner) {
        require(_usdtToken != address(0), "Invalid USDT token address");
        usdtToken = IERC20(_usdtToken);
        // Solidity中mapping和数组默认值为0/empty，无需显式初始化
    }
    
    /**
     * @dev 注册推荐关系
     * @param referrer 推荐人地址
     * 一个钱包地址永久只允许绑定一个推荐人，不允许修改换绑
     */
    function registerReferral(address referrer) external nonReentrant {
        // 如果用户已经有推荐人，直接返回，不允许修改
        if (referrers[_msgSender()] != address(0)) {
            return;
        }
        
        require(referrer != address(0), "Invalid referrer address");
        require(referrer != _msgSender(), "Cannot refer yourself");
        require(hasReferrerEligibility(referrer), "Referrer must have purchased tokens");
        
        // 检查推荐关系循环
        require(!hasCircularReference(_msgSender(), referrer), "Circular referral relationship detected");
        
        // 注册推荐关系（永久绑定）
        referrers[_msgSender()] = referrer;
        referrals[referrer].push(_msgSender());
        
        emit ReferralRegistered(_msgSender(), referrer);
    }
    
    /**
     * @dev 为指定用户注册推荐关系（仅私募合约可调用）
     * @param user 用户地址
     * @param referrer 推荐人地址
     * 允许私募合约为购买者注册推荐关系
     */
    function registerReferralFor(address user, address referrer) external nonReentrant {
        // 只允许私募合约调用
        require(msg.sender == privateSaleContract, "Unauthorized: Only private sale contract can call this function");
        
        // 如果用户已经有推荐人，直接返回，不允许修改
        if (referrers[user] != address(0)) {
            return;
        }
        
        require(referrer != address(0), "Invalid referrer address");
        require(referrer != user, "Cannot refer yourself");
        require(hasReferrerEligibility(referrer), "Referrer must have purchased tokens");
        
        // 检查推荐关系循环
        require(!hasCircularReference(user, referrer), "Circular referral relationship detected");
        
        // 注册推荐关系（永久绑定）
        referrers[user] = referrer;
        referrals[referrer].push(user);
        
        emit ReferralRegistered(user, referrer);
    }
    
    /**
     * @dev 更新用户积分
     * @param user 用户地址
     * @param amount 增加的积分（USDT金额，1 USDT = 1积分）
     */
    function updatePoints(address user, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        // 首先给当前用户增加积分
        uint256 oldPoints = points[user];
        uint256 newPoints = oldPoints + amount;
        
        points[user] = newPoints;
        
        emit PointsUpdated(user, oldPoints, newPoints);
        
        // 然后沿着推荐链向上传递积分，无限代都获得积分
        address currentReferrer = referrers[user];
        
        while (currentReferrer != address(0)) {
            oldPoints = points[currentReferrer];
            newPoints = oldPoints + amount;
            
            points[currentReferrer] = newPoints;
            
            emit PointsUpdated(currentReferrer, oldPoints, newPoints);
            
            // 继续向上查找推荐人
            currentReferrer = referrers[currentReferrer];
        }
    }
    
    /**
     * @dev 检查并发放徽章
     * @param user 用户地址
     */
    function checkBadgeEligibility(address user) external nonReentrant {
        // 检查徽章是否已冻结
        if (isBadgeFrozen) {
            return;
        }
        
        uint256 userPoints = points[user];
        BadgeLevel currentBadge = userBadges[user];
        BadgeLevel newBadge = getEligibleBadgeLevel(userPoints);
        
        // 注意：本系统积分只增不减，因此徽章一旦获得永不降级。
        // 若未来需支持积分减少，请实现徽章降级逻辑。
        // 如果新徽章等级高于当前徽章，更新徽章
        if (newBadge > currentBadge) {
            // 处理旧徽章
            if (currentBadge != BadgeLevel.None) {
                // 减少旧徽章数量
                badgeCounts[currentBadge] -= 1;
                
                // 从旧徽章持有者列表中移除用户
                address[] storage oldHolders = badgeHolders[currentBadge];
                for (uint256 i = 0; i < oldHolders.length; i++) {
                    if (oldHolders[i] == user) {
                        // 用最后一个元素替换当前元素，然后删除最后一个元素
                        oldHolders[i] = oldHolders[oldHolders.length - 1];
                        oldHolders.pop();
                        break;
                    }
                }
            }
            
            // 处理新徽章
            // 增加新徽章数量
            badgeCounts[newBadge] += 1;
            
            // 将用户添加到新徽章持有者列表
            badgeHolders[newBadge].push(user);
            
            // 更新用户徽章
            userBadges[user] = newBadge;
            
            // 触发徽章获得事件
            emit BadgeAchieved(user, newBadge, block.timestamp);
        }
    }
    
    /**
     * @dev 根据积分获取用户符合条件的最高徽章等级
     * @param userPoints 用户积分
     * @return 符合条件的最高徽章等级
     */
    function getEligibleBadgeLevel(uint256 userPoints) public pure returns (BadgeLevel) {
        if (userPoints >= NATIONAL_BADGE_THRESHOLD) {
            return BadgeLevel.National;
        } else if (userPoints >= PROVINCE_BADGE_THRESHOLD) {
            return BadgeLevel.Province;
        } else if (userPoints >= CITY_BADGE_THRESHOLD) {
            return BadgeLevel.City;
        } else if (userPoints >= MEMBER_BADGE_THRESHOLD) {
            return BadgeLevel.Member;
        } else {
            return BadgeLevel.None;
        }
    }
    

    
    // 私募合约地址
    address public privateSaleContract;
    
    /**
     * @dev 设置私募合约地址
     * @param _privateSaleContract 私募合约地址
     */
    function setPrivateSaleContract(address _privateSaleContract) external onlyOwner {
        require(_privateSaleContract != address(0), "Invalid contract address");
        privateSaleContract = _privateSaleContract;
    }
    
    /**
     * @dev 检查地址是否有推荐人资格（必须购买过代币）
     * @param addr 要检查的地址
     * @return 是否有推荐人资格
     */
    function hasReferrerEligibility(address addr) public view returns (bool) {
        // 如果私募合约未设置，默认允许（兼容旧版本）
        if (privateSaleContract == address(0)) {
            return true;
        }
        
        // 检查该地址是否有购买记录
        IPrivateSaleContract privateSale = IPrivateSaleContract(privateSaleContract);
        return privateSale.purchaseAmounts(addr) > 0;
    }
    
    /**
     * @dev 冻结徽章状态
     * 私募结束后调用，固化所有徽章状态
     * 允许私募合约调用
     */
    function freezeBadges() external nonReentrant {
        require(msg.sender == owner() || msg.sender == privateSaleContract, "Unauthorized");
        require(!isBadgeFrozen, "Badges already frozen");
        
        isBadgeFrozen = true;
        emit BadgesFrozen();
    }
    
    /**
     * @dev 社区金库转入资金时调用，自动分配到4个分红池
     * @param amount 转入金额
     */
    function fundBadgePool(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        
        // 检查是否从USDT合约收到了足额资金
        require(usdtToken.balanceOf(address(this)) >= amount, "Insufficient USDT received");
        
        // 按比例分配到4个徽章池（各25%）
        uint256 memberAmount = amount * 25 / 100;
        uint256 cityAmount = amount * 25 / 100;
        uint256 provinceAmount = amount * 25 / 100;
        uint256 nationalAmount = amount * 25 / 100;
        
        // 将新资金添加到各自的徽章池，保留未领取的资金
        badgePools[BadgeLevel.Member] += memberAmount;
        badgePools[BadgeLevel.City] += cityAmount;
        badgePools[BadgeLevel.Province] += provinceAmount;
        badgePools[BadgeLevel.National] += nationalAmount;
        
        // 自动计算单份分红金额
        if (badgeCounts[BadgeLevel.Member] > 0) {
            currentDividendPerBadge[BadgeLevel.Member] = badgePools[BadgeLevel.Member] / badgeCounts[BadgeLevel.Member];
        } else {
            currentDividendPerBadge[BadgeLevel.Member] = 0;
        }
        
        if (badgeCounts[BadgeLevel.City] > 0) {
            currentDividendPerBadge[BadgeLevel.City] = badgePools[BadgeLevel.City] / badgeCounts[BadgeLevel.City];
        } else {
            currentDividendPerBadge[BadgeLevel.City] = 0;
        }
        
        if (badgeCounts[BadgeLevel.Province] > 0) {
            currentDividendPerBadge[BadgeLevel.Province] = badgePools[BadgeLevel.Province] / badgeCounts[BadgeLevel.Province];
        } else {
            currentDividendPerBadge[BadgeLevel.Province] = 0;
        }
        
        if (badgeCounts[BadgeLevel.National] > 0) {
            currentDividendPerBadge[BadgeLevel.National] = badgePools[BadgeLevel.National] / badgeCounts[BadgeLevel.National];
        } else {
            currentDividendPerBadge[BadgeLevel.National] = 0;
        }
        
        // 更新分红周期
        currentDividendTimestamp = block.timestamp;
        currentDividendExpiresAt = block.timestamp + 29 days + 23 hours + 30 minutes;
        
        emit DividendPeriodUpdated(currentDividendTimestamp, currentDividendExpiresAt);
    }
    
    /**
     * @dev 用户手动领取分红
     * @param badgeLevel 徽章等级
     */
    function claimDividend(BadgeLevel badgeLevel) external nonReentrant {
        require(userBadges[msg.sender] == badgeLevel, "Not eligible for this badge");
        require(block.timestamp <= currentDividendExpiresAt, "Dividend expired");
        require(!hasClaimedCurrent[msg.sender][badgeLevel], "Already claimed");
        
        uint256 dividendAmount = currentDividendPerBadge[badgeLevel];
        require(dividendAmount > 0, "No dividend available");
        
        // 标记为已领取
        hasClaimedCurrent[msg.sender][badgeLevel] = true;
        
        // 转账USDT
        require(usdtToken.transfer(msg.sender, dividendAmount), "Transfer failed");
        
        // 从徽章池扣除金额
        badgePools[badgeLevel] -= dividendAmount;
        
        emit DividendClaimed(msg.sender, uint8(badgeLevel), dividendAmount);
    }
    
    /**
     * @dev 获取用户徽章信息
     * @param user 用户地址
     * @return badgeLevel 用户当前徽章等级
     * @return userPoints 用户积分
     * @return nextBadgeThreshold 下一等级徽章需要的积分
     */
    function getUserBadgeInfo(address user) external view returns (
        BadgeLevel badgeLevel,
        uint256 userPoints,
        uint256 nextBadgeThreshold
    ) {
        badgeLevel = userBadges[user];
        userPoints = points[user];
        nextBadgeThreshold = getNextBadgeThreshold(badgeLevel);
    }
    
    /**
     * @dev 获取下一等级徽章需要的积分
     * @param currentBadge 当前徽章等级
     * @return 下一等级徽章需要的积分
     */
    function getNextBadgeThreshold(BadgeLevel currentBadge) public pure returns (uint256) {
        if (currentBadge == BadgeLevel.None) {
            return MEMBER_BADGE_THRESHOLD;
        } else if (currentBadge == BadgeLevel.Member) {
            return CITY_BADGE_THRESHOLD;
        } else if (currentBadge == BadgeLevel.City) {
            return PROVINCE_BADGE_THRESHOLD;
        } else if (currentBadge == BadgeLevel.Province) {
            return NATIONAL_BADGE_THRESHOLD;
        } else {
            return 0; // 已经是最高等级
        }
    }
    
    /**
     * @dev 获取徽章数量
     * @param badgeLevel 徽章等级
     * @return 徽章数量
     */
    function getBadgeCount(BadgeLevel badgeLevel) external view returns (uint256) {
        return badgeCounts[badgeLevel];
    }
    
    /**
     * @dev 检查是否存在推荐关系循环
     * @param user 用户地址
     * @param referrer 推荐人地址
     * @return 是否存在循环
     */
    function hasCircularReference(address user, address referrer) internal view returns (bool) {
        address current = referrer;
        // 最多检查100层，防止无限循环
        uint256 depth = 0;
        while (current != address(0) && depth < 100) {
            if (current == user) {
                return true;
            }
            current = referrers[current];
            depth++;
        }
        return false;
    }
    
    /**
     * @dev 获取用户可领取分红
     * @param user 用户地址
     * @return totalClaimable 可领取分红总额
     */
    function getUserClaimableDividends(address user) external view returns (
        uint256 totalClaimable
    ) {
        if (block.timestamp > currentDividendExpiresAt) {
            return 0;
        }
        
        BadgeLevel userBadge = userBadges[user];
        if (userBadge == BadgeLevel.None || hasClaimedCurrent[user][userBadge]) {
            return 0;
        }
        
        return currentDividendPerBadge[userBadge];
    }
}
