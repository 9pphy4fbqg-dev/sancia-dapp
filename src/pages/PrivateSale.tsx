import React, { useState } from 'react';
import { Form, InputNumber, Input, Button, Card, Divider, Typography, message, Row, Col, Tag, Spin } from 'antd';
import { useAccount, useContractRead, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';
import { privateSaleAbi } from '../abi/privateSale';
import { usdtAbi } from '../abi/usdt';
import { referralCenterAbi } from '../abi/referralCenter';
import { ShoppingCartOutlined, LoadingOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';

// 色彩主题定义 - 与数据页面保持一致
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

// 统一样式常量 - 与数据页面保持一致
const CARD_STYLE = {
  backgroundColor: COLORS.backgroundPrimary,
  borderRadius: '12px',
  border: `1px solid ${COLORS.border}`,
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease-in-out, transform 0.3s ease-out, box-shadow 0.3s ease-out',
  transform: 'translateY(0)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
};

const CARD_MARGIN_BOTTOM = '24px';

// 排版常量 - 手机端优化，增大字体大小确保清晰可见
const FONT_SIZES = {
  titleLarge: '28px',
  titleMedium: '24px',
  titleSmall: '20px',
  subtitle: '18px',
  bodyLarge: '20px',
  bodyMedium: '18px',
  bodySmall: '14px'
};

const LINE_HEIGHTS = {
  title: '1.3',
  body: '1.6'
};

const { Title, Text } = Typography;

// 获取合约地址
const PRIVATE_SALE_ADDRESS = import.meta.env.REACT_APP_PRIVATE_SALE_CONTRACT_ADDRESS as `0x${string}`;
const USDT_ADDRESS = import.meta.env.REACT_APP_USDT_ADDRESS as `0x${string}`;
const REFERRAL_CENTER_ADDRESS = import.meta.env.REACT_APP_REFERRAL_CENTER_ADDRESS as `0x${string}`;

const PrivateSalePage: React.FC = () => {
  const { t } = useLanguage();
  const [form] = Form.useForm();
  const [packages, setPackages] = useState<number>(1);
  const { address: userAddress, isConnected } = useAccount();
  const [transactionStatus, setTransactionStatus] = useState<string>('');
  const [approvalHash, setApprovalHash] = useState<string | undefined>(undefined);
  const [purchaseHash, setPurchaseHash] = useState<string | undefined>(undefined);
  
  // 保存购买信息，用于授权成功后的回调
  const [purchaseInfo, setPurchaseInfo] = useState<{
    packagesToBuy: number;
    referrer: string;
  }>({
    packagesToBuy: 1,
    referrer: ''
  });

  // 关键修复：显式调用USDT合约的decimals函数，获取实际小数位数
  // 注意：新部署的合约使用18位小数，所以默认值改为18
  const { data: usdtDecimals, isLoading: isDecimalsLoading, error: decimalsError } = useContractRead({
    address: USDT_ADDRESS,
    abi: usdtAbi,
    functionName: 'decimals',
    query: {
      enabled: true, // 始终查询，不管是否连接钱包
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

  // 计算预估金额和代币数量（主网：100 USDT 一个包，1000 SCIA）
  const estimatedUSDT = packages * 100;
  const estimatedSCIA = packages * 1000;
  const requiredUSDTWei = BigInt(Math.ceil(estimatedUSDT * usdtDecimalsFactor)); // 使用动态获取的USDT小数位数

  // 获取USDT余额
  const { data: usdtBalance, isLoading: isUSDTBalanceLoading } = useContractRead({
    address: USDT_ADDRESS,
    abi: usdtAbi,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!isConnected && !!userAddress, // 只有连接且有地址时才查询
      refetchInterval: 30000, // 每30秒刷新一次
      refetchOnMount: true, // 挂载时重新查询
      refetchOnReconnect: true, // 重新连接时查询
      refetchOnWindowFocus: true, // 窗口聚焦时查询
    },
  });

  // 获取USDT授权额度
  const { data: usdtAllowance, isLoading: isUSDTAllowanceLoading } = useContractRead({
    address: USDT_ADDRESS,
    abi: usdtAbi,
    functionName: 'allowance',
    args: [userAddress as `0x${string}`, PRIVATE_SALE_ADDRESS as `0x${string}`],
    query: {
      enabled: !!isConnected && !!userAddress, // 只有连接且有地址时才查询
      refetchInterval: 30000, // 每30秒刷新一次
      refetchOnMount: true, // 挂载时重新查询
      refetchOnReconnect: true, // 重新连接时查询
      refetchOnWindowFocus: true, // 窗口聚焦时查询
    },
  });

  // 获取合约状态
  const { data: isPaused } = useContractRead({
    address: PRIVATE_SALE_ADDRESS,
    abi: privateSaleAbi,
    functionName: 'isPaused',
    query: {
      enabled: !!isConnected,
      refetchInterval: 10000, // 每10秒刷新一次
    },
  });

  const { data: isEnded } = useContractRead({
    address: PRIVATE_SALE_ADDRESS,
    abi: privateSaleAbi,
    functionName: 'isEnded',
    query: {
      enabled: !!isConnected,
      refetchInterval: 10000, // 每10秒刷新一次
    },
  });

  // 获取私募池信息
  const { data: poolInfo } = useContractRead({
    address: PRIVATE_SALE_ADDRESS,
    abi: privateSaleAbi,
    functionName: 'getPoolInfo',
    query: {
      enabled: !!isConnected,
      refetchInterval: 10000, // 每10秒刷新一次
    },
  });

  // 检查私募池余额是否足够
  const isPoolBalanceSufficient = (packagesToBuy: number): boolean => {
    if (!poolInfo) return true; // 初始状态下允许提交，后续会检查
    
    const sciaAmount = BigInt(packagesToBuy) * 1000n * 10n ** 18n; // 1000 SCIA per package, converted to wei
    return poolInfo[0] >= sciaAmount; // poolInfo[0] is remainingPrivateSale
  };

  // 检查USDT余额是否足够
  const isBalanceSufficient = (): boolean => {
    if (!usdtBalance) return true; // 初始状态下允许提交，后续会检查
    const balance = Number(usdtBalance) / usdtDecimalsFactor; // 使用动态获取的USDT小数位数
    return balance >= estimatedUSDT;
  };

  // 检查USDT授权是否足够
  const isAllowanceSufficient = (): boolean => {
    if (usdtAllowance === undefined) return true; // 初始状态下允许提交，后续会检查
    return usdtAllowance >= requiredUSDTWei;
  };

  // 获取钱包客户端
  const { data: walletClient } = useWalletClient();
  const [isApproving, setIsApproving] = useState(false);
  const [isBuying, setIsBuying] = useState(false);

  // 购买代币方法
  const handleBuyTokens = async (packagesToBuy: number, referrer: string) => {
    try {
      setTransactionStatus(t('submittingPurchaseRequest'));
      setIsBuying(true);

      // 检查钱包客户端
      if (!walletClient) {
        throw new Error('钱包客户端未连接');
      }
      
      // 调用购买方法
      const hash = await walletClient.writeContract({
        abi: privateSaleAbi,
        address: PRIVATE_SALE_ADDRESS,
        functionName: 'buyTokens',
        args: [
          BigInt(packagesToBuy), 
          referrer ? (referrer as `0x${string}`) : '0x0000000000000000000000000000000000000000' as `0x${string}`
        ],
      });

      setPurchaseHash(hash);
      setTransactionStatus(`${t('purchaseRequestSubmitted')} ${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`);
    } catch (error: any) {

      let errorMessage = t('purchaseFailedTryAgain');
      
      // 处理常见错误
      if (error.code === 4001) {
        errorMessage = t('userRejectedTransaction');
      } else if (error.code === -32603) {
        errorMessage = t('networkOrNodeErrorTryAgain');
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = t('insufficientUSDTBalance');
      } else if (error.message?.includes('reverted')) {
        errorMessage = t('transactionRejectedByContract');
      } else if (error.message?.includes('钱包客户端未连接') || error.message?.includes('Wallet client not connected')) {
        errorMessage = t('walletClientNotConnected');
      }
      
      message.error(errorMessage);
      setTransactionStatus('');
    } finally {
      setIsBuying(false);
    }
  };

  // 监听授权交易确认
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed, isError: isApprovalFailed, error: approvalError } = useWaitForTransactionReceipt({
    hash: approvalHash as `0x${string}` | undefined,
    query: {
      enabled: !!approvalHash,
    },
  });

  // 监听购买交易确认
  const { isLoading: isPurchaseConfirming, isSuccess: isPurchaseConfirmed, isError: isPurchaseFailed, error: purchaseError } = useWaitForTransactionReceipt({
    hash: purchaseHash as `0x${string}` | undefined,
    query: {
      enabled: !!purchaseHash,
    },
  });

  // 监听购买交易结果
  React.useEffect(() => {
    if (isPurchaseConfirmed && purchaseHash) {
      setTransactionStatus('');
      message.success(`${t('purchaseSuccess')}
${t('transactionHash')}: ${purchaseHash.substring(0, 10)}...${purchaseHash.substring(purchaseHash.length - 8)}`);
      // 购买成功后，重置表单
      form.resetFields(['packages', 'referrer']);
      // 重置交易相关状态
      setPurchaseHash(undefined);
      // 1秒后自动刷新页面以获取最新数据
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    
    if (isPurchaseFailed && purchaseHash) {
      setTransactionStatus('');
      message.error(`${t('purchaseFailed')}: ${purchaseError?.message || t('unknownError')}
${t('transactionHash')}: ${purchaseHash.substring(0, 10)}...${purchaseHash.substring(purchaseHash.length - 8)}`);
      // 重置交易相关状态
      setPurchaseHash(undefined);
    }
  }, [isPurchaseConfirmed, isPurchaseFailed, purchaseError, form, purchaseHash]);

  // 监听授权交易结果
  React.useEffect(() => {
    if (isApprovalConfirmed && approvalHash) {
      message.success(`${t('usdtApprovalSuccess')}
${t('transactionHash')}: ${approvalHash.substring(0, 10)}...${approvalHash.substring(approvalHash.length - 8)}`);
      setTransactionStatus(t('usdtApprovalSuccessPreparingPurchase'));
      // 授权成功后，自动调用购买方法，使用保存的购买信息
      handleBuyTokens(purchaseInfo.packagesToBuy, purchaseInfo.referrer);
      // 重置授权交易哈希，避免重复触发
      setApprovalHash(undefined);
    }
    
    if (isApprovalFailed && approvalHash) {
      setTransactionStatus('');
      message.error(`${t('usdtApprovalFailed')}: ${approvalError?.message || t('unknownError')}
${t('transactionHash')}: ${approvalHash.substring(0, 10)}...${approvalHash.substring(approvalHash.length - 8)}`);
      // 重置授权交易哈希，避免重复触发
      setApprovalHash(undefined);
    }
  }, [isApprovalConfirmed, isApprovalFailed, approvalError, handleBuyTokens, purchaseInfo, approvalHash]);

  // 检查推荐关系是否存在循环
  const checkReferralCycle = async (user: string, referrer: string): Promise<boolean> => {
    if (referrer === '0x0000000000000000000000000000000000000000' || user === referrer) {
      return false;
    }
    
    try {
      // 创建一个集合来跟踪已访问的地址
      const visited = new Set<string>();
      visited.add(user);
      
      let current = referrer;
      
      // 最多检查50层，防止无限循环
      for (let i = 0; i < 50; i++) {
        // 如果当前地址已经访问过，说明存在循环
        if (visited.has(current)) {
          return true;
        }
        
        visited.add(current);
        
        // 读取当前地址的推荐人 - 使用eth_call直接调用合约
        const nextReferrer = await window.ethereum?.request({
          method: 'eth_call',
          params: [
            {
              to: REFERRAL_CENTER_ADDRESS,
              data: `0x${(await import('viem')).encodeFunctionData({
                abi: referralCenterAbi,
                functionName: 'referrers',
                args: [current as `0x${string}`]
              }).slice(2)}`,
            },
            'latest',
          ],
        });
        
        // 如果没有推荐人了，说明推荐链结束，没有循环
        if (!nextReferrer || nextReferrer === '0x0000000000000000000000000000000000000000000000000000000000000000') {
          return false;
        }
        
        // 解析返回的地址
        let parsedAddress = nextReferrer;
        if (parsedAddress.startsWith('0x')) {
          parsedAddress = parsedAddress.slice(2);
        }
        // 确保地址长度正确（32字节 -> 64字符，转换为以太坊地址需要取后20字节）
        if (parsedAddress.length === 64) {
          parsedAddress = '0x' + parsedAddress.slice(24); // 取后20字节作为地址
        } else if (parsedAddress.length === 40) {
          parsedAddress = '0x' + parsedAddress;
        } else {
          // 无效地址，结束检查
          return false;
        }
        
        current = parsedAddress;
      }
      
      // 超过50层，可能存在循环，也可能是非常深的推荐链
      // 为了安全起见，返回true，阻止这种情况
      return true;
    } catch (error) {
      console.error('Error checking referral cycle:', error);
      // 发生错误时，为了安全起见，返回true，阻止交易
      return true;
    }
  };

  // 表单提交处理
  const handleSubmit = async (values: any) => {
    try {
      // 防止在授权或购买进行中重复提交
      if (isApproving || isBuying) {
        message.info(t('operationInProgress'));
        return;
      }
      
      setTransactionStatus(t('checkingBalanceAndAllowance'));
      
      // 获取表单中的最新值
      const packagesToBuy = values.packages || packages;
      const referrer = values.referrer || '';
      
      // 重新计算所需USDT
      const updatedEstimatedUSDT = packagesToBuy * 100;
      const updatedRequiredUSDTWei = BigInt(Math.ceil(updatedEstimatedUSDT * usdtDecimalsFactor)); // 使用动态获取的USDT小数位数
      
      // 检查钱包连接
      if (!isConnected || !userAddress) {
        message.error(t('pleaseConnectWalletFirst'));
        setTransactionStatus('');
        return;
      }

      // 检查合约状态
      if (isPaused) {
        message.error(t('privateSalePausedTryAgainLater'));
        setTransactionStatus('');
        return;
      }

      if (isEnded) {
        message.error(t('privateSaleEndedCannotBuy'));
        setTransactionStatus('');
        return;
      }

      // 检查购买份数
      if (!packagesToBuy || packagesToBuy < 1 || packagesToBuy > 1000) {
        message.error(t('packagesRange'));
        setTransactionStatus('');
        return;
      }

      // 检查余额（只在usdtBalance存在时检查）
      if (usdtBalance) {
        const balanceInUSDT = Number(usdtBalance) / usdtDecimalsFactor; // 使用动态获取的USDT小数位数
        if (balanceInUSDT < updatedEstimatedUSDT) {
          message.error('USDT余额不足');
          setTransactionStatus('');
          return;
        }
      }

      // 检查私募池余额是否足够
      if (poolInfo && !isPoolBalanceSufficient(packagesToBuy)) {
        message.error('私募池余额不足，无法完成购买');
        setTransactionStatus('');
        return;
      }

      // 检查推荐关系是否存在循环
      if (referrer && referrer.trim() && referrer !== '0x0000000000000000000000000000000000000000') {
        const hasCycle = await checkReferralCycle(userAddress as string, referrer.trim());
        if (hasCycle) {
          message.error('推荐关系形成循环，请更换推荐人');
          setTransactionStatus('');
          return;
        }
      }

      // 检查授权（当usdtAllowance不存在、为0或不足时，都需要请求授权）
      // 只有当授权不足且没有正在进行的授权请求时，才请求授权
      if ((usdtAllowance === undefined || usdtAllowance === 0n || usdtAllowance < updatedRequiredUSDTWei) && !approvalHash) {
        setTransactionStatus(t('insufficientUSDTAllowanceRequesting'));
        setIsApproving(true);

        // 检查钱包客户端
        if (!walletClient) {
          message.error(t('walletClientNotConnected'));
          setTransactionStatus('');
          setIsApproving(false);
          return;
        }

        // 请求授权 - 使用实际所需金额，实现"使用多少授权多少"
        const hash = await walletClient.writeContract({
          abi: usdtAbi,
          address: USDT_ADDRESS,
          functionName: 'approve',
          args: [
            PRIVATE_SALE_ADDRESS as `0x${string}`, 
            updatedRequiredUSDTWei // 使用实际所需USDT金额
          ],
        });

        // 保存当前购买信息到状态，以便授权成功后使用
        setPurchaseInfo({ packagesToBuy, referrer });
        setApprovalHash(hash);
        message.success(t('usdtApprovalRequestSubmitted'));
        setIsApproving(false);
        return;
      }

      // 授权足够，直接购买
      handleBuyTokens(packagesToBuy, referrer);
    } catch (error: any) {

      let errorMessage = t('operationFailedTryAgain');
      
      // 处理常见错误
      if (error.code === 4001) {
        errorMessage = t('userRejectedTransaction');
      } else if (error.code === -32603) {
        errorMessage = t('networkOrNodeErrorTryAgain');
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = t('insufficientUSDTBalance');
      } else if (error.message?.includes('reverted')) {
        // 检查是否是循环推荐导致的错误
        if (error.message.includes('Stack too deep') || error.message.includes('Out of gas') || error.message.includes('execution reverted')) {
          errorMessage = '推荐关系形成循环，请更换推荐人';
        } else {
          errorMessage = t('transactionRejectedByContract');
        }
      }
      
      message.error(errorMessage);
      setTransactionStatus('');
    }
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
        <ShoppingCartOutlined style={{ marginRight: '10px', fontSize: FONT_SIZES.titleMedium }} />
        {t('privateSale')}
      </Title>

      {/* 加载状态 */}
      <Spin
        spinning={false}
        indicator={<LoadingOutlined style={{ fontSize: FONT_SIZES.titleLarge, color: COLORS.primary }} spin />}
      >
        {/* 私募概览信息 */}
        <Row gutter={[16, 16]} style={{ marginBottom: CARD_MARGIN_BOTTOM, maxWidth: '500px', margin: '0 auto' }}>
          <Col xs={24} sm={12} md={12} lg={12} xl={12}>
            <Card style={{ 
              ...CARD_STYLE, 
              padding: '20px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }} hoverable>
              <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '8px', fontSize: FONT_SIZES.bodyMedium, lineHeight: LINE_HEIGHTS.body }}>
                {t('price')}
              </Text>
              <Text style={{ color: COLORS.primary, fontSize: '20px', fontWeight: 'bold', lineHeight: LINE_HEIGHTS.title }}>
                0.1 USDT / SCIA
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={12} xl={12}>
            <Card style={{ 
              ...CARD_STYLE, 
              padding: '20px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }} hoverable>
              <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '8px', fontSize: FONT_SIZES.bodyMedium, lineHeight: LINE_HEIGHTS.body }}>
                {t('perPackage')}
              </Text>
              <Text style={{ color: COLORS.primary, fontSize: '20px', fontWeight: 'bold', lineHeight: LINE_HEIGHTS.title }}>
                1000 SCIA
              </Text>
              <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodySmall }}>
                (100 USDT)
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={12} xl={12}>
            <Card style={{ 
              ...CARD_STYLE, 
              padding: '20px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }} hoverable>
              <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '8px', fontSize: FONT_SIZES.bodyMedium, lineHeight: LINE_HEIGHTS.body }}>
                {t('minimumPurchase')}
              </Text>
              <Text style={{ color: COLORS.success, fontSize: '20px', fontWeight: 'bold', lineHeight: LINE_HEIGHTS.title }}>
                1 {t('package')}
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={12} xl={12}>
            <Card style={{ 
              ...CARD_STYLE, 
              padding: '20px',
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }} hoverable>
              <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '8px', fontSize: FONT_SIZES.bodyMedium, lineHeight: LINE_HEIGHTS.body }}>
                {t('maximumPurchase')}
              </Text>
              <Text style={{ color: COLORS.success, fontSize: '20px', fontWeight: 'bold', lineHeight: LINE_HEIGHTS.title }}>
                1000 {t('packages')}
              </Text>
            </Card>
          </Col>
        </Row>

        {/* 购买表单卡片 */}
        <div style={{ maxWidth: '500px', margin: '0 auto', marginTop: CARD_MARGIN_BOTTOM }}>
          <Card 
            style={{ 
              ...CARD_STYLE,
              padding: '0'
            }}
            hoverable
          >
            <div style={{ padding: '24px' }}>
              <Divider style={{ borderColor: COLORS.border, margin: '0 0 24px 0' }} />

        {/* 购买表单 */}
        {/* 添加全局样式覆盖，确保表单文字清晰可见 */}
        <style>{`
          /* 确保表单标签文字为白色且清晰可见 */
          .ant-form-item-label > label {
            color: #ffffff !important;
            font-size: 22px !important;
            font-weight: bold !important;
            text-shadow: 0 0 4px rgba(0, 0, 0, 0.8) !important;
            line-height: 1.5 !important;
          }
          
          /* 确保表单输入框文字为白色 */
          .ant-input,
          .ant-input-number-input {
            color: #ffffff !important;
            font-size: 18px !important;
          }
          
          /* 确保表单占位符文字清晰可见 */
          .ant-input::placeholder,
          .ant-input-number-input::placeholder {
            color: rgba(255, 255, 255, 0.7) !important;
          }
        `}</style>
        
        <Form
          form={form}
          layout="vertical"
          initialValues={{ packages: 1 }}
          onFinish={handleSubmit}
          style={{ 
            width: '100%',
            color: '#ffffff !important', // 确保表单内所有文本默认使用白色
            fontSize: '18px !important' // 确保全局文字大小
          }}
          labelCol={{ 
            style: { 
              color: '#ffffff !important', // 确保文字为纯白色
              fontWeight: 'bold !important',
              fontSize: '18px !important', // 加大文字尺寸，确保手机端清晰可见
              marginBottom: '8px',
              lineHeight: '1.4'
            } 
          }}
        >
          <Form.Item
            name="packages"
            label={t('buySCIA')}
            rules={[
              { required: true, message: t('enterPackages') },
              { type: 'number', min: 1, max: 1000, message: t('packagesRange') },
            ]}
            style={{ marginBottom: '24px' }}
          >
            <InputNumber<number>
              min={1}
              max={1000}
              defaultValue={1}
              onChange={(value) => setPackages(value || 1)}
              style={{
                width: '100%',
                backgroundColor: COLORS.backgroundSecondary,
                borderColor: COLORS.border, // 恢复原来的边框颜色
                color: COLORS.textPrimary,
                borderRadius: '12px',
                fontSize: '16px',
                padding: '16px',
                boxShadow: 'none', // 移除额外的边框阴影
              }}
              formatter={(value) => `${value} ${t('packages')}`}
              parser={(value) => {
                if (!value) return 1;
                const match = value.match(/^(\d+)/);
                return match ? parseInt(match[0], 10) : 1;
              }}
            />
          </Form.Item>

          <Form.Item
            name="referrer"
            label={t('referrerAddressOptional')}
            labelCol={{ style: { color: COLORS.textPrimary, fontSize: '18px !important', fontWeight: 'bold', marginBottom: '8px', textShadow: '0 0 4px rgba(0, 0, 0, 0.5)' } }}
            rules={[
              { 
                pattern: /^0x[a-fA-F0-9]{40}$|^$/, 
                message: t('enterReferrerAddress')
              }
            ]}
            style={{ marginBottom: '24px' }}
          >
            <Input
              placeholder={t('enterReferrerAddress')}
              style={{
                width: '100%',
                backgroundColor: COLORS.backgroundSecondary,
                borderColor: COLORS.border, // 恢复原来的边框颜色
                color: '#ffffff', // 输入框文字为纯白色
                borderRadius: '12px',
                fontSize: '16px',
                padding: '16px',
                boxShadow: 'none', // 移除额外的边框阴影
              }}

            />
          </Form.Item>

          <Form.Item>
            <Card 
              style={{ 
                ...CARD_STYLE, 
                marginBottom: '24px',
                padding: '20px'
              }}
              hoverable
            >
              <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                  <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '8px', fontSize: FONT_SIZES.bodyMedium, lineHeight: LINE_HEIGHTS.body }}>
                    {t('estimatedAmount')}
                  </Text>
                  <Text strong style={{ color: COLORS.success, fontSize: '24px', fontWeight: 'bold', lineHeight: LINE_HEIGHTS.title }}>
                    {estimatedUSDT} USDT
                  </Text>
                </Col>
                <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                  <Text style={{ color: COLORS.textSecondary, display: 'block', marginBottom: '8px', fontSize: FONT_SIZES.bodyMedium, lineHeight: LINE_HEIGHTS.body }}>
                    {t('estimatedSCIA')}
                  </Text>
                  <Text strong style={{ color: COLORS.success, fontSize: '24px', fontWeight: 'bold', lineHeight: LINE_HEIGHTS.title }}>
                    {estimatedSCIA} SCIA
                  </Text>
                </Col>
              </Row>
              {isConnected && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${COLORS.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium, lineHeight: LINE_HEIGHTS.body }}>
                        {isUSDTBalanceLoading ? t('loading') : t('usdtBalance')}
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Text style={{ color: COLORS.textPrimary, fontSize: FONT_SIZES.bodyLarge, fontWeight: 'bold', lineHeight: LINE_HEIGHTS.title }}>
                          {isUSDTBalanceLoading ? '...' : `${usdtBalance ? (Number(usdtBalance) / usdtDecimalsFactor).toFixed(4) : '0'} USDT`}
                        </Text>
                        {typeof usdtBalance === 'bigint' && !isBalanceSufficient() && (
                          <Tag color="error" style={{ fontSize: FONT_SIZES.bodySmall }}>{t('insufficientBalance')}</Tag>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodyMedium, lineHeight: LINE_HEIGHTS.body }}>
                          {isUSDTAllowanceLoading ? t('loading') : t('usdtAllowance')}
                        </Text>
                        <Text style={{ color: COLORS.textPrimary, fontSize: FONT_SIZES.bodyLarge, fontWeight: 'bold', lineHeight: LINE_HEIGHTS.title }}>
                          {isUSDTAllowanceLoading ? '...' : `${usdtAllowance ? (Number(usdtAllowance) / usdtDecimalsFactor).toFixed(4) : '0'} USDT`}
                        </Text>
                      </div>
                      {typeof usdtAllowance === 'bigint' && !isAllowanceSufficient() && (
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <Tag color="warning" style={{ fontSize: FONT_SIZES.bodySmall, textAlign: 'center', width: 'auto' }}>{t('insufficientAllowance')}</Tag>
                        </div>
                      )}
                    </div>
                </div>
              )}
            </Card>
          </Form.Item>

          {/* 交易状态显示 */}
          {transactionStatus && (
            <Card 
              style={{ 
                ...CARD_STYLE, 
                backgroundColor: `rgba(24, 144, 255, 0.1)`,
                border: `1px solid ${COLORS.primary}33`,
                marginBottom: '24px',
                padding: '20px'
              }}
            >
              <Text strong style={{ color: COLORS.primary, fontSize: FONT_SIZES.bodyLarge, fontWeight: 'bold', display: 'block', marginBottom: '16px', lineHeight: LINE_HEIGHTS.title }}>
                {transactionStatus}
              </Text>
              {approvalHash && (
                <div style={{ marginBottom: '12px' }}>
                  <Text style={{ fontSize: FONT_SIZES.bodyMedium, color: COLORS.textSecondary, display: 'block', marginBottom: '8px', lineHeight: LINE_HEIGHTS.body }}>
                    {t('approvalTransactionHash')}
                  </Text>
                  <Text style={{ fontSize: FONT_SIZES.bodySmall, color: COLORS.textPrimary, wordBreak: 'break-all', lineHeight: LINE_HEIGHTS.body, backgroundColor: COLORS.backgroundSecondary, padding: '8px 12px', borderRadius: '6px', display: 'block' }}>
                    {approvalHash.substring(0, 10)}...{approvalHash.substring(approvalHash.length - 8)}
                  </Text>
                </div>
              )}
              {purchaseHash && (
                <div>
                  <Text style={{ fontSize: FONT_SIZES.bodyMedium, color: COLORS.textSecondary, display: 'block', marginBottom: '8px', lineHeight: LINE_HEIGHTS.body }}>
                    {t('purchaseTransactionHash')}
                  </Text>
                  <Text style={{ fontSize: FONT_SIZES.bodySmall, color: COLORS.textPrimary, wordBreak: 'break-all', lineHeight: LINE_HEIGHTS.body, backgroundColor: COLORS.backgroundSecondary, padding: '8px 12px', borderRadius: '6px', display: 'block' }}>
                    {purchaseHash.substring(0, 10)}...{purchaseHash.substring(purchaseHash.length - 8)}
                  </Text>
                </div>
              )}
            </Card>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{
                width: '100%',
                padding: '16px 24px',
                fontSize: FONT_SIZES.titleSmall,
                borderRadius: '12px',
                fontWeight: 'bold',
                backgroundColor: COLORS.primary,
                color: COLORS.textPrimary,
                border: 'none',
                boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
                transition: 'all 0.3s ease',
              }}
              disabled={!isConnected || isPaused || isEnded}
              loading={isApproving || isBuying || isApprovalConfirming || isPurchaseConfirming}
            >
              {!isConnected ? t('connectWalletToBuy') : 
               isPaused ? t('salePaused') : 
               isEnded ? t('saleEnded') : 
               isApproving || isApprovalConfirming ? t('usdtApproving') : 
               isBuying || isPurchaseConfirming ? t('buying') : 
               t('buyNow')}
            </Button>
          </Form.Item>
        </Form>
            </div>
          </Card>
        </div>
      </Spin>
    </div>
  );
};

export default PrivateSalePage;