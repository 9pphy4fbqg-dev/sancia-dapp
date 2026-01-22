import React, { useEffect, useRef, useState } from 'react';
import '@livekit/components-styles';
import { Room, ConnectionState, RoomEvent, Track, RoomConnectOptions } from 'livekit-client';
import { LIVEKIT_URL } from '../../lib/livekit-config';
import { PlayCircleOutlined, PauseCircleOutlined, CameraOutlined, SoundOutlined, DesktopOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

interface LiveRoomProps {
  token: string;
  roomId: string;
  identity: string;
  isPublisher: boolean;
  metadata?: Record<string, any>;
}

const LiveRoom: React.FC<LiveRoomProps> = ({ token, roomId, identity, isPublisher, metadata }) => {
  const roomRef = useRef<Room | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const chatContentRef = useRef<HTMLDivElement>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showLocalPreview, setShowLocalPreview] = useState(isPublisher);
  const [currentCameraFacing, setCurrentCameraFacing] = useState<'user' | 'environment'>('user'); // 当前摄像头朝向
  // 聊天组件直接开启，不需要隐藏功能，移除相关状态
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; from: string; content: string; timestamp: number }>>([]);
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    console.log('=== LiveRoom组件useEffect被调用 ===');
    console.log('当前组件props:');
    console.log('  token:', token ? `存在 (长度: ${token.length})` : '不存在');
    // 显示token的前20个字符和后20个字符，用于调试
    console.log('  token预览:', token ? `${token.substring(0, 20)}...${token.substring(token.length - 20)}` : '不存在');
    console.log('  roomId:', roomId);
    console.log('  identity:', identity);
    console.log('  isPublisher:', isPublisher);
    console.log('  metadata:', metadata);
    
    // 检查环境变量
    console.log('环境变量检查:');
    console.log('  VITE_LIVEKIT_URL:', import.meta.env.VITE_LIVEKIT_URL);
    console.log('  LIVEKIT_URL:', LIVEKIT_URL);
    console.log('  VITE_LIVEKIT_API_KEY:', import.meta.env.VITE_LIVEKIT_API_KEY ? '存在' : '不存在');
    console.log('  VITE_LIVEKIT_API_SECRET:', import.meta.env.VITE_LIVEKIT_API_SECRET ? '存在' : '不存在');
    
    // 验证必要的配置
    if (!LIVEKIT_URL) {
      const errorMsg = 'LIVEKIT_URL环境变量未配置';
      setError(errorMsg);
      console.error(errorMsg);
      return;
    }
    
    // 如果token不存在或为空，不要立即报错，而是等待token生成
    if (!token || token.trim() === '') {
      console.log('token不存在或为空，等待token生成...');
      // 不要设置error，因为token可能稍后会生成
      setError(null);
      return;
    }
    
    // 检查token是否有效（简单检查是否为JWT格式）
    const isJWT = token.split('.').length === 3;
    console.log('  token是否为JWT格式:', isJWT);
    if (!isJWT) {
      console.error('  警告：token不是有效的JWT格式！');
      // 不要设置error，因为token可能稍后会生成有效的JWT
      return;
    }
    
    console.log('token有效，开始创建LiveKit房间...');
    
    // 断开现有连接（如果有）
    if (roomRef.current) {
      console.log('断开现有LiveKit连接...');
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    
    // 创建并连接到LiveKit房间
    const room = new Room();
    roomRef.current = room;

    // 处理连接状态变化
    room.on(RoomEvent.ConnectionStateChanged, (state) => {
      console.log('=== LiveKit连接状态变化 ===');
      console.log('旧状态:', connectionState);
      console.log('新状态:', state);
      setConnectionState(state);
      
      // 记录连接状态变化的详细信息
      if (state === ConnectionState.Connecting) {
        console.log('LiveKit正在连接...');
      } else if (state === ConnectionState.Connected) {
        console.log('LiveKit连接成功!');
      } else if (state === ConnectionState.Disconnected) {
        console.log('LiveKit连接断开！');
        console.log('当前roomRef.current:', !!roomRef.current);
        // 尝试重新连接
        setTimeout(() => {
          if (roomRef.current) {
            console.log('重新连接到LiveKit服务器...');
            console.log('重新连接使用的token:', token ? '存在' : '不存在');
            console.log('重新连接使用的LIVEKIT_URL:', LIVEKIT_URL);
            roomRef.current.connect(LIVEKIT_URL, token);
          }
        }, 3000);
      } else if (state === ConnectionState.Reconnecting) {
        console.log('LiveKit正在重新连接...');
      }
    });

    // 处理连接成功
    room.on(RoomEvent.Connected, () => {
      console.log('=== 收到RoomEvent.Connected事件 ===');
      console.log('LiveKit连接成功!');
      setError(null);
    });

    // 处理远程视频轨道
    room.on(RoomEvent.TrackSubscribed, (track: Track, publication, participant) => {
      console.log('已订阅远程轨道:', track.kind, 'from', participant.identity);
      if (track.kind === 'video' && videoRef.current) {
        videoRef.current.srcObject = new MediaStream([track.mediaStreamTrack]);
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        console.log('远程视频轨道已绑定到视频元素');
      }
      // 处理屏幕分享轨道
      if (track.kind === 'video' && publication.source === 'screen_share' && videoRef.current) {
        videoRef.current.srcObject = new MediaStream([track.mediaStreamTrack]);
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        console.log('远程屏幕分享轨道已绑定到视频元素');
      }
    });

    // 处理本地轨道发布 - 合并视频和音频轨道处理
    room.on(RoomEvent.LocalTrackPublished, (publication) => {
      console.log('本地轨道已发布:', publication.trackName, '源:', publication.source);
      
      if (!publication.track) {
        console.log('警告：publication.track为空');
        return;
      }
      
      if (publication.track.kind === 'video' || publication.track.kind === 'audio') {
        console.log('处理本地', publication.track.kind, '轨道:', publication.trackName, '源:', publication.source);
        
        // 更新屏幕分享状态
        if (publication.source === 'screen_share') {
          setIsScreenSharing(true);
          console.log('更新屏幕分享状态为: true');
        }
        
        // 获取当前视频流或创建新流
        let currentStream: MediaStream | null = null;
        if (videoRef.current?.srcObject instanceof MediaStream) {
          currentStream = videoRef.current.srcObject as MediaStream;
        }
        
        // 处理视频轨道
        if (publication.track.kind === 'video') {
          const videoStream = new MediaStream([publication.track.mediaStreamTrack]);
          
          // 如果有音频轨道，添加到视频流中
          if (currentStream) {
            const audioTracks = currentStream.getAudioTracks();
            audioTracks.forEach(track => videoStream.addTrack(track));
          }
          
          // 设置主视频元素
          if (videoRef.current) {
            videoRef.current.srcObject = videoStream;
            videoRef.current.autoplay = true;
            videoRef.current.playsInline = true;
            videoRef.current.muted = !isPublisher;
            console.log('本地视频轨道已绑定到主视频元素');
          }
          
          // 设置本地预览元素（仅摄像头）
          if (localVideoRef.current && publication.source !== 'screen_share') {
            localVideoRef.current.srcObject = new MediaStream([publication.track.mediaStreamTrack]);
            localVideoRef.current.autoplay = true;
            localVideoRef.current.playsInline = true;
            localVideoRef.current.muted = true;
            console.log('本地视频轨道已绑定到本地预览元素');
          }
        }
        
        // 处理音频轨道
        if (publication.track.kind === 'audio') {
          if (currentStream) {
            // 移除现有音频轨道
            const existingAudioTracks = currentStream.getAudioTracks();
            existingAudioTracks.forEach(track => currentStream?.removeTrack(track));
            
            // 添加新音频轨道
            currentStream.addTrack(publication.track.mediaStreamTrack);
            console.log('本地音频轨道已更新到视频流');
          } else if (videoRef.current) {
            // 如果没有视频流，创建仅音频流
            videoRef.current.srcObject = new MediaStream([publication.track.mediaStreamTrack]);
            videoRef.current.autoplay = true;
            videoRef.current.playsInline = true;
            console.log('本地音频轨道已绑定到视频元素');
          }
        }
      }
      
      setIsPublishing(true);
    });

    // 处理接收到的聊天消息
    room.on(RoomEvent.DataReceived, (payload, participant, kind) => {
      console.log('收到数据消息:', payload, '来自:', participant?.identity, '类型:', kind);
      try {
        const message = JSON.parse(new TextDecoder().decode(payload));
        if (message.content && message.from && message.timestamp) {
          // 确保消息不是自己发送的（避免重复）
          if (message.from !== identity) {
            setChatMessages(prev => [...prev, message]);
          }
        }
      } catch (err) {
        console.error('解析聊天消息失败:', err);
      }
    });

    // 连接到LiveKit服务器
    const connectToLiveKit = async () => {
      console.log('connectToLiveKit函数被调用！');
      try {
        console.log('尝试连接到LiveKit服务器:', LIVEKIT_URL);
        console.log('使用的token:', token ? '存在' : '不存在', 'token长度:', token?.length);
        console.log('房间ID:', roomId);
        console.log('身份:', identity);
        
        // 确保token存在
        if (!token) {
          const errorMsg = 'LiveKit令牌不存在';
          setError(errorMsg);
          console.error(errorMsg);
          return;
        }
        
        // 连接配置选项
        const connectOptions: RoomConnectOptions = {
          autoSubscribe: true,
        };
        
        // 连接到LiveKit服务器
        console.log('开始调用room.connect()...');
        await room.connect(LIVEKIT_URL, token, connectOptions);
        console.log('LiveKit连接成功!');
      } catch (err) {
        console.error('LiveKit连接失败:', err);
        console.error('错误详情:', (err as Error).stack);
        setError('连接LiveKit服务器失败: ' + (err as Error).message);
      }
    };

    // 调用连接函数
    connectToLiveKit();

    // 清理函数
    return () => {
      console.log('LiveRoom组件useEffect清理函数被调用，断开LiveKit连接...');
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, [token, roomId]);

  // 开播/停止直播
  const togglePublishing = async () => {
    console.log('togglePublishing函数被调用了！');
    console.log('roomRef.current是否存在:', !!roomRef.current);
    console.log('当前连接状态:', connectionState);
    console.log('isPublisher:', isPublisher);
    
    if (!roomRef.current) {
      console.error('无法开播：roomRef.current为null');
      setError('房间未初始化，请重试');
      return;
    }

    // 检查连接状态
    if (connectionState !== ConnectionState.Connected) {
      console.error('无法开播：连接状态为:', connectionState);
      setError('未连接到服务器，请检查网络连接');
      return;
    }

    try {
      console.log('=== 开始执行togglePublishing ===');
      console.log('当前isPublishing状态:', isPublishing);
      console.log('当前isCameraEnabled状态:', isCameraEnabled);
      console.log('当前isMicrophoneEnabled状态:', isMicrophoneEnabled);
      console.log('当前isScreenSharing状态:', isScreenSharing);
      console.log('当前连接状态:', connectionState);

      if (isPublishing) {
        // 停止发布
        console.log('停止发布流...');
        await roomRef.current.localParticipant.setCameraEnabled(false);
        await roomRef.current.localParticipant.setMicrophoneEnabled(false);
        await roomRef.current.localParticipant.setScreenShareEnabled(false);
        setIsPublishing(false);
        console.log('已停止发布流');
      } else {
        // 开始发布 - 让LiveKit内部处理媒体流和权限
        console.log('开始发布流...');
        let hasPublished = false;
        
        // 如果没有启用任何设备，默认启用摄像头
        const shouldEnableCamera = !isCameraEnabled && !isMicrophoneEnabled && !isScreenSharing;
        if (shouldEnableCamera) {
          console.log('没有启用任何设备，默认启用摄像头...');
          setIsCameraEnabled(true);
        }
        
        // 使用LiveKit内置的setCameraEnabled，自动处理权限和媒体流
        if (isCameraEnabled || shouldEnableCamera) {
          console.log('开启摄像头... (使用LiveKit内置处理)');
          await roomRef.current.localParticipant.setCameraEnabled(true);
          console.log('摄像头开启成功');
          hasPublished = true;
        }
        
        if (isMicrophoneEnabled) {
          console.log('开启麦克风... (使用LiveKit内置处理)');
          await roomRef.current.localParticipant.setMicrophoneEnabled(true);
          console.log('麦克风开启成功');
          hasPublished = true;
        }
        
        if (isScreenSharing) {
          console.log('开启屏幕分享... (使用LiveKit内置处理)');
          await roomRef.current.localParticipant.setScreenShareEnabled(true);
          console.log('屏幕分享开启成功');
          hasPublished = true;
        }
        
        if (hasPublished) {
          setIsPublishing(true);
          console.log('直播已开始！');
        } else {
          console.error('无法开播：没有成功开启任何设备');
          setError('无法开启设备，请检查权限设置');
        }
      }
    } catch (err) {
      console.error('开播/停止直播失败:', err);
      console.error('错误详情:', (err as Error).stack);
      setError('操作失败: ' + (err as Error).message);
    }
  };

  // 切换摄像头
  const toggleCamera = async () => {
    console.log('toggleCamera函数被调用了！');
    console.log('isPublisher:', isPublisher);
    console.log('roomRef.current是否存在:', !!roomRef.current);
    
    if (!roomRef.current || !isPublisher) {
      console.log('toggleCamera函数返回，条件不满足');
      return;
    }

    try {
      const newState = !isCameraEnabled;
      console.log('切换摄像头状态，新状态:', newState);
      
      // 只更新本地状态，不自动开播
      setIsCameraEnabled(newState);
      
      // 只有在已经开播的情况下，才实际控制摄像头
      if (isPublishing) {
        console.log('更新摄像头状态到:', newState);
        await roomRef.current.localParticipant.setCameraEnabled(newState);
      }
    } catch (err) {
      console.error('切换摄像头失败:', err);
      setError('操作失败: ' + (err as Error).message);
    }
  };

  // 切换前后摄像头
  const toggleCameraFacing = async () => {
    console.log('toggleCameraFacing函数被调用了！');
    console.log('isPublisher:', isPublisher);
    
    if (!isPublisher) {
      console.log('toggleCameraFacing函数返回，isPublisher为false');
      return;
    }

    try {
      const newFacing = currentCameraFacing === 'user' ? 'environment' : 'user';
      console.log('切换前后摄像头，新方向:', newFacing);
      
      setCurrentCameraFacing(newFacing);
      
      // 如果摄像头已经开启，重新获取媒体流
      if (isCameraEnabled && isPublishing && roomRef.current) {
        console.log('重新获取媒体流，先关闭摄像头...');
        await roomRef.current.localParticipant.setCameraEnabled(false);
        console.log('重新开启摄像头...');
        await roomRef.current.localParticipant.setCameraEnabled(true);
      }
    } catch (err) {
      console.error('切换前后摄像头失败:', err);
      setError('切换前后摄像头失败: ' + (err as Error).message);
    }
  };

  // 切换麦克风
  const toggleMicrophone = async () => {
    console.log('toggleMicrophone函数被调用了！');
    console.log('isPublisher:', isPublisher);
    console.log('roomRef.current是否存在:', !!roomRef.current);
    
    if (!roomRef.current || !isPublisher) {
      console.log('toggleMicrophone函数返回，条件不满足');
      return;
    }

    try {
      const newState = !isMicrophoneEnabled;
      console.log('切换麦克风状态，新状态:', newState);
      
      // 只更新本地状态，不自动开播
      setIsMicrophoneEnabled(newState);
      
      // 只有在已经开播的情况下，才实际控制麦克风
      if (isPublishing) {
        console.log('更新麦克风状态到:', newState);
        await roomRef.current.localParticipant.setMicrophoneEnabled(newState);
      }
    } catch (err) {
      console.error('切换麦克风失败:', err);
      setError('操作失败: ' + (err as Error).message);
    }
  };

  // 切换屏幕分享
  const toggleScreenSharing = async () => {
    console.log('toggleScreenSharing函数被调用了！');
    console.log('isPublisher:', isPublisher);
    console.log('roomRef.current是否存在:', !!roomRef.current);
    console.log('当前isPublishing状态:', isPublishing);
    console.log('当前isScreenSharing状态:', isScreenSharing);
    
    if (!roomRef.current || !isPublisher) {
      console.log('toggleScreenSharing函数返回，条件不满足');
      return;
    }

    const newState = !isScreenSharing;
    try {
      console.log('切换屏幕分享状态，新状态:', newState);
      
      // 更新本地状态
      setIsScreenSharing(newState);
      
      // 无论是否已经开播，都尝试调用setScreenShareEnabled
      console.log('更新屏幕分享状态到:', newState);
      await roomRef.current.localParticipant.setScreenShareEnabled(newState);
      console.log('屏幕分享', newState ? '开启' : '关闭', '成功');
      
      // 如果还没有开播，并且开启了屏幕分享，自动开播
      if (newState && !isPublishing) {
        console.log('屏幕分享已开启，自动开播...');
        setIsPublishing(true);
      }
    } catch (err) {
      console.error('切换屏幕分享失败:', err);
      console.error('错误详情:', (err as Error).stack);
      setError('操作失败: ' + (err as Error).message);
      // 恢复状态
      setIsScreenSharing(!newState);
    }
  };

  // 显示/隐藏本地预览
  const toggleLocalPreview = () => {
    console.log('toggleLocalPreview函数被调用了！');
    const newState = !showLocalPreview;
    console.log('切换本地预览状态，新状态:', newState);
    setShowLocalPreview(newState);
  };

  // 发送聊天消息
  const sendMessage = () => {
    if (inputMessage.trim() === '') return;
    
    // 添加本地消息
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      from: identity,
      content: inputMessage.trim(),
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    
    // 这里可以添加发送到服务器的逻辑
    console.log('发送消息:', newMessage);
    
    // TODO: 集成LiveKit数据通道发送消息
    if (roomRef.current) {
      // 使用LiveKit数据通道发送消息
      roomRef.current.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(newMessage)),
        {
          topic: 'chat',
          reliable: true
        }
      );
    }
  };

  // 处理输入框变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  // 处理回车键发送消息
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // 当聊天消息更新时，自动滚动到底部
  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // 动态注入样式，覆盖全局移动端样式
  useEffect(() => {
    // 创建style元素
    const style = document.createElement('style');
    style.id = 'livekit-chat-styles';
    
    // 添加样式内容
    style.textContent = `
      /* 覆盖全局移动端样式，确保聊天输入框和按钮高度为20px */
      .livekit-room-container input[type="text"],
      .livekit-room-container button {
        height: 20px !important;
        min-height: 20px !important;
        max-height: 20px !important;
        font-size: 10px !important;
        padding: 0 6px !important;
      }
      
      /* 确保按钮宽度正确 */
      .livekit-room-container button {
        width: 20px !important;
        min-width: 20px !important;
        max-width: 20px !important;
        padding: 0 !important;
      }
    `;
    
    // 将样式添加到文档头部
    document.head.appendChild(style);
    
    // 组件卸载时移除样式
    return () => {
      const existingStyle = document.getElementById('livekit-chat-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return (
    <div className="livekit-room-container">
      {/* 直播主画面区域 */}
      <div style={{ 
        position: 'relative', 
        border: '1px solid #666', 
        borderRadius: '4px',
        paddingBottom: '56.25%', /* 16:9 宽高比 */
        backgroundColor: '#000'
      }}>
        {/* 主视频元素 */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!isPublisher}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#000',
            display: 'block'
          }}
        />
        
        {/* 本地预览视频 - 仅主播可见 */}
        {showLocalPreview && isPublisher && (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '120px',
              height: 'auto',
              borderRadius: '4px',
              border: '2px solid #52c41a',
              backgroundColor: '#000',
              zIndex: 20
            }}
          />
        )}
        
        {/* 覆盖层，确保用户能看到组件 */}
        {connectionState === ConnectionState.Disconnected && !error && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            fontSize: '16px',
            zIndex: 5
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '8px' }}>直播组件已加载</div>
              <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '4px' }}>房间ID: {roomId}</div>
              <div style={{ fontSize: '14px', color: '#aaa' }}>LiveKit URL: {LIVEKIT_URL}</div>
            </div>
          </div>
        )}
        
        {/* 错误信息 */}
        {error && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: '#ff4d4f',
            padding: '12px 20px',
            borderRadius: '4px',
            fontSize: '14px',
            textAlign: 'center',
            zIndex: 20,
            maxWidth: '80%'
          }}>
            {error}
          </div>
        )}
        
        {/* 直播标题和状态 - 左上角横向边框容器 */}
        <div style={{
          position: 'absolute',
          top: '2px',
          left: '2px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid #fff',
          borderRadius: '4px',
          padding: '2px 8px',
          height: '14px',
          color: '#fff',
          fontSize: '12px',
          zIndex: 10
        }}>
          <span>{roomId === 'official' ? '官方直播间' : `直播间: ${roomId}`}</span>
          <span style={{
            marginLeft: '6px',
            padding: '0 6px',
            borderRadius: '2px',
            backgroundColor: isPublishing ? '#52c41a' : '#ff4d4f',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 'bold',
            height: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isPublishing ? '直播中' : '未直播'}
          </span>
        </div>
      </div>
      
      {/* 底部控制区域 - 包含聊天和主播控制 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2px' }}>
        {/* 聊天面板 - 放在左侧，与主播控制按钮底部齐平 */}
        <div style={{ flex: 1, marginRight: '10px', display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', height: '160px' }}>
          {/* 聊天内容 - 固定高度，滚动显示，最新消息在底部 */}
          <div 
            ref={chatContentRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: '2px',
              padding: '1px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '0',
              border: 'none'
            }}
          >
            {/* 聊天消息列表 */}
            {chatMessages.length === 0 ? (
              <div style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', padding: '20px 0', fontSize: '14px' }}>
                暂无消息
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    marginBottom: '1px',
                    alignItems: 'center',
                    gap: '8px',
                    lineHeight: '14px'
                  }}
                >
                  {/* 头像占位符 - 统一显示在左侧 */}
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(50, 50, 50, 0.8)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    {msg.from.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* 消息内容 - 地址和内容在同一行 */}
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    color: '#fff',
                    fontSize: '14px',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    minWidth: 0
                  }}>
                    {/* 显示用户钱包地址后2位 */}
                    <span style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontWeight: '500',
                      fontSize: '12px'
                    }}>
                      {msg.from.slice(-2)}
                    </span>
                    
                    {/* 消息文本 - 移除背景色，与地址在同一行 */}
                    <span style={{
                      backgroundColor: 'transparent',
                      padding: '0',
                      borderRadius: '0',
                      border: 'none',
                      color: '#fff',
                      fontSize: '14px',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis'
                    }}>{msg.content}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* 消息输入框 */}
          <div style={{
            display: 'flex',
            gap: '2px',
            alignItems: 'center',
            padding: '0px',
            marginTop: '1px'
          }}>
            <input
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="输入消息..."
                inputMode="text"
                autoCapitalize="sentences"
                autoCorrect="on"
                style={{
                  flex: 1,
                  height: '20px',
                  padding: '0 6px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '10px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  lineHeight: '20px'
                }}
              />
            <button
              onClick={sendMessage}
              disabled={inputMessage.trim() === ''}
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: inputMessage.trim() === '' ? 'rgba(255, 255, 255, 0.2)' : '#1890ff',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                cursor: inputMessage.trim() === '' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                padding: '0',
                outline: 'none',
                boxShadow: 'none',
                boxSizing: 'border-box'
              }}
            >
              →
            </button>
          </div>
        </div>
        
        {/* 主播控制面板 - 放在右侧，距离右侧边框2px */}
        {isPublisher && (
          <div style={{
            marginRight: '2px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 10
          }}>
              {/* 摄像头开关 */}
              <button
                onClick={toggleCamera}
                style={{
                  // 彻底重置按钮样式
                  all: 'unset',
                  // 重新定义必要样式
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '12px',
                  height: '12px',
                  minWidth: '12px',
                  minHeight: '12px',
                  padding: '0',
                  fontSize: '12px',
                  backgroundColor: isCameraEnabled ? '#52c41a' : 'rgba(0, 0, 0, 0.7)',
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  // 添加边框，总大小14px (12px + 1px*2)
                  border: '1px solid ' + (isCameraEnabled ? '#52c41a' : '#666'),
                  outline: 'none',
                  boxShadow: 'none',
                  // 确保盒模型正确
                  boxSizing: 'border-box'
                }}
              >
                <CameraOutlined style={{ fontSize: '16px' }} />
              </button>

              {/* 切换前后摄像头按钮 */}
              <button
                onClick={toggleCameraFacing}
                style={{
                  // 彻底重置按钮样式
                  all: 'unset',
                  // 重新定义必要样式
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '12px',
                  height: '12px',
                  minWidth: '12px',
                  minHeight: '12px',
                  padding: '0',
                  fontSize: '12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  // 添加边框，总大小14px (12px + 1px*2)
                  border: '1px solid #666',
                  outline: 'none',
                  boxShadow: 'none',
                  // 确保盒模型正确
                  boxSizing: 'border-box'
                }}
              >
                ↻
              </button>

              {/* 麦克风开关 */}
              <button
                onClick={toggleMicrophone}
                style={{
                  // 彻底重置按钮样式
                  all: 'unset',
                  // 重新定义必要样式
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '12px',
                  height: '12px',
                  minWidth: '12px',
                  minHeight: '12px',
                  padding: '0',
                  fontSize: '12px',
                  backgroundColor: isMicrophoneEnabled ? '#52c41a' : 'rgba(0, 0, 0, 0.7)',
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  // 添加边框，总大小14px (12px + 1px*2)
                  border: '1px solid ' + (isMicrophoneEnabled ? '#52c41a' : '#666'),
                  outline: 'none',
                  boxShadow: 'none',
                  // 确保盒模型正确
                  boxSizing: 'border-box'
                }}
              >
                <SoundOutlined style={{ fontSize: '16px' }} />
              </button>

              {/* 屏幕分享开关 */}
              <button
                onClick={toggleScreenSharing}
                style={{
                  // 彻底重置按钮样式
                  all: 'unset',
                  // 重新定义必要样式
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '12px',
                  height: '12px',
                  minWidth: '12px',
                  minHeight: '12px',
                  padding: '0',
                  fontSize: '12px',
                  backgroundColor: isScreenSharing ? '#52c41a' : 'rgba(0, 0, 0, 0.7)',
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  // 添加边框，总大小14px (12px + 1px*2)
                  border: '1px solid ' + (isScreenSharing ? '#52c41a' : '#666'),
                  outline: 'none',
                  boxShadow: 'none',
                  // 确保盒模型正确
                  boxSizing: 'border-box'
                }}
              >
                <DesktopOutlined style={{ fontSize: '16px' }} />
              </button>

              {/* 本地预览开关 */}
              <button
                onClick={toggleLocalPreview}
                style={{
                  // 彻底重置按钮样式
                  all: 'unset',
                  // 重新定义必要样式
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '12px',
                  height: '12px',
                  minWidth: '12px',
                  minHeight: '12px',
                  padding: '0',
                  fontSize: '12px',
                  backgroundColor: showLocalPreview ? '#52c41a' : 'rgba(0, 0, 0, 0.7)',
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  // 添加边框，总大小14px (12px + 1px*2)
                  border: '1px solid ' + (showLocalPreview ? '#52c41a' : '#666'),
                  outline: 'none',
                  boxShadow: 'none',
                  // 确保盒模型正确
                  boxSizing: 'border-box'
                }}
              >
                {showLocalPreview ? <EyeOutlined style={{ fontSize: '16px' }} /> : <EyeInvisibleOutlined style={{ fontSize: '16px' }} />}
              </button>

              {/* 主开播/关播按钮 - 只显示图标 */}
              <button
                onClick={togglePublishing}
                style={{
                  // 彻底重置按钮样式
                  all: 'unset',
                  // 重新定义必要样式
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '12px',
                  height: '12px',
                  minWidth: '12px',
                  minHeight: '12px',
                  padding: '0',
                  fontSize: '12px',
                  backgroundColor: isPublishing ? '#ff4d4f' : '#52c41a',
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  // 添加边框，总大小14px (12px + 1px*2)
                  border: '1px solid ' + (isPublishing ? '#ff4d4f' : '#52c41a'),
                  outline: 'none',
                  boxShadow: 'none',
                  // 确保盒模型正确
                  boxSizing: 'border-box'
                }}
              >
                {isPublishing ? <PauseCircleOutlined style={{ fontSize: '16px' }} /> : <PlayCircleOutlined style={{ fontSize: '16px' }} />}
              </button>
          </div>
        )}
      </div>
      
      {/* 调试信息 - 隐藏 */}
      <div style={{ display: 'none' }}>
        <div>身份: {identity}</div>
        <div>是否主播: {isPublisher ? '是' : '否'}</div>
        <div>是否直播中: {isPublishing ? '是' : '否'}</div>
        <div>Metadata: {metadata ? JSON.stringify(metadata) : '无'}</div>
        <div>LiveKit URL: {LIVEKIT_URL}</div>
        <div>Token状态: {token ? '存在' : '不存在'}</div>
      </div>
    </div>
  );
};

export default LiveRoom;