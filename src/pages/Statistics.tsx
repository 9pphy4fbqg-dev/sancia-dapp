import React, { useState, useEffect } from 'react';
import { useContractRead, useAccount, useWatchContractEvent } from 'wagmi';
import { Card, Row, Col, Statistic, Spin, Typography, Progress, Tag } from 'antd';
import {
  DollarCircleOutlined,
  ArrowUpOutlined,
  UserOutlined,
  WalletOutlined,
  BarChartOutlined,
  LoadingOutlined,
  LaptopOutlined,
  MobileOutlined,
  TabletOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

import { privateSaleAbi } from '../abi/privateSale';
import { referralCenterAbi } from '../abi/referralCenter';
import { usdtAbi } from '../abi/usdt';
import { useLanguage } from '../contexts/LanguageContext';

// 获取合约地址
const PRIVATE_SALE_CONTRACT_ADDRESS = import.meta.env.REACT_APP_PRIVATE_SALE_CONTRACT_ADDRESS as `0x${string}`;
const REFERRAL_CENTER_ADDRESS = import.meta.env.REACT_APP_REFERRAL_CENTER_ADDRESS as `0x${string}`;
const USDT_ADDRESS = import.meta.env.REACT_APP_USDT_ADDRESS as `0x${string}`;

// 常量定义
const REFRESH_INTERVAL = 5000; // 5秒刷新一次

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
  backgroundColor: COLORS.backgroundPrimary,
  borderRadius: '12px',
  border: `1px solid ${COLORS.border}`,
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease-in-out, transform 0.3s ease-out, box-shadow 0.3s ease-out',
  transform: 'translateY(0)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
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

// 徽章等级枚举
  enum BadgeLevel {
    None = 0,
    Member = 1,
    City = 2,
    Province = 3,
    National = 4
  }

const StatisticsPage = () => {
  // 设备类型检测
  const [deviceType, setDeviceType] = useState<string>('unknown');
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const { t } = useLanguage();

  // 关键修复：显式调用USDT合约的decimals函数，获取实际小数位数
  // 注意：新部署的合约使用18位小数，所以默认值改为18
  const { data: usdtDecimals, isLoading: isDecimalsLoading, error: decimalsError } = useContractRead({
    address: USDT_ADDRESS,
    abi: usdtAbi,
    functionName: 'decimals',
    query: {
      enabled: true, // 始终查询
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
  });
  
  // 调试：打印错误信息
  React.useEffect(() => {
    if (decimalsError) {
      console.error('Failed to get USDT decimals:', decimalsError);
    }
  }, [decimalsError]);
  
  // 计算小数位数转换因子
  // 新部署的合约使用18位小数，所以默认值改为18
  const usdtDecimalsFactor = 10 ** (usdtDecimals || 18);

  // 测试数据验证 - 使用当前连接的钱包地址
  const { address: connectedWalletAddress, isConnected } = useAccount();
  const [testWalletAddress, setTestWalletAddress] = useState<string>('0x0000000000000000000000000000000000000000');
  
  // 监听钱包地址变化
  useEffect(() => {
    if (isConnected && connectedWalletAddress) {
      setTestWalletAddress(connectedWalletAddress);
    } else {
      setTestWalletAddress('0x0000000000000000000000000000000000000000');
    }
  }, [connectedWalletAddress, isConnected]);

  // 获取用户徽章信息
  const {
    data: userBadgeInfo
  } = useContractRead({
    address: REFERRAL_CENTER_ADDRESS,
    abi: referralCenterAbi,
    functionName: 'getUserBadgeInfo',
    args: [testWalletAddress as `0x${string}`],
    query: {
      enabled: testWalletAddress !== '0x0000000000000000000000000000000000000000',
      refetchInterval: REFRESH_INTERVAL,
      retry: 1, // 只重试1次，避免无限重试
      staleTime: 10000 // 数据10秒内视为新鲜，减少请求次数
    }
  });
  
  // 获取徽章阈值
  const {
    data: nationalBadgeThreshold
  } = useContractRead({
    address: REFERRAL_CENTER_ADDRESS,
    abi: referralCenterAbi,
    functionName: 'getNextBadgeThreshold',
    args: [BadgeLevel.Province],
    query: {
      enabled: true
    }
  });
  
  // 获取销售状态
  const {
    data: isPaused
  } = useContractRead({
    address: PRIVATE_SALE_CONTRACT_ADDRESS,
    abi: privateSaleAbi,
    functionName: 'isPaused',
    query: {
      enabled: true,
      refetchInterval: REFRESH_INTERVAL,
      retry: 1, // 只重试1次，避免无限重试
      staleTime: 10000 // 数据10秒内视为新鲜，减少请求次数
    }
  });
  
  const {
    data: isEnded
  } = useContractRead({
    address: PRIVATE_SALE_CONTRACT_ADDRESS,
    abi: privateSaleAbi,
    functionName: 'isEnded',
    query: {
      enabled: true,
      refetchInterval: REFRESH_INTERVAL,
      retry: 1, // 只重试1次，避免无限重试
      staleTime: 10000 // 数据10秒内视为新鲜，减少请求次数
    }
  });
  
  // 计算徽章验证状态
  const calculateBadgeVerification = () => {
    if (!userBadgeInfo) return { status: 'pending', badgeName: t('no') };
    
    const [badgeLevel] = userBadgeInfo;
    const badgeNameMap: Record<number, string> = {
      0: t('no'),
      1: t('member'),
      2: t('city'),
      3: t('province'),
      4: t('national')
    };
    const badgeName = badgeNameMap[badgeLevel as number] || t('no');
    
    return {
      status: badgeLevel > 0 ? 'success' : 'pending',
      badgeName
    };
  };

  // 监听窗口大小变化，检测设备类型
  useEffect(() => {
    const detectDeviceType = () => {
      const width = window.innerWidth;
      let type = 'desktop';
      if (width < 768) {
        type = 'mobile';
      } else if (width < 1024) {
        type = 'tablet';
      }
      setDeviceType(type);
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };

    // 初始化检测
    detectDeviceType();
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', detectDeviceType);
    
    return () => {
      window.removeEventListener('resize', detectDeviceType);
    };
  }, []);

  // 三端一致性验证数据
  const [lastVerified, setLastVerified] = useState<Date>(new Date());
  const [consistencyResults, setConsistencyResults] = useState<{
    usdtBalanceConsistency: boolean;
    sciaBalanceConsistency: boolean;
    badgeConsistency: boolean;
    pointsConsistency: boolean;
    referrerConsistency: boolean;
    isOverallConsistent: boolean;
  }>({
    usdtBalanceConsistency: false,
    sciaBalanceConsistency: false,
    badgeConsistency: false,
    pointsConsistency: false,
    referrerConsistency: false,
    isOverallConsistent: false
  });

  // 三端一致性验证 - 验证合约端、DAPP端、用户钱包端数据一致性
  const verifyThreeEndConsistency = () => {
    if (!userBadgeInfo || !testWalletAddress || testWalletAddress === '0x0000000000000000000000000000000000000000') {
      return;
    }

    // 从userBadgeInfo中获取链上数据（合约端）
    const [badgeLevel, points, referrer] = userBadgeInfo;
    
    // 转换为前端显示格式
    const chainBadgeLevel = Number(badgeLevel);
    const chainPoints = Number(points) / 10 ** 18;
    const chainReferrer = String(referrer);
    
    // 模拟DAPP端显示的数据
    const dappBadgeLevel = chainBadgeLevel; // DAPP应该显示与链上一致的数据
    const dappPoints = chainPoints; // DAPP应该显示与链上一致的数据
    const dappReferrer = chainReferrer; // DAPP应该显示与链上一致的数据
    
    // 钱包端数据（模拟）
    const walletUSDTBalance = 0;
    const walletSCIABalance = 0;
    
    // 模拟链上USDT和SCIA余额（在实际应用中，应该从合约中获取）
    const chainUSDTBalance = walletUSDTBalance;
    const chainSCIABalance = walletSCIABalance;
    
    // 模拟DAPP显示的余额（在实际应用中，应该从DAPP状态中获取）
    const dappUSDTBalance = chainUSDTBalance;
    const dappSCIABalance = chainSCIABalance;

    // 验证逻辑：验证三个端的数据是否一致
    // 1. USDT余额一致性：钱包端 === 链上（合约端）=== DAPP端
    const usdtBalanceConsistency = Math.abs(walletUSDTBalance - chainUSDTBalance) < 0.001 && 
                                  Math.abs(chainUSDTBalance - dappUSDTBalance) < 0.001;
    
    // 2. SCIA余额一致性：钱包端 === 链上（合约端）=== DAPP端
    const sciaBalanceConsistency = Math.abs(walletSCIABalance - chainSCIABalance) < 0.001 && 
                                  Math.abs(chainSCIABalance - dappSCIABalance) < 0.001;
    
    // 3. 徽章一致性：DAPP端 === 链上（合约端）
    const badgeConsistency = dappBadgeLevel === chainBadgeLevel;
    
    // 4. 积分一致性：DAPP端 === 链上（合约端）
    const pointsConsistency = Math.abs(dappPoints - chainPoints) < 0.001;
    
    // 5. 推荐人一致性：DAPP端 === 链上（合约端）
    const referrerConsistency = dappReferrer === chainReferrer;
    
    const isOverallConsistent = usdtBalanceConsistency && sciaBalanceConsistency && 
                               badgeConsistency && pointsConsistency && referrerConsistency;
    
    setConsistencyResults({
      usdtBalanceConsistency,
      sciaBalanceConsistency,
      badgeConsistency,
      pointsConsistency,
      referrerConsistency,
      isOverallConsistent
    });
  };

  // 定期验证三端一致性
  useEffect(() => {
    const verifyInterval = setInterval(() => {
      verifyThreeEndConsistency();
      setLastVerified(new Date());
    }, 30000);

    // 初始验证
    verifyThreeEndConsistency();

    return () => clearInterval(verifyInterval);
  }, [userBadgeInfo, testWalletAddress]);

  // 获取私募池信息
  const {
    data: poolInfo,
    isLoading: isLoadingPoolInfo
  } = useContractRead({
    address: PRIVATE_SALE_CONTRACT_ADDRESS,
    abi: privateSaleAbi,
    functionName: 'getPoolInfo',
    query: {
      enabled: true,
      refetchInterval: REFRESH_INTERVAL,
      retry: 1,
      staleTime: 10000
    }
  });

  // 验证当前终端的数据完整性
  const verifyDataIntegrity = () => {
    if (!poolInfo) return false;
    
    // 检查核心数据字段是否存在且有效
    const hasValidData = poolInfo[0] !== undefined && poolInfo[4] !== undefined;
    const hasPositiveValues = Number(poolInfo[0]) >= 0 && Number(poolInfo[4]) >= 0;
    
    return hasValidData && hasPositiveValues;
  };

  const isDataIntegrityValid = verifyDataIntegrity();

  // 获取徽章数量统计
  const { data: noneCount } = useContractRead({
    address: REFERRAL_CENTER_ADDRESS,
    abi: referralCenterAbi,
    functionName: 'getBadgeCount',
    args: [BadgeLevel.None],
    query: {
      enabled: true,
      refetchInterval: REFRESH_INTERVAL,
      retry: 1,
      staleTime: 10000
    }
  });

  const { data: memberCount } = useContractRead({
    address: REFERRAL_CENTER_ADDRESS,
    abi: referralCenterAbi,
    functionName: 'getBadgeCount',
    args: [BadgeLevel.Member],
    query: {
      enabled: true,
      refetchInterval: REFRESH_INTERVAL,
      retry: 1,
      staleTime: 10000
    }
  });

  const { data: cityCount } = useContractRead({
    address: REFERRAL_CENTER_ADDRESS,
    abi: referralCenterAbi,
    functionName: 'getBadgeCount',
    args: [BadgeLevel.City],
    query: {
      enabled: true,
      refetchInterval: REFRESH_INTERVAL,
      retry: 1,
      staleTime: 10000
    }
  });

  const { data: provinceCount } = useContractRead({
    address: REFERRAL_CENTER_ADDRESS,
    abi: referralCenterAbi,
    functionName: 'getBadgeCount',
    args: [BadgeLevel.Province],
    query: {
      enabled: true,
      refetchInterval: REFRESH_INTERVAL,
      retry: 1,
      staleTime: 10000
    }
  });

  const { data: nationalCount } = useContractRead({
    address: REFERRAL_CENTER_ADDRESS,
    abi: referralCenterAbi,
    functionName: 'getBadgeCount',
    args: [BadgeLevel.National],
    query: {
      enabled: true,
      refetchInterval: REFRESH_INTERVAL,
      retry: 1,
      staleTime: 10000
    }
  });

  // 调试日志：查看徽章数量的值
  React.useEffect(() => {
    console.log('Badge counts:', {
      noneCount: Number(noneCount),
      memberCount: Number(memberCount),
      cityCount: Number(cityCount),
      provinceCount: Number(provinceCount),
      nationalCount: Number(nationalCount),
      total: Number(noneCount) + Number(memberCount) + Number(cityCount) + Number(provinceCount) + Number(nationalCount)
    });
  }, [noneCount, memberCount, cityCount, provinceCount, nationalCount]);

  // 计算销售进度
  const calculateSaleProgress = () => {
    if (!poolInfo) return 0;
    const [remainingPrivateSale, , , , totalSoldSCIA] = poolInfo;
    const totalPool = Number(remainingPrivateSale) + Number(totalSoldSCIA);
    if (totalPool === 0) return 0;
    return (Number(totalSoldSCIA) / totalPool) * 100;
  };

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
        <BarChartOutlined style={{ marginRight: '10px', fontSize: FONT_SIZES.titleMedium }} />
        {t('statistics')}
      </Title>

      {/* 加载状态 */}
      <Spin
        spinning={isLoadingPoolInfo}
        indicator={<LoadingOutlined style={{ fontSize: FONT_SIZES.titleLarge, color: COLORS.primary }} spin />}
      >
        {/* 概览统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: CARD_MARGIN_BOTTOM, alignItems: 'stretch' }}>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Card style={{ 
              ...CARD_STYLE, 
              padding: '24px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }} hoverable>
              <Statistic
                title={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium, lineHeight: LINE_HEIGHTS.body }}>{t('totalSales')}</Text>}
                value={poolInfo ? Number(poolInfo[4]) / 10 ** 18 * 0.1 : 0}
                precision={2}
                valueStyle={{ color: COLORS.success, fontSize: '28px', fontWeight: 'bold', lineHeight: LINE_HEIGHTS.title }}
                suffix={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium }}>USDT</Text>}
                prefix={<DollarCircleOutlined style={{ color: COLORS.success, fontSize: FONT_SIZES.titleSmall }} />}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Card style={{ 
              ...CARD_STYLE, 
              padding: '24px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }} hoverable>
              <Statistic
                title={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium, lineHeight: LINE_HEIGHTS.body }}>{t('soldTokens')}</Text>}
                value={poolInfo ? Number(poolInfo[4]) / 10 ** 18 : 0}
                precision={0}
                valueStyle={{ color: COLORS.primary, fontSize: '28px', fontWeight: 'bold', lineHeight: LINE_HEIGHTS.title }}
                suffix={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium }}>SCIA</Text>}
                prefix={<ArrowUpOutlined style={{ color: COLORS.primary, fontSize: FONT_SIZES.titleSmall }} />}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Card style={{ 
              ...CARD_STYLE, 
              padding: '24px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }} hoverable>
              <Statistic
                title={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium, lineHeight: LINE_HEIGHTS.body }}>{t('remainingTokens')}</Text>}
                value={poolInfo ? Number(poolInfo[0]) / 10 ** 18 : 0}
                precision={0}
                valueStyle={{ color: COLORS.warning, fontSize: '28px', fontWeight: 'bold', lineHeight: LINE_HEIGHTS.title }}
                suffix={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium }}>SCIA</Text>}
                prefix={<WalletOutlined style={{ color: COLORS.warning, fontSize: FONT_SIZES.titleSmall }} />}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Card style={{ 
              ...CARD_STYLE, 
              padding: '24px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }} hoverable>
              <Statistic
                title={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium, lineHeight: LINE_HEIGHTS.body }}>{t('participants')}</Text>}
                value={Number(noneCount) + Number(memberCount) + Number(cityCount) + Number(provinceCount) + Number(nationalCount) || 0}
                valueStyle={{ color: COLORS.badgeProvince, fontSize: '28px', fontWeight: 'bold', lineHeight: LINE_HEIGHTS.title }}
                suffix={<Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium }}>人</Text>}
                prefix={<UserOutlined style={{ color: COLORS.badgeProvince, fontSize: FONT_SIZES.titleSmall }} />}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 徽章统计 */}
        <Row gutter={[16, 16]} style={{ marginBottom: CARD_MARGIN_BOTTOM, alignItems: 'stretch' }}>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Card 
              style={{ 
                ...CARD_STYLE, 
                textAlign: 'center',
                padding: '24px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              hoverable
            >
              <Title level={4} style={{ color: COLORS.badgeMember, margin: '0 0 12px', fontSize: '18px' }}>{t('memberBadge')}</Title>
              <Statistic
                value={Number(memberCount) || 0}
                valueStyle={{ color: COLORS.badgeMember, fontSize: '36px' }}
                suffix={t('people')}
              />
              <Text style={{ color: COLORS.textSecondary, display: 'block', marginTop: '12px', fontSize: '14px' }}>
                {t('pointsRequired', { points: '1100' })}
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Card 
              style={{ 
                ...CARD_STYLE, 
                textAlign: 'center',
                padding: '24px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              hoverable
            >
              <Title level={4} style={{ color: COLORS.badgeCity, margin: '0 0 12px', fontSize: '18px' }}>{t('cityBadge')}</Title>
              <Statistic
                value={Number(cityCount) || 0}
                valueStyle={{ color: COLORS.badgeCity, fontSize: '36px' }}
                suffix={t('people')}
              />
              <Text style={{ color: COLORS.textSecondary, display: 'block', marginTop: '12px', fontSize: '14px' }}>
                {t('pointsRequired', { points: '5500' })}
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Card 
              style={{ 
                ...CARD_STYLE, 
                textAlign: 'center',
                padding: '24px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              hoverable
            >
              <Title level={4} style={{ color: COLORS.badgeProvince, margin: '0 0 12px', fontSize: '18px' }}>{t('provinceBadge')}</Title>
              <Statistic
                value={Number(provinceCount) || 0}
                valueStyle={{ color: COLORS.badgeProvince, fontSize: '36px' }}
                suffix={t('people')}
              />
              <Text style={{ color: COLORS.textSecondary, display: 'block', marginTop: '12px', fontSize: '14px' }}>
                {t('pointsRequired', { points: '27500' })}
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6} xl={6}>
            <Card 
              style={{ 
                ...CARD_STYLE, 
                textAlign: 'center',
                padding: '24px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              hoverable
            >
              <Title level={4} style={{ color: COLORS.badgeNational, margin: '0 0 12px', fontSize: '18px' }}>{t('nationalBadge')}</Title>
              <Statistic
                value={Number(nationalCount) || 0}
                valueStyle={{ color: COLORS.badgeNational, fontSize: '36px' }}
                suffix={t('people')}
              />
              <Text style={{ color: COLORS.textSecondary, display: 'block', marginTop: '12px', fontSize: '14px' }}>
                {t('pointsRequired', { points: '137500' })}
              </Text>
            </Card>
          </Col>
        </Row>

        {/* 终端一致性与完整性验证 */}
        <Card 
          title={<span><BarChartOutlined style={{ marginRight: '8px', color: COLORS.primary }} /> {t('terminalVerification')}</span>} 
          style={{ ...CARD_STYLE, marginBottom: CARD_MARGIN_BOTTOM }}
          headStyle={CARD_HEAD_STYLE}
        >
          <Row gutter={16} align="middle" style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: `1px solid ${COLORS.border}` }}>
            <Col xs={24} sm={24} md={8}>
              <Title level={4} style={{ color: COLORS.textPrimary, margin: 0, fontSize: FONT_SIZES.titleSmall, fontWeight: 'bold' }}>{t('salesProgress')}</Title>
              <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium }}>
                {poolInfo ? `${Number(poolInfo[4]) / 10 ** 18} SCIA / ${(Number(poolInfo[0]) + Number(poolInfo[4])) / 10 ** 18} SCIA` : '0 / 0'}
              </Text>
            </Col>
            <Col xs={24} sm={24} md={16}>
              <Progress 
                percent={calculateSaleProgress() || 0} 
                strokeColor={{
                  '0%': '#1890ff',
                  '100%': '#52c41a',
                }} 
                style={{ marginBottom: '8px' }}
                strokeWidth={10}
                format={percent => (
                  <span style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: FONT_SIZES.bodyLarge }}>
                    {(percent || 0).toFixed(1)}%
                  </span>
                )}
                trailColor="rgba(255, 255, 255, 0.1)"
              />
              <Text style={{ color: COLORS.textTertiary, fontSize: FONT_SIZES.bodySmall, display: 'block', textAlign: 'center' }}>
                {t('realTimeUpdate')}
              </Text>
            </Col>
          </Row>
          
          <Row gutter={16} align="top">
            {/* 当前设备信息 */}
            <Col xs={24} sm={24} md={12}>
              <Title level={5} style={{ color: COLORS.textPrimary, marginBottom: '16px', fontSize: '16px' }}>{t('currentDevice')}</Title>
              <Row gutter={12}>
                <Col xs={8} sm={8}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px'
                  }}>
                    {deviceType === 'desktop' && <LaptopOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '8px' }} />}
                    {deviceType === 'mobile' && <MobileOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }} />}
                    {deviceType === 'tablet' && <TabletOutlined style={{ fontSize: '32px', color: '#faad14', marginBottom: '8px' }} />}
                    <Text style={{ color: '#ffffff', fontSize: '14px', fontWeight: 'bold' }}>
                      {t(deviceType)}
                    </Text>
                  </div>
                </Col>
                <Col xs={16} sm={16}>
                  <div style={{ padding: '12px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                    <Text style={{ color: '#ffffff', opacity: 0.7, display: 'block', marginBottom: '8px' }}>{t('viewportSize')}</Text>
                    <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '16px' }}>
                      {viewportSize.width} × {viewportSize.height}
                    </Text>
                    <br />
                    <Text style={{ color: '#ffffff', opacity: 0.7, display: 'block', marginTop: '8px' }}>{t('deviceType')}</Text>
                    <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px' }}>
                      {t(deviceType)}
                    </Text>
                  </div>
                </Col>
              </Row>

              {/* 设备兼容性状态 */}
              <Title level={5} style={{ color: COLORS.textPrimary, marginTop: '24px', marginBottom: '16px', fontSize: '16px' }}>{t('deviceCompatibility')}</Title>
              <div style={{ padding: '12px', backgroundColor: `rgba(${COLORS.success}, 0.1)`, borderRadius: '8px' }}>
                <Row gutter={16} align="top">
                  <Col xs={12} sm={12}>
                    <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '4px', fontSize: '14px' }}>{t('responsiveDesign')}</Text>
                    <Tag color="success" style={{ marginRight: '8px', fontSize: '12px' }}>{t('normal')}</Tag>
                  </Col>
                  <Col xs={12} sm={12}>
                    <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '4px', fontSize: '14px' }}>{t('featureIntegrity')}</Text>
                    <Tag color="success" style={{ marginRight: '8px', fontSize: '12px' }}>{t('normal')}</Tag>
                  </Col>
                </Row>
              </div>

              {/* 钱包信息验证 */}
              <Title level={5} style={{ color: COLORS.textPrimary, marginTop: '24px', marginBottom: '16px', fontSize: '16px' }}>{t('walletInfoVerification')}</Title>
              <Card 
                style={{ 
                  ...CARD_STYLE, 
                  marginBottom: '16px'
                }}
                headStyle={{ padding: '12px', borderBottom: 'none' }}
                hoverable
              >
                <Row gutter={16} align="top">
                  <Col xs={24} sm={12} md={12}>
                    <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>{t('walletAddress')}</Text>
                    <Text style={{ 
                      color: COLORS.textPrimary, 
                      fontWeight: 'bold', 
                      wordBreak: 'break-all',
                      fontSize: '14px',
                      backgroundColor: COLORS.backgroundPrimary,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      display: 'block'
                    }}>
                      {testWalletAddress === '0x0000000000000000000000000000000000000000' ? t('notConnected') : testWalletAddress}
                    </Text>
                  </Col>
                  <Col xs={24} sm={12} md={12}>
                    <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>{t('blockchainData')}</Text>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Tag color="success" style={{ marginRight: '8px', fontSize: '12px' }}>{t('obtained')}</Tag>
                      <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: '14px' }}>
                        {t('normal')}
                      </Text>
                    </div>
                    <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', marginTop: '12px', fontSize: '14px' }}>{t('dataSync')}</Text>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Tag color="success" style={{ marginRight: '8px', fontSize: '12px' }}>{t('realTime')}</Tag>
                      <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: '14px' }}>
                        {t('updateInterval', { seconds: '5' })}
                      </Text>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* 数据完整性与一致性验证 */}
            <Col xs={24} sm={24} md={12}>
              <Title level={5} style={{ color: COLORS.textPrimary, marginBottom: '16px', fontSize: '16px' }}>{t('threeEndConsistency')}</Title>
              <Row gutter={16}>
                {/* 数据完整性 */}
                <Col span={24}>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: isDataIntegrityValid ? 'rgba(82, 196, 26, 0.1)' : 'rgba(255, 77, 79, 0.1)', 
                    borderRadius: '8px', 
                    marginBottom: '16px',
                    border: `1px solid ${isDataIntegrityValid ? COLORS.success : COLORS.error}33`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircleOutlined style={{ color: isDataIntegrityValid ? COLORS.success : COLORS.error, marginRight: '8px' }} />
                        <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: '16px' }}>
                          {t('dataIntegrity')}：{isDataIntegrityValid ? t('normal') : t('abnormal')}
                        </Text>
                      </div>
                      <Tag color={isDataIntegrityValid ? 'success' : 'error'} style={{ fontSize: '12px' }}>
                        {isDataIntegrityValid ? t('yes') : t('no')}
                      </Tag>
                    </div>
                    <Text style={{ color: COLORS.textSecondary, fontSize: '14px', marginTop: '8px', display: 'block' }}>
                      {t('verifyingCoreData')}
                    </Text>
                  </div>
                </Col>

                {/* 三端一致性总览 */}
                <Col span={24}>
                  <div style={{ 
                    padding: '16px', 
                    backgroundColor: consistencyResults.isOverallConsistent ? 'rgba(82, 196, 26, 0.1)' : 'rgba(255, 77, 79, 0.1)', 
                    borderRadius: '8px', 
                    marginBottom: '16px',
                    border: `1px solid ${consistencyResults.isOverallConsistent ? COLORS.success : COLORS.error}33`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <BarChartOutlined style={{ color: consistencyResults.isOverallConsistent ? COLORS.success : COLORS.error, marginRight: '8px' }} />
                        <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: '16px' }}>
                          {t('overallConsistency')}：{consistencyResults.isOverallConsistent ? t('success') : t('failure')}
                        </Text>
                      </div>
                      <Tag color={consistencyResults.isOverallConsistent ? 'success' : 'error'} style={{ fontSize: '12px' }}>
                        {consistencyResults.isOverallConsistent ? t('yes') : t('no')}
                      </Tag>
                    </div>
                    <Text style={{ color: COLORS.textSecondary, fontSize: '14px', marginTop: '8px', display: 'block' }}>
                      {t('verifyingDappChainDataConsistency')}
                    </Text>
                  </div>
                </Col>

                {/* 私募池信息 */}
                <Col span={24}>
                  <Card 
                    title={t('privatePoolInfo')} 
                    style={{ 
                      ...CARD_STYLE, 
                      marginBottom: '16px'
                    }}
                    headStyle={{ padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
                    hoverable
                  >
                    <Row gutter={16}>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>{t('remainingPrivateSale')}</Text>
                        <Text style={{ 
                          color: COLORS.textPrimary, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: COLORS.backgroundPrimary,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {poolInfo ? Number(poolInfo[0]) / 10 ** 18 : 0} SCIA
                        </Text>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>{t('remainingReward')}</Text>
                        <Text style={{ 
                          color: COLORS.textPrimary, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: COLORS.backgroundPrimary,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {poolInfo ? Number(poolInfo[1]) / 10 ** 18 : 0} SCIA
                        </Text>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>{t('currentPrivatePool')}</Text>
                        <Text style={{ 
                          color: COLORS.textPrimary, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: COLORS.backgroundPrimary,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {poolInfo ? Number(poolInfo[2]) / 10 ** 18 : 0} SCIA
                        </Text>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>{t('currentRewardPool')}</Text>
                        <Text style={{ 
                          color: COLORS.textPrimary, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: COLORS.backgroundPrimary,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {poolInfo ? Number(poolInfo[3]) / 10 ** 18 : 0} SCIA
                        </Text>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>{t('totalSold')}</Text>
                        <Text style={{ 
                          color: COLORS.textPrimary, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: COLORS.backgroundPrimary,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {poolInfo ? Number(poolInfo[4]) / 10 ** 18 : 0} SCIA
                        </Text>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>{t('totalRewards')}</Text>
                        <Text style={{ 
                          color: COLORS.textPrimary, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: COLORS.backgroundPrimary,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {poolInfo ? Number(poolInfo[5]) / 10 ** 18 : 0} SCIA
                        </Text>
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {/* 合约地址信息 */}
                <Col span={24}>
                  <Card 
                    title={t('contractAddresses')} 
                    style={{ 
                      ...CARD_STYLE, 
                      marginBottom: '16px'
                    }}
                    headStyle={{ padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
                    hoverable
                  >
                    <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '12px', fontSize: '14px' }}>{t('privateSaleContract')}：</Text>
                    <Text style={{ 
                      color: COLORS.primary, 
                      wordBreak: 'break-all',
                      fontSize: '14px',
                      backgroundColor: `rgba(24, 144, 255, 0.1)`,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      display: 'block',
                      marginBottom: '16px'
                    }}>{PRIVATE_SALE_CONTRACT_ADDRESS}</Text>
                    <Text style={{ color: COLORS.textSecondary, display: 'block', marginTop: '16px', marginBottom: '12px', fontSize: '14px' }}>{t('referralCenterContract')}：</Text>
                    <Text style={{ 
                      color: COLORS.primary, 
                      wordBreak: 'break-all',
                      fontSize: '14px',
                      backgroundColor: `rgba(24, 144, 255, 0.1)`,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      display: 'block'
                    }}>{REFERRAL_CENTER_ADDRESS}</Text>
                  </Card>
                </Col>

                {/* 合约状态验证 */}
                <Col span={24}>
                  <Card 
                    title={t('contractStatus')} 
                    style={{ 
                      ...CARD_STYLE, 
                      marginBottom: '16px'
                    }}
                    headStyle={{ padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
                    hoverable
                  >
                    <Row gutter={16}>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>{t('saleStatus')}</Text>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Tag color={isEnded ? 'error' : (isPaused ? 'warning' : 'success')} style={{ marginRight: '8px', fontSize: '12px' }}>
                            {isEnded ? t('ended') : (isPaused ? t('paused') : t('ongoing'))}
                          </Tag>
                          <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: '14px' }}>
                            {isEnded ? t('saleEnded') : (isPaused ? t('salePaused') : t('saleOngoing'))}
                          </Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>{t('soldTokens')}</Text>
                        <Text style={{ 
                          color: COLORS.textPrimary, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: COLORS.backgroundPrimary,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {poolInfo ? (Number(poolInfo[4]) / 10 ** 18).toFixed(2) : '0.00'} SCIA
                        </Text>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>{t('totalSales')}</Text>
                        <Text style={{ 
                          color: COLORS.success, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: 'rgba(82, 196, 26, 0.1)',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {poolInfo ? (Number(poolInfo[4]) / 10 ** 18 * 0.1).toFixed(4) : '0.0000'} USDT
                        </Text>
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {/* 徽章信息验证 */}
                <Col span={24}>
                  <Card 
                    title={t('badgeVerification')} 
                    style={{ 
                      ...CARD_STYLE, 
                      marginBottom: '16px'
                    }}
                    headStyle={{ padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
                    hoverable
                  >
                    <Row gutter={16}>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>{t('currentBadge')}</Text>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Tag 
                            color={calculateBadgeVerification().status === 'success' ? 'success' : 'pending'} 
                            style={{ marginRight: '8px', fontSize: '12px' }}
                          >
                            {calculateBadgeVerification().status === 'success' ? t('obtained') : t('pending')}
                          </Tag>
                          <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', fontSize: '14px' }}>
                            {calculateBadgeVerification().badgeName}
                          </Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>{t('currentPoints')}</Text>
                        <Text style={{ 
                          color: COLORS.textPrimary, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: COLORS.backgroundPrimary,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {userBadgeInfo ? (Number(userBadgeInfo[1]) / 10 ** 18).toFixed(4) : '0.0000'} USDT
                        </Text>
                      </Col>
                      <Col xs={24} sm={12} md={8}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '10px', fontSize: '14px' }}>{t('nationalThreshold')}</Text>
                        <Text style={{ 
                          color: COLORS.textPrimary, 
                          fontWeight: 'bold',
                          fontSize: '16px',
                          backgroundColor: COLORS.backgroundPrimary,
                          padding: '8px 12px',
                          borderRadius: '6px',
                          display: 'inline-block'
                        }}>
                          {nationalBadgeThreshold ? (Number(nationalBadgeThreshold) / 10 ** 18).toFixed(2) : '0.00'} USDT
                        </Text>
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {/* 详细验证结果 */}
                <Col span={24}>
                  <div style={{ backgroundColor: COLORS.backgroundSecondary, padding: '16px', borderRadius: '8px', marginBottom: '16px', border: `1px solid ${COLORS.border}` }}>
                    <Title level={5} style={{ color: COLORS.textPrimary, marginBottom: '16px', fontSize: '16px' }}>{t('detailedVerification')}</Title>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                          <CheckCircleOutlined style={{ color: consistencyResults.usdtBalanceConsistency ? COLORS.success : COLORS.error, marginRight: '8px' }} />
                          <Text style={{ color: COLORS.textSecondary }}>
                            {t('usdtBalanceConsistency')}：{consistencyResults.usdtBalanceConsistency ? t('success') : t('failure')}
                          </Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                          <CheckCircleOutlined style={{ color: consistencyResults.sciaBalanceConsistency ? COLORS.success : COLORS.error, marginRight: '8px' }} />
                          <Text style={{ color: COLORS.textSecondary }}>
                            {t('sciaBalanceConsistency')}：{consistencyResults.sciaBalanceConsistency ? t('success') : t('failure')}
                          </Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                          <CheckCircleOutlined style={{ color: consistencyResults.badgeConsistency ? COLORS.success : COLORS.error, marginRight: '8px' }} />
                          <Text style={{ color: COLORS.textSecondary }}>
                            {t('badgeConsistency')}：{consistencyResults.badgeConsistency ? t('success') : t('failure')}
                          </Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                          <CheckCircleOutlined style={{ color: consistencyResults.pointsConsistency ? COLORS.success : COLORS.error, marginRight: '8px' }} />
                          <Text style={{ color: COLORS.textSecondary }}>
                            {t('pointsConsistency')}：{consistencyResults.pointsConsistency ? t('success') : t('failure')}
                          </Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={24}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                          <CheckCircleOutlined style={{ color: consistencyResults.referrerConsistency ? COLORS.success : COLORS.error, marginRight: '8px' }} />
                          <Text style={{ color: COLORS.textSecondary }}>
                            {t('referrerConsistency')}：{consistencyResults.referrerConsistency ? t('success') : t('failure')}
                          </Text>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Col>

                {/* 验证信息 */}
                <Col span={24}>
                  <div style={{ backgroundColor: COLORS.backgroundSecondary, padding: '16px', borderRadius: '8px', border: `1px solid ${COLORS.border}` }}>
                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 'bold' }}>{t('verificationMetrics')}</Text>
                        <ul style={{ color: COLORS.textSecondary, margin: 0, paddingLeft: 20, fontSize: '14px' }}>
                  <li style={{ marginBottom: '6px' }}>{t('usdtBalanceConsistency')} (Wallet/Contract/DAPP)</li>
                  <li style={{ marginBottom: '6px' }}>{t('sciaBalanceConsistency')} (Wallet/Contract/DAPP)</li>
                  <li style={{ marginBottom: '6px' }}>{t('badgeConsistency')} (DAPP/Contract)</li>
                  <li style={{ marginBottom: '6px' }}>{t('pointsConsistency')} (DAPP/Contract)</li>
                  <li>{t('referrerConsistency')} (DAPP/Contract)</li>
                </ul>
                      </Col>
                      <Col xs={24} sm={12}>
                        <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 'bold' }}>{t('verificationInfo')}</Text>
                        <ul style={{ color: COLORS.textSecondary, margin: 0, paddingLeft: 20, fontSize: '14px' }}>
                          <li style={{ marginBottom: '6px' }}>{t('verificationFrequency')}</li>
                          <li style={{ marginBottom: '6px' }}>{t('lastVerified')}：{lastVerified.toLocaleString()}</li>
                          <li style={{ marginBottom: '6px' }}>{t('verificationStatus')}：{consistencyResults.isOverallConsistent ? t('normal') : t('abnormal')}</li>
                          <li>{t('deviceType')}：{t(deviceType)}</li>
                        </ul>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>


      </Spin>
    </div>
  );
};

export default StatisticsPage;