import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button, Avatar, Input, Row, Col, Typography, Badge, Space, Spin, Alert, message, Menu, Dropdown } from 'antd';
import {
  MessageOutlined,
  HeartOutlined,
  ShareAltOutlined,
  UserOutlined,
  MoreOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  LoadingOutlined,
  CameraOutlined,
  AudioOutlined,
  DesktopOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Room, ConnectionState } from 'livekit-client';

// 色彩主题定义 - 抖音/快手风格（简洁版）
const COLORS = {
  primary: '#ff4d4f',
  success: '#52c41a',
  background: '#000000',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.8)',
  textTertiary: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(255, 255, 255, 0.1)',
  gradientBg: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)',
};

interface LiveRoomProps {
  roomId: string;
  identity: string;
  token: string;
  isPublisher: boolean;
  metadata?: Record<string, any>;
}

const LiveRoom: React.FC<LiveRoomProps> = ({
  roomId,
  identity,
  token,
  isPublisher,
  metadata
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // 核心状态管理
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<{ id: string; user: string; text: string; avatar: string }[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [connected, setConnected] = useState(false);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false); // 禁言状态
  const [showFunctionButtons, setShowFunctionButtons] = useState(false); // 控制功能按钮显示/隐藏
  
  // LiveKit Room实例
  const roomRef = useRef<Room | null>(null);
  
  // 处理消息发送
  const handleSendMessage = useCallback(() => {
    if (isMuted) {
      message.error('您已被禁言，无法发送消息');
      return;
    }
    
    if (messageText.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        user: identity.substring(0, 6) + '...',
        text: messageText.trim(),
        avatar: `https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png?${Math.random()}`
      };
      setMessages(prev => [...prev, newMessage]);
      setMessageText('');
    }
  }, [messageText, identity, isMuted]);

  // 处理全屏切换
  const handleFullscreenToggle = useCallback(() => {
    setIsFullscreen(prev => !prev);
    const element = document.documentElement;
    if (!isFullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  // 断开与LiveKit服务器的连接
  const disconnectFromLiveKit = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
      setConnected(false);
      setConnectionState(ConnectionState.Disconnected);
      console.log('✅ 已断开与LiveKit服务器的连接');
    }
  }, []);
  
  // 发布音视频流
  const publishStream = useCallback(async () => {
    if (!roomRef.current || !isPublisher) return;
    
    try {
      // 发布摄像头和麦克风
      await roomRef.current.localParticipant.setCameraEnabled(isCameraEnabled);
      await roomRef.current.localParticipant.setMicrophoneEnabled(isMicrophoneEnabled);
      
      setIsPublishing(true);
      console.log('✅ 已开始直播');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发布直播流失败';
      console.error('❌ 发布直播流失败:', error);

    }
  }, [isPublisher, isCameraEnabled, isMicrophoneEnabled]);
  
  // 停止发布音视频流
  const stopPublishStream = useCallback(async () => {
    if (!roomRef.current || !isPublisher) return;
    
    try {
      // 停止发布摄像头和麦克风
      await roomRef.current.localParticipant.setCameraEnabled(false);
      await roomRef.current.localParticipant.setMicrophoneEnabled(false);
      
      setIsPublishing(false);
      console.log('✅ 已停止直播');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '停止直播流失败';
      console.error('❌ 停止直播流失败:', error);

    }
  }, [isPublisher]);
  
  // 切换麦克风开关
  const toggleMicrophone = useCallback(async () => {
    if (!roomRef.current) return;
    
    try {
      const newState = !isMicrophoneEnabled;
      await roomRef.current.localParticipant.setMicrophoneEnabled(newState);
      setIsMicrophoneEnabled(newState);
      setIsAudioEnabled(newState); // 保持状态同步

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '切换麦克风状态失败';
      console.error('❌ 切换麦克风状态失败:', error);

    }
  }, [isMicrophoneEnabled]);
  
  // 切换摄像头开关
  const toggleCamera = useCallback(async () => {
    if (!roomRef.current) return;
    
    try {
      const newState = !isCameraEnabled;
      await roomRef.current.localParticipant.setCameraEnabled(newState);
      setIsCameraEnabled(newState);
      setIsVideoEnabled(newState); // 保持状态同步

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '切换摄像头状态失败';
      console.error('❌ 切换摄像头状态失败:', error);

    }
  }, [isCameraEnabled]);
  
  // 切换屏幕分享
  const toggleScreenShare = useCallback(async () => {
    if (!roomRef.current || !isPublisher) return;
    
    try {
      const newState = !isSharingScreen;
      
      if (newState) {
        // 开始屏幕分享
        await roomRef.current.localParticipant.setScreenShareEnabled(true);
        setIsSharingScreen(true);

      } else {
        // 停止屏幕分享
        await roomRef.current.localParticipant.setScreenShareEnabled(false);
        setIsSharingScreen(false);

      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '切换屏幕分享状态失败';
      console.error('❌ 切换屏幕分享状态失败:', error);

    }
  }, [isSharingScreen, isPublisher]);
  
  // 处理开播/停止直播
  const handleTogglePublishing = useCallback(async () => {
    if (isPublishing) {
      await stopPublishStream();
    } else {
      await publishStream();
    }
  }, [isPublishing, publishStream, stopPublishStream]);
  
  // 处理音频开关
  const handleToggleAudio = useCallback(() => {
    toggleMicrophone();
  }, [toggleMicrophone]);
  
  // 处理视频开关
  const handleToggleVideo = useCallback(() => {
    toggleCamera();
  }, [toggleCamera]);
  
  // 处理屏幕分享
  const handleScreenShare = useCallback(() => {
    toggleScreenShare();
  }, [toggleScreenShare]);
  
  // 处理分享
  const handleShare = useCallback(() => {
    // 实现分享逻辑
    console.log('分享直播间');
  }, []);
  
  // 处理退出直播间
  const handleExitLiveRoom = useCallback(async () => {
    try {
      // 如果正在直播，先停止直播
      if (isPublishing) {
        await stopPublishStream();
      }
      
      // 断开与LiveKit服务器的连接
      await disconnectFromLiveKit();
      

      console.log('✅ 已退出直播间');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '退出直播间失败';
      console.error('❌ 退出直播间失败:', error);

    }
  }, [isPublishing, stopPublishStream, disconnectFromLiveKit]);

  // 连接到LiveKit服务器
  const connectToLiveKit = useCallback(async () => {
    if (!roomId || !token) {
      setConnectionError('房间ID或token无效');
      return;
    }

    try {
      setIsLoading(true);
      setConnectionError(null);
      
      // 创建Room实例
      const room = new Room({
        videoCaptureDefaults: {
          resolution: {
            width: 1280,
            height: 720
          },
          frameRate: 30
        }
      });
      
      roomRef.current = room;
      
      // 设置连接状态监听
      room.on('connectionStateChanged', (state) => {
        setConnectionState(state);
        setConnected(state === ConnectionState.Connected);
        
        switch (state) {
          case ConnectionState.Connected:
            console.log('✅ 已连接到LiveKit服务器');
            setIsLoading(false);
            setConnectionError(null);
            break;
          case ConnectionState.Connecting:
            console.log('🔄 正在连接到LiveKit服务器...');
            break;
          case ConnectionState.Disconnected:
            console.log('❌ 已断开与LiveKit服务器的连接');
            setIsLoading(false);
            break;
          case ConnectionState.Reconnecting:
            console.log('🔄 正在重新连接到LiveKit服务器...');
            break;
        }
      });
      
      // 连接到LiveKit服务器
      await room.connect('wss://sancia-23mx280n.livekit.cloud', token);
      
      // 不自动发布音视频流，需要手动点击开播按钮
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '连接直播服务器失败';
      setConnectionError(errorMessage);
      setIsLoading(false);
      console.error('❌ 连接LiveKit服务器失败:', error);

    }
  }, [roomId, token]);
  
  // 组件挂载时连接到LiveKit服务器
  useEffect(() => {
    connectToLiveKit();
    
    // 组件卸载时断开连接
    return () => {
      disconnectFromLiveKit();
    };
  }, [connectToLiveKit, disconnectFromLiveKit]);
  
  // 渲染视频播放区域
  return (
    <div
      className="live-room-container"
      style={{
        position: 'relative',
        width: '100%',
        height: isFullscreen ? '100vh' : '600px',
        backgroundColor: '#111',
        borderRadius: isFullscreen ? '0' : '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 视频播放区域 */}
      <div
        className="video-container"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#111',
        }}
      >

        
        {/* 连接状态提示 */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '20px', zIndex: 200 }}>
            <Spin size="large" tip="正在连接直播服务器...">
              <div>
                <Typography.Title level={4} style={{ color: '#fff', marginBottom: 16 }}>
                  {isPublishing ? '正在直播...' : '准备直播'}
                </Typography.Title>
              </div>
            </Spin>
          </div>
        )}
        
        {/* 连接错误提示 */}
        {connectionError && (
          <div style={{ textAlign: 'center', padding: '20px', zIndex: 200 }}>
            <Alert
              message="连接错误"
              description={connectionError}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Button type="primary" onClick={connectToLiveKit}>
              重新连接
            </Button>
          </div>
        )}
        
        {/* 未连接状态提示 */}
        {!isLoading && !connected && !connectionError && (
          <div style={{ textAlign: 'center', padding: '20px', zIndex: 200 }}>
            <Typography.Title level={4} style={{ color: '#fff', marginBottom: 16 }}>
              未连接到直播服务器
            </Typography.Title>
            <Button type="primary" onClick={connectToLiveKit}>
              连接直播
            </Button>
          </div>
        )}
        
        {/* 已连接但未开播状态提示 */}
        {!isLoading && connected && !isPublishing && !connectionError && (
          <div style={{ textAlign: 'center', padding: '20px', zIndex: 200 }}>
            <Typography.Title level={4} style={{ color: '#fff', marginBottom: 16 }}>
              暂时没有开播
            </Typography.Title>
            <Typography.Text style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: 16, display: 'block' }}>
              请稍候，主播正在准备中...
            </Typography.Text>
          </div>
        )}
        
        {/* 渐变遮罩 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* 顶部信息栏 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          {/* 开播/关播按钮 - 只显示图标，缩小尺寸 */}
          {isPublisher && (
            <Button
              type={isPublishing ? 'default' : 'primary'}
              icon={isPublishing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={handleTogglePublishing}
              style={{
                width: 40,
                height: 40,
                borderRadius: '20px',
                fontSize: '20px',
                backgroundColor: isPublishing ? '#ff4d4f' : '#52c41a',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
            />
          )}

          {/* 功能按钮区域 - 更多按钮保持原位，三个功能按钮展开 */}
          {isPublisher && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* 展开的功能按钮 - 在更多按钮左侧展开 */}
              {showFunctionButtons && (
                <>
                  {/* 屏幕分享按钮 - 电脑屏幕图标，颜色统一 */}
                  <Button
                    type="text"
                    icon={<DesktopOutlined />}
                    onClick={handleScreenShare}
                    style={{
                      color: '#fff',
                      backgroundColor: 'rgba(82, 196, 26, 0.9)',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      fontSize: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.3s ease',
                    }}
                  />

                  {/* 麦克风按钮 */}
                  <Button
                    type="text"
                    icon={<AudioOutlined />}
                    onClick={handleToggleAudio}
                    style={{
                      color: '#fff',
                      backgroundColor: isMicrophoneEnabled ? 'rgba(82, 196, 26, 0.9)' : 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      fontSize: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.3s ease',
                    }}
                  />

                  {/* 摄像头按钮 */}
                  <Button
                    type="text"
                    icon={<CameraOutlined />}
                    onClick={handleToggleVideo}
                    style={{
                      color: '#fff',
                      backgroundColor: isCameraEnabled ? 'rgba(82, 196, 26, 0.9)' : 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      width: 40,
                      height: 40,
                      fontSize: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                      transition: 'all 0.3s ease',
                    }}
                  />
                </>
              )}

              {/* 展开/收起功能按钮 - 保持原位 */}
              <Button
                type="text"
                icon={<MoreOutlined />}
                onClick={() => setShowFunctionButtons(!showFunctionButtons)}
                style={{
                  color: '#fff',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  fontSize: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  zIndex: 1,
                }}
              />
            </div>
          )}
        </div>

        {/* 底部控制栏 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px',
            zIndex: 10,
          }}
        >
          {/* 核心控制栏 - 聊天输入框和功能按钮在同一排 */}
          <Row gutter={[8, 8]}>
            <Col span={24}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '8px' }}>
                  <Input
                    placeholder="说点什么..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onPressEnter={handleSendMessage}
                    prefix={<MessageOutlined />}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      borderRadius: '16px',
                      color: COLORS.textPrimary,
                      fontSize: '14px',
                      flex: 1,
                      height: '40px',
                    }}
                  />
                  <Button
                    type="primary"
                    onClick={handleSendMessage}
                    style={{
                      borderRadius: '16px',
                      backgroundColor: COLORS.primary,
                      border: 'none',
                      height: '40px',
                      padding: '0 24px',
                      fontSize: '14px',
                    }}
                  >
                    发送
                  </Button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* 分享按钮 */}
                  <Button
                    type="text"
                    icon={<ShareAltOutlined />}
                    onClick={handleShare}
                    style={{
                      color: COLORS.textPrimary,
                      fontSize: '18px',
                    }}
                  />
                  
                  {/* 全屏按钮 */}
                  <Button
                    type="text"
                    icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                    onClick={handleFullscreenToggle}
                    style={{
                      color: COLORS.textPrimary,
                      fontSize: '18px',
                    }}
                  />
                  
                  {/* 退出直播间按钮 */}
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={handleExitLiveRoom}
                    style={{
                      color: COLORS.primary,
                      fontSize: '18px',
                    }}
                  />
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>
      

    </div>
  );
};

export default LiveRoom;