import React, { useCallback } from 'react';
import { useContractRead } from 'wagmi';
import { useAccount } from 'wagmi';
import { referralCenterAbi } from '../abi/referralCenter';
import { usdtAbi } from '../abi/usdt';
import { sciaAbi } from '../abi/scia';
import { privateSaleAbi } from '../abi/privateSale';
import { Badge, Button, Tree, Tabs, message, Card, Row, Col, Statistic, Spin, Typography, Progress } from 'antd';
import { LoadingOutlined, CopyOutlined, DownloadOutlined, UserOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../contexts/LanguageContext';

// 获取合约地址
const REFERRAL_CENTER_ADDRESS = import.meta.env.REACT_APP_REFERRAL_CENTER_ADDRESS as `0x${string}`;
const USDT_ADDRESS = import.meta.env.REACT_APP_USDT_ADDRESS as `0x${string}`;
const PRIVATE_SALE_CONTRACT_ADDRESS = import.meta.env.REACT_APP_PRIVATE_SALE_CONTRACT_ADDRESS as `0x${string}`;
const SCIA_ADDRESS = import.meta.env.REACT_APP_SANCIA_TOKEN_ADDRESS as `0x${string}`;

// 常量定义
const REFRESH_INTERVAL = 30000; // 30秒
const WEI_TO_USDT = 10 ** 6; // wei到USDT的转换因子（BSC主网USDT使用6位小数）

// 色彩主题定义
const COLORS = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#13c2c2',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
  textTertiary: 'rgba(255, 255, 255, 0.6)',
  backgroundPrimary: 'rgba(255, 255, 255, 0.05)',
  backgroundSecondary: 'rgba(255, 255, 255, 0.02)',
  border: 'rgba(255, 255, 255, 0.1)',
  badgeMember: '#faad14',
  badgeCity: '#1890ff',
  badgeProvince: '#722ed1',
  badgeNational: '#eb2f96'
};

// 统一样式常量
const CARD_STYLE = {
  backgroundColor: '#000000',
  borderRadius: '12px',
  border: `1px solid ${COLORS.border}`,
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease-in-out, transform 0.3s ease-out, box-shadow 0.3s ease-out',
  transform: 'translateY(0)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  color: COLORS.textPrimary,
};

const CARD_HEAD_STYLE = {
  color: COLORS.textPrimary,
  borderBottom: `1px solid ${COLORS.border}`,
  fontSize: '16px',
  fontWeight: 'bold',
  lineHeight: '1.5'
};

const CARD_MARGIN_BOTTOM = '24px';

// 排版常量
const FONT_SIZES = {
  titleLarge: '24px',
  titleMedium: '20px',
  titleSmall: '16px',
  subtitle: '14px',
  bodyLarge: '16px',
  bodyMedium: '14px',
  bodySmall: '12px'
};

const LINE_HEIGHTS = {
  title: '1.3',
  body: '1.6'
};

const { Title, Text } = Typography;

// 类型定义
interface ReferralNode {
  title: string;
  key: string;
  children: ReferralNode[];
}

interface ReferralStats {
  directCount: number;
  totalCount: number;
  totalUSDTReward: string;
  totalSCIAReward: string;
}

interface ReferralContribution {
  address: string;
  totalSCIA: string;
  totalUSDT: string;
}

