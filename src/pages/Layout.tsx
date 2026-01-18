import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  FundOutlined, 
  BarChartOutlined, 
  TeamOutlined, 
  ShoppingCartOutlined, 
  PictureOutlined, 
  UserOutlined, 
  TranslationOutlined, 
  ScanOutlined 
} from '@ant-design/icons';
import { useAccount } from 'wagmi';
import WalletConnect from '../components/WalletConnect';
import { message } from 'antd';
import { BrowserMultiFormatReader } from '@zxing/library';
import { useLanguage } from '../contexts/LanguageContext';

const Layout: React.FC = () => {
  const { currentLanguage, setLanguage, t } = useLanguage();
  
  const navItems = [
    { path: '/buy', text: t('buy'), icon: <FundOutlined /> },
    { path: '/data', text: t('data'), icon: <BarChartOutlined /> },
    { path: '/community', text: t('community'), icon: <TeamOutlined /> },
    { path: '/mall', text: t('mall'), icon: <ShoppingCartOutlined /> },
    { path: '/nft', text: t('nft'), icon: <PictureOutlined /> },
    { path: '/me', text: t('me'), icon: <UserOutlined /> }
  ];
  
  const { isConnected } = useAccount();
  const location = useLocation();
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
  
  // 切换语言
  const toggleLanguage = () => {
    setLanguage(currentLanguage === 'zh' ? 'en' : 'zh');
  };

  // 处理功能按钮点击，仅检查钱包连接状态
  const handleFeatureClick = (e: React.MouseEvent) => {
    if (!isConnected) {
      message.info(t('connectWallet'));
      e.preventDefault();
      return;
    }
  };

  // 初始化扫描器
  const initializeScanner = () => {
    if (scannerRef.current) {
      return scannerRef.current;
    }
    
    const scanner = new BrowserMultiFormatReader();
    scannerRef.current = scanner;
    return scanner;
  };

  // 开始扫描
  const startScanning = async () => {
    if (!videoRef.current) return;
    
    try {
      setIsScanning(true);
      const scanner = initializeScanner();
      
      // 获取摄像头流
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // 设置视频流
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      
      // 开始识别二维码 - 使用连续扫描的方式
      const decodeLoop = async () => {
        if (!isScanning || !videoRef.current) return;
        
        try {
          // 单次识别
          const scanResult = await scanner.decodeFromVideoElement(videoRef.current);
          if (scanResult) {
            // 使用正确的方法获取解码文本
            const decodedText = scanResult.getText();
            handleScanResult(decodedText);
            return;
          }
        } catch (error: any) {
          // 忽略未找到二维码的错误，继续扫描
          if (error && error.message && !error.message.includes('NotFoundException')) {
            console.error('扫描错误:', error);
          }
        }
        
        // 继续扫描
        if (isScanning) {
          requestAnimationFrame(decodeLoop);
        }
      };
      
      // 启动扫描循环
      decodeLoop();
    } catch (error: any) {
      console.error('Cannot access camera:', error);
      message.error(t('cannotAccessCamera'));
      setIsScanning(false);
      setScanModalVisible(false);
    }
  };

  // 停止扫描
  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stopContinuousDecode();
      scannerRef.current.reset();
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  // 处理扫描结果
  const handleScanResult = (result: string) => {
    try {
      // 停止扫描
      stopScanning();
      
      // 尝试解析扫描结果
      const parsedResult = new URL(result);
      const ref = parsedResult.searchParams.get('ref');
      if (ref) {
        message.success(t('scanSuccessReferrer', { ref }));
        // 跳转到购买页面并自动填充推荐人
        window.location.href = `/buy?ref=${ref}`;
      } else {
        message.success(t('scanResult', { result }));
        // 关闭模态框
        setScanModalVisible(false);
      }
    } catch {
      // 如果不是URL，直接显示结果
      message.success(t('scanResult', { result }));
      // 关闭模态框
      setScanModalVisible(false);
    }
  };

  // 处理扫描按钮点击
  const handleScanClick = () => {
    setScanModalVisible(true);
  };

  // 关闭扫描模态框
  const handleScanModalClose = () => {
    stopScanning();
    setScanModalVisible(false);
  };

  // 当模态框打开时，开始扫描
  useEffect(() => {
    if (scanModalVisible) {
      startScanning();
    } else {
      stopScanning();
    }
    
    // 组件卸载时清理资源
    return () => {
      stopScanning();
    };
  }, [scanModalVisible]);

  return (
    <div className="layout-container">
      {/* 顶部导航栏 */}
      <div className="top-nav">
        <div className="top-nav-left">
          <div className="nav-icon">
            <ScanOutlined onClick={handleScanClick} />
          </div>
          <div className="nav-icon">
            <TranslationOutlined onClick={toggleLanguage} />
          </div>
        </div>
        
        {/* LOGO */}
        <div className="logo-container">
          <span className="logo-letter logo-letter-S">S</span>
          <span className="logo-letter logo-letter-a1">a</span>
          <span className="logo-letter logo-letter-n">n</span>
          <span className="logo-letter logo-letter-c">c</span>
          <span className="logo-letter logo-letter-i">i</span>
          <span className="logo-letter logo-letter-a2">a</span>
        </div>
        
        <div className="top-nav-right">
          {/* 使用自定义的WalletConnect组件 */}
          <WalletConnect />
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="main-content">
        <Outlet />
      </div>
      
      {/* 底部导航栏 */}
      <div className="bottom-nav">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={handleFeatureClick}
          >
            <div className="nav-item-icon">{item.icon}</div>
            <span>{item.text}</span>
          </Link>
        ))}
      </div>

      {/* 扫描二维码模态框 - 只有在visible为true时才渲染 */}
      {scanModalVisible && (
        <div className="scan-modal">
          <div className="scan-modal-content">
            {/* 模态框头部 */}
            <div className="scan-modal-header">
              <div className="scan-modal-header-left">
                <ScanOutlined className="nav-icon" style={{ color: '#1890ff' }} />
                <div className="scan-modal-title">{t('scanQR')}</div>
              </div>
              <button 
                onClick={handleScanModalClose} 
                className="scan-modal-close-btn"
              >
                ×
              </button>
            </div>
            
            {/* 模态框内容 */}
            <div className="scan-modal-body">
              <div className="scan-area-container">
                {/* 真实扫描区域 */}
                <div className="scan-area">
                  {/* 视频元素 */}
                  <video
                    ref={videoRef}
                    className="scan-area-video"
                    autoPlay
                    playsInline
                  />
                  
                  {/* 扫描线动画 */}
                  {isScanning && <div className="scan-line"></div>}
                  
                  {/* 扫描框覆盖 */}
                  <div className="scan-overlay"></div>
                  
                  {/* 扫描提示文字 */}
                  {!isScanning && (
                    <div className="scan-initializing">
                      <div className="scan-initializing-content">
                        <ScanOutlined className="scan-initializing-icon" />
                        <div>{t('initializingCamera')}</div>
                        <div style={{ fontSize: '12px', marginTop: '4px', color: 'rgba(255, 255, 255, 0.7)' }}>{t('allowCameraAccess')}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 扫描状态提示 */}
                {isScanning && (
                  <div className="scan-status">
                    {t('scanningQR')}
                  </div>
                )}
                
                {/* 手动输入选项 */}
                <div className="manual-input-option">
                  <Link 
                    to="/buy" 
                    className="manual-input-link"
                    onClick={handleScanModalClose}
                  >
                    {t('manualInput')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;