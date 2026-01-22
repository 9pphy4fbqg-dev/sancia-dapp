import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Row, Col, Spin, Alert, Button, Empty, Dropdown, Menu } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useAccount } from 'wagmi';
import { checkSciaBalance } from '../lib/contracts/scia';
import { OFFICIAL_HOST_WALLET_ADDRESSES, MIN_SCIA_BALANCE, OFFICIAL_ROOM_ID, RoomInfo } from '../lib/livekit-config';
import LiveRoom from '../components/livekit/LiveRoom';
import RoomList from '../components/community/RoomList';
import { useLiveKitToken } from '../components/livekit/useLiveKitToken';

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

const CommunityPage = () => {
  const { t } = useLanguage();
  const { address } = useAccount();
  
  // 状态管理
  const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [hasSciaBalance, setHasSciaBalance] = useState(true); // 默认true，方便测试
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [liveKitToken, setLiveKitToken] = useState<string>('');
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null); // 跟踪选中的职位
  const [officialRoomLiveStatus, setOfficialRoomLiveStatus] = useState(false); // 跟踪官方直播间的直播状态
  
  // LiveKit token hook
  const { getToken, isLoading: isTokenLoading, error: tokenHookError } = useLiveKitToken();
  
  // 生成LiveKit令牌
  const generateToken = useCallback(async (roomId: string, isPublisher: boolean) => {
    if (!address) {
      setTokenError('请先连接钱包');
      return;
    }
    
    setIsGeneratingToken(true);
    setTokenError(null);
    
    try {
      const tokenResponse = await getToken({
        room: roomId,
        identity: address,
        isPublisher,
        metadata: { address }
      });
      
      setLiveKitToken(tokenResponse.token);
      console.log('LiveKit令牌生成成功:', { roomId, isPublisher });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '生成LiveKit令牌失败';
      setTokenError(errorMessage);
      console.error('生成LiveKit令牌失败:', error);
    } finally {
      setIsGeneratingToken(false);
    }
  }, [address, getToken]);
  
  // 当选择的房间、钱包地址或getToken变化时，生成新的令牌
  useEffect(() => {
    // 确保address和getToken都已准备好
    if (!address) {
      console.log('等待钱包连接...');
      return;
    }
    
    if (!getToken) {
      console.log('等待getToken函数初始化...');
      return;
    }
    
    console.log('开始生成LiveKit令牌...');
    
    if (selectedRoom) {
      const isPublisher = selectedRoom.type === 'official' 
        ? OFFICIAL_HOST_WALLET_ADDRESSES.includes(address?.toLowerCase() || '') 
        : address?.toLowerCase() === selectedRoom.creator?.toLowerCase();
      
      console.log('🔍 计算直播权限:', {
        roomType: selectedRoom.type,
        address: address?.toLowerCase(),
        officialHosts: OFFICIAL_HOST_WALLET_ADDRESSES,
        isPublisher,
        creator: selectedRoom.creator?.toLowerCase()
      });
      
      generateToken(selectedRoom.id, isPublisher);
    } else {
      // 默认生成官方直播间的令牌
      const isOfficialPublisher = OFFICIAL_HOST_WALLET_ADDRESSES.includes(address?.toLowerCase() || '');
      console.log('生成官方直播间令牌，isOfficialPublisher:', isOfficialPublisher);
      generateToken(OFFICIAL_ROOM_ID, isOfficialPublisher);
    }
  }, [selectedRoom, address, generateToken, getToken]);

  // 加载房间列表
  useEffect(() => {
    // 初始化只包含官方直播间
    const initialRooms: RoomInfo[] = [
      {
        id: OFFICIAL_ROOM_ID,
        name: '官方直播间',
        type: 'official',
        participants: 0,
        isLive: false
      }
    ];

    setRooms(initialRooms);
  }, []);

  // 检查SCIA余额
  useEffect(() => {
    const checkBalance = async () => {
      if (!address) {
        setHasSciaBalance(false);
        return;
      }

      setIsCheckingBalance(true);
      setBalanceError(null);

      try {
        const balance = await checkSciaBalance(address);
        setHasSciaBalance(balance >= MIN_SCIA_BALANCE);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to check SCIA balance';
        setBalanceError(errorMessage);
        setHasSciaBalance(false);
        console.error('Error checking SCIA balance:', error);
      } finally {
        setIsCheckingBalance(false);
      }
    };

    checkBalance();
  }, [address]);

  // 处理房间点击
  const handleRoomClick = (room: RoomInfo) => {
    setSelectedRoom(room);
  };

  // 处理创建房间
  const handleCreateRoom = () => {
    // 生成唯一房间ID
    const roomId = `user-${Date.now()}`;
    const newRoom: RoomInfo = {
      id: roomId,
      name: `直播间-${new Date().toLocaleTimeString()}`,
      type: 'user',
      participants: 0,
      isLive: false,
      creator: address,
      createdAt: Date.now()
    };

    // 添加到房间列表
    setRooms([...rooms, newRoom]);
    // 自动进入新创建的房间
    setSelectedRoom(newRoom);
  };

  // 处理退出房间
  const handleExitRoom = () => {
    setSelectedRoom(null);
  };
  
  return (
    <div style={{ padding: '0px', backgroundColor: '#000000', minHeight: 'calc(100vh - 180px)', width: '100%', margin: 0 }}>
      
      {/* 官方直播间 */}
      <div style={{ width: '100%', marginBottom: CARD_MARGIN_BOTTOM, padding: 0, margin: 0 }}>
        <LiveRoom
          roomId={OFFICIAL_ROOM_ID}
          identity={address || 'anonymous'}
          token={liveKitToken}
          isPublisher={OFFICIAL_HOST_WALLET_ADDRESSES.includes(address?.toLowerCase() || '')}
          metadata={{ address }}
          onLiveStatusChange={(isLive) => {
            console.log('官方直播间直播状态变化:', isLive);
            setOfficialRoomLiveStatus(isLive);
            
            // 更新房间列表中的官方直播间状态
            setRooms(prevRooms => {
              const updatedRooms = [...prevRooms];
              const officialRoomIndex = updatedRooms.findIndex(room => room.id === OFFICIAL_ROOM_ID);
              if (officialRoomIndex !== -1) {
                updatedRooms[officialRoomIndex] = {
                  ...updatedRooms[officialRoomIndex],
                  isLive
                };
              }
              return updatedRooms;
            });
          }}
        />
      </div>

      {/* 房间列表 */}
      <Row gutter={[16, 16]} style={{ marginBottom: CARD_MARGIN_BOTTOM }}>
        <Col xs={24} sm={24} md={24} lg={24} xl={24}>
          <RoomList
            rooms={rooms.filter(room => room.id !== OFFICIAL_ROOM_ID)}
            hasSciaBalance={hasSciaBalance}
            onRoomClick={handleRoomClick}
            onCreateRoom={handleCreateRoom}
            currentUser={address}
          />
        </Col>
      </Row>

      {/* 选中的房间 */}
      {selectedRoom && (
        <div style={{ width: '100%', marginBottom: CARD_MARGIN_BOTTOM, padding: 0, margin: 0 }}>
          {/* 添加选中房间标题 */}
          <div style={{ 
            padding: '12px 16px', 
            backgroundColor: 'rgba(255, 255, 255, 0.05)', 
            color: '#ffffff', 
            fontSize: '18px', 
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>直播间: {selectedRoom.name}</span>
            <Button onClick={handleExitRoom}>
              退出房间
            </Button>
          </div>
          <LiveRoom
            roomId={selectedRoom.id}
            identity={address || selectedRoom.id}
            token={liveKitToken}
            isPublisher={
              selectedRoom.type === 'official' 
                ? OFFICIAL_HOST_WALLET_ADDRESSES.includes(address?.toLowerCase() || '') 
                : address?.toLowerCase() === selectedRoom.creator?.toLowerCase()
            }
            metadata={{ address }}
          />
        </div>
      )}

      {/* SCIA余额检查状态 */}
      {isCheckingBalance && (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24}>
            <Card 
              style={{ 
                ...CARD_STYLE, 
                backgroundColor: COLORS.backgroundPrimary,
              }}
              headStyle={CARD_HEAD_STYLE}
            >
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                <Spin tip="检查SCIA余额..." />
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* SCIA余额错误提示 */}
      {balanceError && (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24}>
            <Card 
              style={{ 
                ...CARD_STYLE, 
                backgroundColor: COLORS.backgroundPrimary,
              }}
              headStyle={CARD_HEAD_STYLE}
            >
              <Alert
                message="SCIA余额检查失败"
                description={balanceError}
                type="error"
                showIcon
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 招聘信息 */}
      <div style={{ marginBottom: CARD_MARGIN_BOTTOM }}>
        {/* 招聘信息头部 */}
        <div style={{ 
          marginBottom: '24px', 
          padding: '16px', 
          backgroundColor: COLORS.backgroundPrimary,
          borderRadius: '8px',
          border: `1px solid ${COLORS.border}`,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Title level={4} style={{ 
              color: '#ffffff', 
              margin: 0, 
              fontSize: FONT_SIZES.titleMedium 
            }}>
              【数字珠宝 × 区块链】项目远程招聘
            </Title>
            
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Text strong style={{ color: '#ffffff' }}>智能合约已部署</Text>
                <Text style={{ color: '#ffffff' }}>✅</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Text strong style={{ color: '#ffffff' }}>DApp V1已上线</Text>
                <Text style={{ color: '#ffffff' }}>✅</Text>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Text strong style={{ color: '#ffffff' }}>工作方式：</Text>
                <Text style={{ color: '#ffffff' }}>全国远程·时间自由·异步协作</Text>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Text strong style={{ color: '#ffffff' }}>薪酬支付:</Text>
                <Text style={{ color: '#ffffff' }}>TRC20/ERC20</Text>
              </div>
            </div>
            
            <div style={{ padding: '16px', backgroundColor: COLORS.backgroundSecondary, borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Text strong style={{ color: '#ffffff', fontSize: FONT_SIZES.titleSmall }}>统一申请方式：</Text>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '24px' }}>
                <Text style={{ color: '#ffffff' }}>添加项目组 QQ → 9093443444</Text>
                <Text style={{ color: '#ffffff' }}>添加时务必备注：【岗位名称 + 姓名】</Text>
                <Text style={{ color: '#ffffff', fontSize: FONT_SIZES.bodySmall }}>例如：【主讲讲师 王芳】、【外宣专员 李雷】</Text>
                <Text style={{ color: COLORS.success, marginTop: '8px' }}>通过后将快速安排沟通，高效推进！</Text>
              </div>
              
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
                  <Dropdown
                    menu={{
                      items: [
                        { key: '1', label: t('position2Title'), style: { color: '#ffffff' } },
                        { key: '2', label: t('position3Title'), style: { color: '#ffffff' } },
                        { key: '3', label: t('position4Title'), style: { color: '#ffffff' } },
                        { key: '4', label: t('position5Title'), style: { color: '#ffffff' } },
                        { key: '5', label: t('position6Title'), style: { color: '#ffffff' } },
                        { key: '6', label: t('position7Title'), style: { color: '#ffffff' } },
                        { key: '7', label: t('position8Title'), style: { color: '#ffffff' } },
                      ],
                      style: {
                        backgroundColor: '#000000',
                        border: `1px solid ${COLORS.border}`,
                        color: '#ffffff',
                      },
                      onClick: (e) => setSelectedPosition(e.key),
                    }}
                    trigger={['click']}
                    placement="bottom"
                  >
                    <Button
                      type="primary"
                      style={{
                        backgroundColor: COLORS.primary,
                        color: '#ffffff',
                        padding: '10px 24px',
                        fontSize: FONT_SIZES.bodyMedium,
                        borderRadius: '6px',
                      }}
                    >
                      Sancia项目组招聘
                    </Button>
                  </Dropdown>
                </div>
            </div>
          </div>
        </div>

        {/* 职位列表 - 只显示选中的职位 */}
        {selectedPosition && (
          <Row gutter={[16, 16]}>
          {/* 2. 创意美工 / 品牌视觉设计师（全职或兼职） */}
          {selectedPosition === '1' && (
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Card 
              title={t('position2Title')} 
              style={{ 
                ...CARD_STYLE, 
                marginBottom: CARD_MARGIN_BOTTOM,
                backgroundColor: COLORS.backgroundPrimary,
              }}
              headStyle={CARD_HEAD_STYLE}
              hoverable
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position2WhatYouDo')}</Text>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                    <li>{t('position2Content1')}</li>
                    <li>{t('position2Content2')}</li>
                    <li>{t('position2Content3')}</li>
                  </ul>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position2Requirement')}</Text>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                    <li>{t('position2Req1')}</li>
                    <li>{t('position2Req2')}</li>
                    <li>{t('position2Req3')}</li>
                  </ul>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', backgroundColor: COLORS.backgroundSecondary, borderRadius: '6px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position2SalaryRange')}</Text>
                  <Text style={{ color: COLORS.textSecondary }}>{t('position2Salary1')}</Text>
                  <Text style={{ color: COLORS.textSecondary }}>{t('position2Salary2')}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodySmall }}>{t('position2Payment')}</Text>
                </div>
              </div>
            </Card>
          </Col>
          )}

          {/* 3. React 前端工程师（Web3 · 全职） */}
          {selectedPosition === '2' && (
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Card 
              title={t('position3Title')} 
              style={{ 
                ...CARD_STYLE, 
                marginBottom: CARD_MARGIN_BOTTOM,
                backgroundColor: COLORS.backgroundPrimary,
              }}
              headStyle={CARD_HEAD_STYLE}
              hoverable
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position3WhatYouDo')}</Text>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                    <li>{t('position3Content1')}</li>
                    <li>{t('position3Content2')}</li>
                    <li>{t('position3Content3')}</li>
                  </ul>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position3Requirement')}</Text>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                    <li>{t('position3Req1')}</li>
                    <li>{t('position3Req2')}</li>
                    <li>{t('position3Req3')}</li>
                  </ul>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', backgroundColor: COLORS.backgroundSecondary, borderRadius: '6px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position3SalaryRange')}</Text>
                  <Text style={{ color: COLORS.textSecondary }}>{t('position3Salary')}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodySmall }}>{t('position3Payment')}</Text>
                </div>
              </div>
            </Card>
          </Col>
          )}

          {/* 4. 智能合约维护工程师（兼职顾问） */}
          {selectedPosition === '3' && (
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Card 
              title={t('position4Title')} 
              style={{ 
                ...CARD_STYLE, 
                marginBottom: CARD_MARGIN_BOTTOM,
                backgroundColor: COLORS.backgroundPrimary,
              }}
              headStyle={CARD_HEAD_STYLE}
              hoverable
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position4WhatYouDo')}</Text>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                    <li>{t('position4Content1')}</li>
                    <li>{t('position4Content2')}</li>
                    <li>{t('position4Content3')}</li>
                  </ul>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position4Requirement')}</Text>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                    <li>{t('position4Req1')}</li>
                    <li>{t('position4Req2')}</li>
                    <li>{t('position4Req3')}</li>
                  </ul>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', backgroundColor: COLORS.backgroundSecondary, borderRadius: '6px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position4SalaryRange')}</Text>
                  <Text style={{ color: COLORS.textSecondary }}>{t('position4Salary')}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodySmall }}>{t('position4Payment')}</Text>
                </div>
              </div>
            </Card>
          </Col>
          )}

          {/* 5. Web3 测试专员（兼职） */}
          {selectedPosition === '4' && (
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Card 
              title={t('position5Title')} 
              style={{ 
                ...CARD_STYLE, 
                marginBottom: CARD_MARGIN_BOTTOM,
                backgroundColor: COLORS.backgroundPrimary,
              }}
              headStyle={CARD_HEAD_STYLE}
              hoverable
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position5WhatYouDo')}</Text>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                    <li>{t('position5Content1')}</li>
                    <li>{t('position5Content2')}</li>
                    <li>{t('position5Content3')}</li>
                  </ul>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position5Requirement')}</Text>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                    <li>{t('position5Req1')}</li>
                    <li>{t('position5Req2')}</li>
                    <li>{t('position5Req3')}</li>
                  </ul>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', backgroundColor: COLORS.backgroundSecondary, borderRadius: '6px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position5SalaryRange')}</Text>
                  <Text style={{ color: COLORS.textSecondary }}>{t('position5Salary')}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodySmall }}>{t('position5Payment')}</Text>
                </div>
              </div>
            </Card>
          </Col>
          )}

          {/* 6. Web3 客服专员（兼职 / 全职） */}
          {selectedPosition === '5' && (
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Card 
              title={t('position6Title')} 
              style={{ 
                ...CARD_STYLE, 
                marginBottom: CARD_MARGIN_BOTTOM,
                backgroundColor: COLORS.backgroundPrimary,
              }}
              headStyle={CARD_HEAD_STYLE}
              hoverable
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position6WhatYouDo')}</Text>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                    <li>{t('position6Content1')}</li>
                    <li>{t('position6Content2')}</li>
                    <li>{t('position6Content3')}</li>
                  </ul>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position6Requirement')}</Text>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                    <li>{t('position6Req1')}</li>
                    <li>{t('position6Req2')}</li>
                    <li>{t('position6Req3')}</li>
                    <li>{t('position6Req4')}</li>
                  </ul>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', backgroundColor: COLORS.backgroundSecondary, borderRadius: '6px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position6SalaryRange')}</Text>
                  <Text style={{ color: COLORS.textSecondary }}>{t('position6Salary1')}</Text>
                  <Text style={{ color: COLORS.textSecondary }}>{t('position6Salary2')}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodySmall }}>{t('position6Payment')}</Text>
                </div>
              </div>
            </Card>
          </Col>
          )}

          {/* 7. 外宣 / 社群运营专员（全职或强兼职） */}
          {selectedPosition === '6' && (
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Card 
              title={t('position7Title')} 
              style={{ 
                ...CARD_STYLE, 
                marginBottom: CARD_MARGIN_BOTTOM,
                backgroundColor: COLORS.backgroundPrimary,
              }}
              headStyle={CARD_HEAD_STYLE}
              hoverable
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position7WhatYouDo')}</Text>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                    <li>{t('position7Content1')}</li>
                    <li>{t('position7Content2')}</li>
                    <li>{t('position7Content3')}</li>
                    <li>{t('position7Content4')}</li>
                    <li>{t('position7Content5')}</li>
                  </ul>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position7Requirement')}</Text>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                    <li>{t('position7Req1')}</li>
                    <li>{t('position7Req2')}</li>
                    <li>{t('position7Req3')}</li>
                    <li>{t('position7Req4')}</li>
                  </ul>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', backgroundColor: COLORS.backgroundSecondary, borderRadius: '6px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position7SalaryRange')}</Text>
                  <Text style={{ color: COLORS.textSecondary }}>{t('position7Salary1')}</Text>
                  <Text style={{ color: COLORS.textSecondary }}>{t('position7Salary2')}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodySmall }}>{t('position7Payment')}</Text>
                </div>
              </div>
            </Card>
          </Col>
          )}

          {/* 8. Web3 主持讲师 / 项目布道师（兼职或全职） */}
          {selectedPosition === '7' && (
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Card 
              title={t('position8Title')} 
              style={{ 
                ...CARD_STYLE, 
                marginBottom: CARD_MARGIN_BOTTOM,
                backgroundColor: COLORS.backgroundPrimary,
              }}
              headStyle={CARD_HEAD_STYLE}
              hoverable
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position8WhatYouDo')}</Text>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                    <li>{t('position8Content1')}</li>
                    <li>{t('position8Content2')}</li>
                    <li>{t('position8Content3')}</li>
                    <li>{t('position8Content4')}</li>
                  </ul>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position8Requirement')}</Text>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px', color: COLORS.textSecondary }}>
                    <li>{t('position8Req1')}</li>
                    <li>{t('position8Req2')}</li>
                    <li>{t('position8Req3')}</li>
                    <li>{t('position8Req4')}</li>
                    <li>{t('position8Req5')}</li>
                    <li>{t('position8Req6')}</li>
                  </ul>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', backgroundColor: COLORS.backgroundSecondary, borderRadius: '6px' }}>
                  <Text strong style={{ color: COLORS.textPrimary }}>{t('position8SalaryRange')}</Text>
                  <Text style={{ color: COLORS.textSecondary }}>{t('position8Salary1')}</Text>
                  <Text style={{ color: COLORS.textSecondary }}>{t('position8Salary2')}</Text>
                  <Text style={{ color: COLORS.textSecondary, fontSize: FONT_SIZES.bodySmall }}>{t('position8Payment')}</Text>
                </div>
              </div>
            </Card>
          </Col>
          )}
        </Row>
        )}
      </div>
      
      {/* 底部占位符，防止内容被导航栏挡住 */}
      <div style={{ height: '80px', width: '100%' }}></div>
    </div>
  );
};

export default CommunityPage;