const ProfilePage = () => {
  const { address: userAddress, isConnected } = useAccount();
  const { t } = useLanguage();
  
  // 推荐树模态框状态
  const [treeModalVisible, setTreeModalVisible] = React.useState(false);
  const [treeData, setTreeData] = React.useState<ReferralNode[]>([]);
  const [isLoadingTree, setIsLoadingTree] = React.useState(false);
  // 推荐统计数据
  const [referralStats, setReferralStats] = React.useState<ReferralStats>({
    directCount: 0,
    totalCount: 0,
    totalUSDTReward: '0',
    totalSCIAReward: '0'
  });
  // 推荐人奖励贡献数据
  const [referralContributions, setReferralContributions] = React.useState<ReferralContribution[]>([]);
  
  // 获取直接推荐列表
  const [directReferrals, setDirectReferrals] = React.useState<Array<{ address: string }>>([]);
  const [isLoadingReferrals, setIsLoadingReferrals] = React.useState(false);
  
  // 检查用户是否有购买记录
  const { data: purchaseAmount, isLoading: isCheckingPurchase } = useContractRead({
    address: PRIVATE_SALE_CONTRACT_ADDRESS,
    abi: privateSaleAbi,
    functionName: 'purchaseAmounts',
    args: [userAddress || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: isConnected,
      refetchInterval: REFRESH_INTERVAL,
    },
  });
  
  // 计算是否有购买记录
  const hasPurchaseRecord = React.useMemo(() => {
    if (!purchaseAmount) return false;
    return purchaseAmount > 0n;
  }, [purchaseAmount]);
  
  // 获取用户徽章信息
  const { data: userBadgeInfo, isLoading: isUserBadgeInfoLoading } = useContractRead({
    address: REFERRAL_CENTER_ADDRESS,
    abi: referralCenterAbi,
    functionName: 'getUserBadgeInfo',
    args: [userAddress || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: isConnected, 
      refetchInterval: REFRESH_INTERVAL, // 每30秒刷新一次
    },
  });

  // 获取推荐人地址
  const { data: referrerAddress } = useContractRead({
    address: REFERRAL_CENTER_ADDRESS,
    abi: referralCenterAbi,
    functionName: 'referrers',
    args: [userAddress || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: isConnected,
      refetchInterval: REFRESH_INTERVAL,
    },
  });

  // 解析合约返回的地址
  const parseContractAddress = useCallback((address: string | undefined): string | null => {
    if (!address) {
      return null;
    }

    let parsedAddress = address;
    if (parsedAddress.startsWith('0x')) {
      parsedAddress = parsedAddress.slice(2);
    }
    
    // 处理不同长度的地址
    let fullAddress: string;
    if (parsedAddress.length === 64) {
      // 32字节地址，取后20字节作为以太坊地址
      fullAddress = '0x' + parsedAddress.slice(24);
    } else if (parsedAddress.length === 40) {
      // 20字节地址，直接添加前缀
      fullAddress = '0x' + parsedAddress;
    } else {
      // 无效地址长度
      return null;
    }
    
    // 检查是否为零地址
    if (fullAddress === '0x0000000000000000000000000000000000000000') {
      return null;
    }
    
    return fullAddress;
  }, []);

  // 加载直接推荐列表
  const loadDirectReferrals = useCallback(async () => {
    if (!isConnected || !userAddress) return;
    
    setIsLoadingReferrals(true);
    try {
      const referrals: Array<{ address: string }> = [];
      
      // 获取所有直接推荐
      let index = 0;
      while (true) {
        try {
          const referralAddress = await window.ethereum?.request({
            method: 'eth_call',
            params: [
              {
                to: REFERRAL_CENTER_ADDRESS,
                data: `0x${(await import('viem')).encodeFunctionData({
                  abi: referralCenterAbi,
                  functionName: 'referrals',
                  args: [userAddress, BigInt(index)]
                }).slice(2)}`,
              },
              'latest',
            ],
          });

          const parsedAddress = parseContractAddress(referralAddress);
          if (parsedAddress) {
            referrals.push({ address: parsedAddress });
          } else {
            break;
          }
          
          // 递增索引，获取下一个推荐人
          index++;
        } catch {
          break;
        }
      }
      
      setDirectReferrals(referrals);
    } catch {
      // 忽略错误
    } finally {
      setIsLoadingReferrals(false);
    }
  }, [isConnected, userAddress, parseContractAddress]);

  // 组件挂载时加载直接推荐列表
  React.useEffect(() => {
    loadDirectReferrals();
  }, [loadDirectReferrals]);

  // 递归构建推荐树并统计推荐人数
  const buildReferralTree = async (address: string, depth: number = 0, visited: Set<string> = new Set()): Promise<{ node: any; count: number }> => {
    // 使用钱包地址作为节点标题
    const node: any = {
      title: `${address.slice(0, 8)}...${address.slice(-6)}`,
      key: address,
      children: [],
    };
    
    let totalCount = 1; // 包括当前节点
    let index = 0;
    
    // 如果该地址已经被访问过，说明存在循环，返回当前节点（不包含子节点）
    if (visited.has(address)) {
      return { node, count: totalCount };
    }
    
    // 将当前地址添加到已访问集合中
    visited.add(address);
    
    while (true) {
      try {
        const referralAddress = await window.ethereum?.request({
          method: 'eth_call',
          params: [
            {
              to: REFERRAL_CENTER_ADDRESS,
              data: `0x${(await import('viem')).encodeFunctionData({
                abi: referralCenterAbi,
                functionName: 'referrals',
                args: [address as `0x${string}`, BigInt(index)]
              }).slice(2)}`,
            },
            'latest',
          ],
        });
        
        // 正确解析返回值 - eth_call返回的是带前缀的十六进制字符串，需要去除前缀并确保是有效的地址格式
        if (referralAddress && referralAddress !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
          // 去除前缀并确保地址是40个字符
          let parsedAddress = referralAddress;
          if (parsedAddress.startsWith('0x')) {
            parsedAddress = parsedAddress.slice(2);
          }
          // 确保地址长度正确（32字节 -> 64字符，转换为以太坊地址需要取后20字节）
          if (parsedAddress.length === 64) {
            parsedAddress = '0x' + parsedAddress.slice(24); // 取后20字节作为地址
          } else if (parsedAddress.length === 40) {
            parsedAddress = '0x' + parsedAddress;
          }
          
          // 创建新的visited集合副本，避免不同分支之间的相互影响
          const newVisited = new Set(visited);
          const { node: childNode, count: childCount } = await buildReferralTree(parsedAddress, depth + 1, newVisited);
          if (childNode) {
            node.children.push(childNode);
            totalCount += childCount;
          }
        } else {
          break;
        }
      } catch {
        break;
      }
      index++;
    }
    
    return { node, count: totalCount };
  };

  // 计算每个推荐人的贡献和推荐奖励
  const calculateReferralContributions = async (treeData: any[]) => {
    if (!isConnected || !userAddress) return;
    
    try {
      // 从推荐树中只获取直接被推荐人地址
      const getDirectReferrals = (data: any[]): string[] => {
        let directReferrals: string[] = [];
        
        // 只获取当前用户的直接推荐人（树的第一层子节点）
        const rootNode = data[0];
        if (rootNode && rootNode.children && rootNode.children.length > 0) {
          directReferrals = rootNode.children.map((child: any) => child.key);
        }
        
        return directReferrals;
      };
      
      const allReferrals = getDirectReferrals(treeData);
      
      // 推荐奖励比例（根据实际合约逻辑调整）
      const USDT_REWARD_PERCENTAGE = 0.05; // 5% USDT奖励
      const SCIA_REWARD_PERCENTAGE = 0.05; // 5% SCIA奖励
      
      // 核心规则：100 USDT = 1000 SCIA
      const PACKAGE_COST_USDT = 100; // 每包成本（USDT，主网）
      const SCIA_PER_PACKAGE = 1000; // 每包包含的SCIA数量
      
      // 为每个被推荐人获取真实购买数据并计算推荐奖励
      const contributionsArray = await Promise.all(allReferrals.map(async (address) => {
        try {
          // 检查window.ethereum是否存在
          if (!window.ethereum) {
            return {
              address,
              totalSCIA: '0',
              totalUSDT: '0'
            };
          }
          
          const viem = await import('viem');
          
          // 查询被推荐人的购买金额（返回USDT的wei值）
          const purchaseAmountResult = await window.ethereum.request({
            method: 'eth_call',
            params: [
              {
                to: PRIVATE_SALE_CONTRACT_ADDRESS,
                data: `0x${viem.encodeFunctionData({
                  abi: privateSaleAbi,
                  functionName: 'purchaseAmounts',
                  args: [address as `0x${string}`]
                }).slice(2)}`,
              },
              'latest',
            ],
          });
          
          // 解析购买金额
          let purchaseAmountWei = BigInt(0);
          if (purchaseAmountResult && purchaseAmountResult !== '0x') {
            purchaseAmountWei = BigInt(purchaseAmountResult);
          }
          
          // 正确计算：100 USDT = 1000 SCIA
          // 1. 先将USDT的wei值转换为USDT金额
          const usdtAmount = Number(purchaseAmountWei) / WEI_TO_USDT;
          // 2. 根据比例计算SCIA数量：每100 USDT对应1000 SCIA
          const sciaAmount = usdtAmount * (SCIA_PER_PACKAGE / PACKAGE_COST_USDT);
          
          // 返回计算结果，totalSCIA直接存储计算出的SCIA数量
          return {
            address,
            totalSCIA: sciaAmount.toString(),
            totalUSDT: purchaseAmountWei.toString()
          };
        } catch (error) {
          return {
            address,
            totalSCIA: '0',
            totalUSDT: '0'
          };
        }
      }));
      
      // 计算总推荐奖励
      let totalUSDTReward = BigInt(0);
      let totalSCIAReward = BigInt(0);
      
      for (const contribution of contributionsArray) {
        const usdtAmount = BigInt(contribution.totalUSDT); // USDT的wei值
        const sciaAmount = Number(contribution.totalSCIA); // SCIA的数量
        
        // 计算奖励并累加到总奖励中
        // USDT奖励：5%的USDT购买金额（wei值）
        totalUSDTReward += BigInt(Math.floor(Number(usdtAmount) * USDT_REWARD_PERCENTAGE));
        
        // SCIA奖励：5%的SCIA获得数量
        // 注意：sciaAmount已经是SCIA的数量，转换为wei值后再计算奖励
        const sciaAmountWei = BigInt(Math.floor(sciaAmount)) * BigInt(10 ** 18);
        totalSCIAReward += BigInt(Math.floor(Number(sciaAmountWei) * SCIA_REWARD_PERCENTAGE));
      }
      
      // 更新推荐统计数据，包括总奖励
      setReferralStats(prev => ({
        ...prev,
        totalUSDTReward: totalUSDTReward.toString(),
        totalSCIAReward: totalSCIAReward.toString()
      }));
      
      setReferralContributions(contributionsArray);
    } catch (error) {
      // 即使出错，也要设置一个空数组，确保表格显示
      setReferralContributions([]);
    }
  };

  // 打开推荐树模态框
  const handleViewReferralTree = async () => {
    if (!isConnected || !userAddress) return;
    
    setIsLoadingTree(true);
    setTreeModalVisible(true);
    
    try {
      const { node: tree, count: totalCount } = await buildReferralTree(userAddress);
      
      if (tree) {
        setTreeData([tree]);
        // 计算直接推荐人数（当前节点的子节点数量）
        const directCount = tree.children.length;
        // 更新推荐统计数据，保留原有奖励数据
        setReferralStats(prev => ({
          ...prev,
          directCount,
          totalCount: totalCount - 1 // 减去当前节点本身
        }));
      } else {
        setTreeData([]);
        setReferralStats({
          directCount: 0,
          totalCount: 0,
          totalUSDTReward: '0',
          totalSCIAReward: '0'
        });
      }
      
      // 计算每个推荐人的贡献
      await calculateReferralContributions([tree]);
    } catch {
      setTreeData([]);
      setReferralStats({
        directCount: 0,
        totalCount: 0,
        totalUSDTReward: '0',
        totalSCIAReward: '0'
      });
      setReferralContributions([]);
    } finally {
      setIsLoadingTree(false);
    }
  };

  // 获取可领取分红
  const { data: claimableDividends } = useContractRead({
    address: REFERRAL_CENTER_ADDRESS,
    abi: referralCenterAbi,
    functionName: 'getUserClaimableDividends',
    args: [userAddress || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: isConnected,
      refetchInterval: REFRESH_INTERVAL,
    },
  });

  // 分红领取功能（暂时禁用，等待Wagmi 2.0 API确认）
  const isClaimingDividend = false;
  const handleClaimDividend = useCallback(() => {
    // 暂时禁用，等待Wagmi 2.0 API确认
  }, []);

  // 格式化分红金额
  const formatDividend = useCallback((amount: bigint | undefined): string => {
    if (!amount) return '0';
    return (Number(amount) / WEI_TO_USDT).toFixed(6);
  }, []);

  // 获取USDT余额
  const { data: usdtBalance, isLoading: isUSDTBalanceLoading } = useContractRead({
    address: USDT_ADDRESS,
    abi: usdtAbi,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}` || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: isConnected && !!userAddress,
      refetchInterval: REFRESH_INTERVAL, // 每30秒刷新一次
    },
  });

  // 获取USDT授权额度
  const { data: usdtAllowance, isLoading: isUSDTAllowanceLoading } = useContractRead({
    address: USDT_ADDRESS,
    abi: usdtAbi,
    functionName: 'allowance',
    args: [
      userAddress as `0x${string}` || '0x0000000000000000000000000000000000000000',
      PRIVATE_SALE_CONTRACT_ADDRESS
    ],
    query: {
      enabled: isConnected && !!userAddress,
      refetchInterval: REFRESH_INTERVAL, // 每30秒刷新一次
    },
  });

  // 获取SCIA余额
  const { data: sciaBalance, isLoading: isSCIABalanceLoading } = useContractRead({
    address: SCIA_ADDRESS,
    abi: sciaAbi,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}` || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: isConnected && !!userAddress,
      refetchInterval: REFRESH_INTERVAL, // 每30秒刷新一次
    },
  });

  // 格式化积分值（积分单位是wei，直接转换为USDT金额）
  const formatPoints = useCallback((points: bigint | undefined): string => {
    if (!points) return '0';
    
    // 转换为USDT金额（1 USDT = 10^6 wei，主网USDT使用6位小数）
    const usdtAmount = Number(points) / WEI_TO_USDT;
    
    return usdtAmount.toFixed(2);
  }, []);

  // 格式化USDT金额（从wei转换为USDT）
  const formatUSDT = useCallback((amount: bigint | undefined): string => {
    if (!amount) return '0';
    const usdtAmount = Number(amount) / WEI_TO_USDT;
    
    // 根据数值大小动态调整小数位数
    if (usdtAmount >= 100) {
      // 大数值显示2位小数
      return usdtAmount.toFixed(2);
    } else if (usdtAmount >= 0.01) {
      // 中等数值显示4位小数
      return usdtAmount.toFixed(4);
    } else {
      // 小数值显示6位小数
      return usdtAmount.toFixed(6);
    }
  }, []);

  // 格式化SCIA数量（处理不同类型的输入）
  const formatSCIA = useCallback((amount: any): string => {
    if (!amount) return '0';
    // 处理不同类型的输入
    let numAmount: number;
    
    if (typeof amount === 'bigint') {
      // 从合约读取的SCIA余额是wei单位，需要转换为正常单位
      numAmount = Number(amount) / WEI_TO_USDT;
    } else {
      // 直接使用Number()转换，处理字符串或数字类型
      numAmount = Number(amount);
    }
    
    // 根据数值大小动态调整小数位数
    if (numAmount >= 1000) {
      // 大数值显示0位小数
      return numAmount.toFixed(0);
    } else if (numAmount >= 1) {
      // 中等数值显示2位小数
      return numAmount.toFixed(2);
    } else {
      // 小数值显示4位小数
      return numAmount.toFixed(4);
    }
  }, []);

  // 获取徽章等级名称
  const getBadgeLevelName = useCallback((level: number): string => {
    const levelMap: Record<number, string> = {
      0: t('no'),
      1: t('member'),
      2: t('city'),
      3: t('province'),
      4: t('national')
    };
    
    return levelMap[level] || t('no');
  }, [t]);

  // 获取徽章颜色
  const getBadgeColor = useCallback((level: number): string => {
    const colorMap: Record<number, string> = {
      0: COLORS.textTertiary,
      1: COLORS.badgeMember,
      2: COLORS.badgeCity,
      3: COLORS.badgeProvince,
      4: COLORS.badgeNational
    };
    
    return colorMap[level] || COLORS.textTertiary;
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#000000', minHeight: 'calc(100vh - 180px)' }}>
      <Title level={2} style={{ 
        color: COLORS.textPrimary, 
        textAlign: 'center', 
        marginBottom: '30px',
        fontSize: FONT_SIZES.titleLarge,
        fontWeight: 'bold',
        lineHeight: LINE_HEIGHTS.title
      }}>
        <UserOutlined style={{ marginRight: '10px', fontSize: FONT_SIZES.titleMedium }} />
        {t('profile')}
      </Title>

      <Spin
        spinning={false}
        indicator={<LoadingOutlined style={{ fontSize: FONT_SIZES.titleLarge, color: COLORS.primary }} spin />}
      >
        {/* 个人信息卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: CARD_MARGIN_BOTTOM }}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24}>
            <Card 
              title={t('basicInfo')} 
              style={{ 
                ...CARD_STYLE, 
                marginBottom: CARD_MARGIN_BOTTOM,
                backgroundColor: COLORS.backgroundPrimary,
              }}
              headStyle={CARD_HEAD_STYLE}
              hoverable
            >
              <Row gutter={16} align="middle">
                <Col xs={24} sm={24} md={6} lg={6} xl={6}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '16px',
                    padding: '20px 0'
                  }}>
                    <div style={{ 
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      backgroundColor: COLORS.backgroundSecondary,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: '50px'
                    }}>
                      👤
                    </div>
                    <Text style={{ color: COLORS.textPrimary, fontSize: FONT_SIZES.bodyLarge, fontWeight: 'bold' }}>
                      {t('profile')}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} sm={24} md={18} lg={18} xl={18}>
                  <Row gutter={16}>
                    <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                      <div style={{ padding: '12px', backgroundColor: COLORS.backgroundSecondary, borderRadius: '8px', height: '100%' }}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '8px', fontSize: FONT_SIZES.bodyMedium }}>{t('walletAddress')}</Text>
                      <Text style={{ 
                        color: COLORS.textPrimary, 
                        fontWeight: 'bold', 
                        wordBreak: 'break-all',
                        fontSize: FONT_SIZES.bodyMedium,
                        backgroundColor: COLORS.backgroundPrimary,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        display: 'block'
                      }}>
                        {isConnected ? userAddress : t('notConnected')}
                      </Text>
                      </div>
                    </Col>
                    <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                      <div style={{ padding: '12px', backgroundColor: COLORS.backgroundSecondary, borderRadius: '8px', height: '100%' }}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '8px', fontSize: FONT_SIZES.bodyMedium }}>{t('referrer')}</Text>
                      <Text style={{ 
                        color: COLORS.textPrimary, 
                        fontWeight: 'bold',
                        fontSize: FONT_SIZES.bodyMedium,
                        backgroundColor: COLORS.backgroundPrimary,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        display: 'block'
                      }}>
                        {referrerAddress && referrerAddress !== '0x0000000000000000000000000000000000000000' ? (
                          referrerAddress.slice(0, 10) + '...' + referrerAddress.slice(-8)
                        ) : (
                          t('no')
                        )}
                      </Text>
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* 徽章与积分卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: CARD_MARGIN_BOTTOM }}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Card 
              title={t('badgeLevel')} 
              style={{ 
                ...CARD_STYLE, 
                marginBottom: CARD_MARGIN_BOTTOM,
                backgroundColor: COLORS.backgroundPrimary,
              }}
              headStyle={CARD_HEAD_STYLE}
              hoverable
            >
              <Row gutter={16} align="middle">
                <Col xs={24} sm={8} md={8} lg={8} xl={8}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px 0'
                  }}>
                    <div style={{ 
                      fontSize: '60px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      🏆
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={16} md={16} lg={16} xl={16}>
                  {isUserBadgeInfoLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                      <LoadingOutlined spin style={{ fontSize: 24, color: COLORS.primary }} />
                    </div>
                  ) : userBadgeInfo ? (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '4px', fontSize: FONT_SIZES.bodyMedium }}>{t('currentBadge')}</Text>
                        <Text style={{ 
                          color: getBadgeColor(userBadgeInfo[0]), 
                          fontWeight: 'bold',
                          fontSize: FONT_SIZES.titleSmall,
                          backgroundColor: `${getBadgeColor(userBadgeInfo[0])}20`,
                          padding: '8px 16px',
                          borderRadius: '20px',
                          display: 'inline-block'
                        }}>
                          {getBadgeLevelName(userBadgeInfo[0])}
                        </Text>
                      </div>
                      <div>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '8px', fontSize: FONT_SIZES.bodyMedium }}>{t('upgradeProgress')}</Text>
                        <Progress 
                          percent={Math.min(Math.round((Number(userBadgeInfo[1]) / Number(userBadgeInfo[2])) * 100), 100)} 
                          strokeColor={getBadgeColor(userBadgeInfo[0] + 1)}
                          style={{ marginBottom: '8px' }}
                          strokeWidth={8}
                          trailColor={COLORS.backgroundSecondary}
                        />
                        <Text style={{ color: COLORS.textTertiary, fontSize: FONT_SIZES.bodySmall, display: 'block', textAlign: 'right' }}>
                          {t('pointsNeeded', { points: formatPoints(userBadgeInfo[2] - userBadgeInfo[1]) })}
                        </Text>
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '20px 0', textAlign: 'center' }}>
                      <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium }}>当前徽章：无</Text>
                    </div>
                  )}
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Card 
              title={t('pointsBalance')} 
              style={{ 
                ...CARD_STYLE, 
                marginBottom: CARD_MARGIN_BOTTOM,
                backgroundColor: COLORS.backgroundPrimary,
              }}
              headStyle={CARD_HEAD_STYLE}
              hoverable
            >
              {(isUserBadgeInfoLoading || isUSDTBalanceLoading || isUSDTAllowanceLoading || isSCIABalanceLoading) ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                  <LoadingOutlined spin style={{ fontSize: 24, color: COLORS.primary }} />
                </div>
              ) : (
                <Row gutter={16}>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    <div style={{ padding: '12px 0' }}>
                      <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '4px', fontSize: FONT_SIZES.bodySmall }}>{t('totalPoints')}</Text>
                      <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: FONT_SIZES.titleMedium }}>
                        {userBadgeInfo ? formatPoints(userBadgeInfo[1]) : '0'}
                      </Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    <div style={{ padding: '12px 0' }}>
                      <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '4px', fontSize: FONT_SIZES.bodySmall }}>{t('usdtBalance')}</Text>
                      <Text style={{ color: COLORS.success, fontWeight: 'bold', fontSize: FONT_SIZES.titleMedium }}>
                        {formatUSDT(usdtBalance)}
                      </Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    <div style={{ padding: '12px 0' }}>
                      <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '4px', fontSize: FONT_SIZES.bodySmall }}>{t('usdtAllowance')}</Text>
                      <Text style={{ color: COLORS.info, fontWeight: 'bold', fontSize: FONT_SIZES.titleMedium }}>
                        {formatUSDT(usdtAllowance)}
                      </Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    <div style={{ padding: '12px 0' }}>
                      <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '4px', fontSize: FONT_SIZES.bodySmall }}>{t('sciaBalance')}</Text>
                      <Text style={{ color: COLORS.primary, fontWeight: 'bold', fontSize: FONT_SIZES.titleMedium }}>
                        {formatSCIA(sciaBalance)}
                      </Text>
                    </div>
                  </Col>
                </Row>
              )}
            </Card>
          </Col>
        </Row>

        {/* 分红领取卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: CARD_MARGIN_BOTTOM }}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24}>
            <Card 
              title={t('dividendClaim')} 
              style={{ 
                ...CARD_STYLE, 
                marginBottom: CARD_MARGIN_BOTTOM,
                backgroundColor: COLORS.backgroundPrimary,
              }}
              headStyle={CARD_HEAD_STYLE}
              hoverable
            >
              {isUserBadgeInfoLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                  <LoadingOutlined spin style={{ fontSize: 24, color: COLORS.primary }} />
                </div>
              ) : (
                <Row gutter={16} align="middle">
                  <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                    <div style={{ padding: '12px 0' }}>
                      <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '4px', fontSize: FONT_SIZES.bodyMedium }}>{t('claimableDividend')}</Text>
                      <Text style={{ color: COLORS.warning, fontWeight: 'bold', fontSize: FONT_SIZES.titleLarge }}>
                        {formatDividend(claimableDividends)} USDT
                      </Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={24} md={16} lg={16} xl={16}>
                    <div className="dividend-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                      {userBadgeInfo && userBadgeInfo[0] >= 1 ? (
                        <Button 
                          type="primary" 
                          onClick={handleClaimDividend}
                          loading={isClaimingDividend}
                          disabled
                        >
                          {t('claimDividend', { badge: getBadgeLevelName(userBadgeInfo[0]) })}
                        </Button>
                      ) : (
                        <Button 
                          type="primary" 
                          disabled
                        >
                          {t('noDividendPermission')}
                        </Button>
                      )}
                    </div>
                  </Col>
                </Row>
              )}
            </Card>
          </Col>
        </Row>

        {/* 推广信息卡片 */}
        <Card 
          title={t('promotionInfo')} 
          style={{ 
            ...CARD_STYLE, 
            marginBottom: CARD_MARGIN_BOTTOM,
            backgroundColor: COLORS.backgroundPrimary,
          }}
          headStyle={CARD_HEAD_STYLE}
          hoverable
        >
          <Tabs defaultActiveKey="promotion">
            <Tabs.TabPane tab={t('promotionInfo')} key="promotion">
              {isCheckingPurchase ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <LoadingOutlined spin style={{ fontSize: 24, color: COLORS.primary }} />
                  <p style={{ marginTop: 10, color: COLORS.textSecondary }}>Checking purchase records...</p>
                </div>
              ) : hasPurchaseRecord ? (
                <>
                  {/* 推广链接与二维码 */}
                  <Card 
                    title={t('promotionLinkQR')} 
                    style={{ 
                      ...CARD_STYLE, 
                      marginBottom: CARD_MARGIN_BOTTOM,
                      backgroundColor: COLORS.backgroundPrimary,
                    }}
                    headStyle={CARD_HEAD_STYLE}
                    hoverable
                  >
                    <Row gutter={[16, 16]} align="top">
                      {/* 左侧：二维码 - 调整宽度，只占据必要空间 */}
                      <Col xs={24} sm={10} md={8} lg={8} xl={8}>
                        <div className="qr-code" style={{ 
                          padding: '16px', 
                          backgroundColor: COLORS.backgroundSecondary, 
                          borderRadius: '8px',
                          border: `1px solid ${COLORS.border}`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '16px',
                          marginBottom: '12px',
                          width: '100%',
                          maxWidth: '250px',
                          minHeight: '250px',
                          justifyContent: 'center',
                          aspectRatio: '1/1'
                        }}>
                          <QRCodeSVG 
                            value={`https://scia-dapp.com?ref=${userAddress}`} 
                            size={200} 
                            level="H" 
                            includeMargin={false} 
                            bgColor={COLORS.backgroundSecondary} 
                            fgColor={COLORS.textPrimary} 
                            style={{ width: '100%', height: 'auto', maxWidth: '200px', maxHeight: '200px' }}
                          />
                        </div>
                        {/* 下载按钮移到二维码下方，独立成行 */}
                        <Button
                          size="middle"
                          icon={<DownloadOutlined />}
                          onClick={() => {
                            // 生成真实的二维码并下载
                            const qrValue = `https://scia-dapp.com?ref=${userAddress}`;
                               
                            // 创建一个临时容器来渲染二维码
                            const tempContainer = document.createElement('div');
                            document.body.appendChild(tempContainer);
                               
                            // 使用ReactDOMServer将QRCodeSVG组件渲染为HTML字符串
                            const { renderToString } = require('react-dom/server');
                            const qrCodeHtml = renderToString(
                              React.createElement(QRCodeSVG, {
                                value: qrValue,
                                size: 400, // 生成更大的二维码，提高清晰度
                                level: 'H',
                                includeMargin: false,
                                bgColor: COLORS.backgroundSecondary,
                                fgColor: COLORS.textPrimary
                              })
                            );
                               
                            // 将HTML字符串转换为完整的SVG
                            const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
${qrCodeHtml}`;
                               
                            // 创建Blob对象
                            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
                               
                            // 创建下载链接
                            const downloadLink = document.createElement('a');
                            downloadLink.href = URL.createObjectURL(blob);
                            downloadLink.download = `SCIA_Promotion_QR_${userAddress?.slice(0, 8)}.svg`;
                            downloadLink.click();
                               
                            // 清理临时容器
                            document.body.removeChild(tempContainer);
                          }}
                          style={{ width: '100%', maxWidth: '250px' }}
                        >
                          {t('downloadQR')}
                        </Button>
                      </Col>
                      
                      {/* 右侧：推广链接和使用说明 - 扩展宽度，填充剩余空间 */}
                      <Col xs={24} sm={14} md={16} lg={16} xl={16}>
                        {/* 推广链接 - 增大文字，减少留白 */}
                        <div className="referral-link" style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '12px',
                          marginBottom: '16px',
                          padding: '16px',
                          backgroundColor: COLORS.backgroundSecondary,
                          borderRadius: '8px',
                          border: `1px solid ${COLORS.border}`
                        }}>
                          <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyLarge, marginBottom: '8px' }}>{t('promotionLink')}</Text>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <input
                              type="text"
                              value={`https://scia-dapp.com?ref=${userAddress || '0x0000000000000000000000000000000000000000'}`}
                              readOnly
                              style={{
                                flex: 1,
                                minWidth: '200px',
                                padding: '10px 14px',
                                borderRadius: '4px',
                                border: `1px solid ${COLORS.border}`,
                                backgroundColor: COLORS.backgroundPrimary,
                                color: COLORS.textPrimary,
                                fontSize: FONT_SIZES.bodyMedium
                              }}
                            />
                            <Button
                              size="middle"
                              icon={<CopyOutlined />}
                              onClick={() => {
                                const referralLink = `https://scia-dapp.com?ref=${userAddress || '0x0000000000000000000000000000000000000000'}`;
                                navigator.clipboard.writeText(referralLink)
                                  .then(() => {
                                    message.success(t('copySuccess'));
                                  })
                                  .catch(() => {
                                    message.error(t('copyFailed'));
                                  });
                              }}
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              {t('copy')}
                            </Button>
                          </div>
                        </div>
                        
                        {/* 使用说明 - 增大文字，减少留白 */}
                        <div style={{ 
                          padding: '16px', 
                          backgroundColor: COLORS.backgroundSecondary, 
                          borderRadius: '8px',
                          border: `1px solid ${COLORS.border}`
                        }}>
                          <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '12px', fontSize: FONT_SIZES.bodyLarge }}>{t('usageInstructions')}</Text>
                          <ul style={{ color: COLORS.textPrimary, margin: 0, paddingLeft: 20, fontSize: FONT_SIZES.bodyMedium, lineHeight: 1.6 }}>
                            <li style={{ marginBottom: '8px' }}>{t('promotionSteps')}</li>
                            <li style={{ marginBottom: '8px' }}>{t('referralReward')}</li>
                            <li style={{ marginBottom: '8px' }}>{t('autoCalculation')}</li>
                            <li>{t('viewReferralTree')}</li>
                          </ul>
                        </div>
                      </Col>
                    </Row>
                  </Card>

                  {/* 直接推荐记录 */}
                  <Card 
                    title={t('directReferrals')} 
                    style={{ 
                      ...CARD_STYLE, 
                      marginBottom: CARD_MARGIN_BOTTOM,
                      backgroundColor: COLORS.backgroundPrimary,
                    }}
                    headStyle={CARD_HEAD_STYLE}
                    hoverable
                    size="small"
                  >
                    {isLoadingReferrals ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                        <LoadingOutlined spin style={{ fontSize: 24, color: COLORS.primary }} />
                      </div>
                    ) : directReferrals.length > 0 ? (
                      <ul style={{ color: COLORS.textPrimary, margin: 0, paddingLeft: 24, fontSize: FONT_SIZES.bodyMedium }}>
                        {directReferrals.map((referral, index) => (
                          <li key={index} style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Badge status="success" style={{ backgroundColor: COLORS.success }} />
                            <Text style={{ color: COLORS.textPrimary, wordBreak: 'break-all' }}>{referral.address.slice(0, 10) + '...' + referral.address.slice(-8)}</Text>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: COLORS.textTertiary }}>
                      <Text style={{ fontSize: FONT_SIZES.bodyMedium }}>{t('noReferrals')}</Text>
                    </div>
                    )}
                  </Card>

                  {/* 查询推荐树按钮 */}
                  <Button 
                    type="primary" 
                    className="view-all-referrals-btn"
                    onClick={handleViewReferralTree}
                    loading={isLoadingTree}
                    block
                  >
                    {t('viewAllReferrals')}
                  </Button>
                </>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '32px', 
                  backgroundColor: 'rgba(255, 77, 79, 0.1)',
                  borderRadius: '12px',
                  border: `1px solid ${COLORS.error}33`
                }}>
                  <h3 style={{ color: COLORS.error, marginBottom: '16px', fontSize: FONT_SIZES.titleMedium }}>{t('noPromotionPermission')}</h3>
                  <p style={{ color: COLORS.textSecondary, marginBottom: '24px', fontSize: FONT_SIZES.bodyMedium }}>{t('buyToGetLink')}</p>
                  <Button 
                    type="primary" 
                    onClick={() => window.location.href = '/buy'}
                  >
                    {t('buyNow')}
                  </Button>
                </div>
              )}
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </Spin>

      {/* 推荐树模态框 */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: treeModalVisible ? 'flex' : 'none', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
        <div style={{ width: '1000px', maxWidth: '90vw', maxHeight: '80vh', backgroundColor: '#000000', borderRadius: '12px', border: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 模态框头部 */}
          <div style={{ padding: '16px 24px', backgroundColor: '#000000', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <UserOutlined style={{ marginRight: '8px', color: COLORS.primary }} />
              <Text style={{ color: COLORS.textPrimary, fontSize: FONT_SIZES.titleMedium, fontWeight: 'bold', lineHeight: LINE_HEIGHTS.title }}>{t('referralTree')}</Text>
            </div>
            <button onClick={() => setTreeModalVisible(false)} style={{ background: 'none', border: 'none', color: COLORS.textPrimary, fontSize: FONT_SIZES.titleMedium, cursor: 'pointer' }}>×</button>
          </div>
          {/* 模态框内容 */}
          <div style={{ padding: '24px', backgroundColor: '#000000', overflowY: 'auto', flex: 1 }}>
        {isLoadingTree ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <LoadingOutlined spin style={{ fontSize: 48, color: COLORS.primary }} />
            <p style={{ marginTop: 20, color: COLORS.textSecondary }}>{t('loadingTree')}</p>
          </div>
        ) : (
          <>
            {/* 推荐统计信息 */}
            <div style={{ backgroundColor: '#000000', borderRadius: '12px', border: `1px solid ${COLORS.border}`, marginBottom: CARD_MARGIN_BOTTOM, padding: '16px' }}>
              <h3 style={{ color: COLORS.textPrimary, fontSize: FONT_SIZES.titleSmall, fontWeight: 'bold', marginBottom: '16px' }}>{t('referralStats')}</h3>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={24} md={6} lg={6} xl={6}>
                  <Statistic
                    title={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium }}>{t('directReferrals')}</Text>}
                    value={referralStats.directCount}
                    valueStyle={{ color: COLORS.success, fontSize: FONT_SIZES.titleLarge, fontWeight: 'bold' }}
                    prefix={<UserOutlined style={{ color: COLORS.success }} />}
                  />
                </Col>
                <Col xs={24} sm={24} md={6} lg={6} xl={6}>
                  <Statistic
                    title={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium }}>{t('totalReferrals')}</Text>}
                    value={referralStats.totalCount}
                    valueStyle={{ color: COLORS.primary, fontSize: FONT_SIZES.titleLarge, fontWeight: 'bold' }}
                    prefix={<UserOutlined style={{ color: COLORS.primary }} />}
                  />
                </Col>
                <Col xs={24} sm={24} md={6} lg={6} xl={6}>
                  <Statistic
                    title={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium }}>{t('totalUSDT')}</Text>}
                    value={formatUSDT(BigInt(referralStats.totalUSDTReward))}
                    valueStyle={{ color: COLORS.warning, fontSize: FONT_SIZES.titleLarge, fontWeight: 'bold' }}
                    prefix={<DollarCircleOutlined style={{ color: COLORS.warning }} />}
                    suffix={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium }}>USDT</Text>}
                  />
                </Col>
                <Col xs={24} sm={24} md={6} lg={6} xl={6}>
                  <Statistic
                    title={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium }}>{t('totalSCIA')}</Text>}
                    value={formatSCIA(Number(referralStats.totalSCIAReward) / (10 ** 18))}
                    valueStyle={{ color: COLORS.info, fontSize: FONT_SIZES.titleLarge, fontWeight: 'bold' }}
                    prefix={<DollarCircleOutlined style={{ color: COLORS.info }} />}
                    suffix={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium }}>SCIA</Text>}
                  />
                </Col>
              </Row>
            </div>
            
            {/* 推荐人贡献列表 */}
            <div style={{ backgroundColor: '#000000', borderRadius: '12px', border: `1px solid ${COLORS.border}`, marginBottom: CARD_MARGIN_BOTTOM, padding: '16px' }}>
              <h3 style={{ color: COLORS.textPrimary, fontSize: FONT_SIZES.titleSmall, fontWeight: 'bold', marginBottom: '16px' }}>{t('purchaseDetails')}</h3>
              {referralContributions.length > 0 ? (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: COLORS.backgroundSecondary }}>
                        <th style={{ padding: '12px', border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, fontSize: FONT_SIZES.bodyMedium, fontWeight: 'bold' }}>{t('referredUser')}</th>
                        <th style={{ padding: '12px', border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, fontSize: FONT_SIZES.bodyMedium, fontWeight: 'bold' }}>{t('purchaseAmount')}</th>
                        <th style={{ padding: '12px', border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, fontSize: FONT_SIZES.bodyMedium, fontWeight: 'bold' }}>{t('purchaseValue')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referralContributions.map((contribution, index) => (
                        <tr key={index} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                          <td style={{ padding: '12px', border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, fontSize: FONT_SIZES.bodyMedium }}>
                            {contribution.address.slice(0, 10) + '...' + contribution.address.slice(-8)}
                          </td>
                          <td style={{ padding: '12px', border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, fontSize: FONT_SIZES.bodyMedium }}>
                            {formatSCIA(contribution.totalSCIA)}
                          </td>
                          <td style={{ padding: '12px', border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, fontSize: FONT_SIZES.bodyMedium }}>
                            {formatUSDT(BigInt(contribution.totalUSDT))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Text style={{ color: COLORS.textTertiary, fontSize: FONT_SIZES.bodySmall, display: 'block', marginTop: '16px' }}>
                    {t('purchaseNote')}
                  </Text>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0', color: COLORS.textTertiary }}>
                  <Text style={{ fontSize: FONT_SIZES.bodyMedium }}>{t('noPurchaseRecords')}</Text>
                </div>
              )}
            </div>
            
            {/* 推荐树展示 */}
            <div style={{ backgroundColor: '#000000', borderRadius: '12px', border: `1px solid ${COLORS.border}`, marginBottom: CARD_MARGIN_BOTTOM, padding: '16px' }}>
              <h3 style={{ color: COLORS.textPrimary, fontSize: FONT_SIZES.titleSmall, fontWeight: 'bold', marginBottom: '16px' }}>{t('referralStructure')}</h3>
              {treeData.length > 0 ? (
                <div style={{ backgroundColor: '#000000', borderRadius: '8px', padding: '0', border: `1px solid ${COLORS.border}` }}>
                  <Tree
                    treeData={treeData}
                    defaultExpandAll
                    showIcon
                    style={{
                      color: COLORS.textPrimary,
                      backgroundColor: '#000000',
                      background: '#000000',
                      padding: '0',
                      margin: '0',
                      border: 'none',
                    } as React.CSSProperties}
                    switcherIcon={<div style={{ color: COLORS.primary }}>▶</div>}
                    titleRender={(node) => {
                      return <span style={{ color: COLORS.textPrimary }}>{node.title}</span>;
                    }}
                    className="referral-tree"
                  />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px 0', color: COLORS.textTertiary }}>
                <Text style={{ fontSize: FONT_SIZES.bodyMedium }}>{t('noReferralRelationship')}</Text>
              </div>
              )}
            </div>
          </>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;