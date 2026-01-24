import React, { useState } from 'react';
import '@livekit/components-styles';
import {
  LiveKitRoom,
  PreJoin,
  LocalUserChoices,
  VideoConference
} from '@livekit/components-react';
import { LIVEKIT_URL } from '../../lib/livekit-config';

interface CustomLiveRoomProps {
  token: string;
  roomId: string;
  identity: string;
  isPublisher: boolean;
  metadata?: Record<string, any>;
  onLiveStatusChange?: (isLive: boolean) => void;
}

const CustomLiveRoom: React.FC<CustomLiveRoomProps> = ({
  token,
  roomId,
  identity,
  isPublisher,
  metadata,
  onLiveStatusChange
}) => {
  const [connectionDetails, setConnectionDetails] = useState<{
    serverUrl: string;
    participantToken: string;
  } | null>(null);
  
  const [userChoices, setUserChoices] = useState<LocalUserChoices | null>(null);

  const handlePreJoinSubmit = async (choices: LocalUserChoices) => {
    setUserChoices(choices);
    setConnectionDetails({
      serverUrl: LIVEKIT_URL,
      participantToken: token
    });
    onLiveStatusChange?.(true);
  };

  const handleDisconnect = () => {
    setConnectionDetails(null);
    setUserChoices(null);
    onLiveStatusChange?.(false);
  };

  // 格式化钱包地址，只显示最后4位
  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `0x${address.slice(-4)}`;
  };

  const displayName = formatWalletAddress(identity);

  // 添加自定义CSS样式，调整布局
  React.useEffect(() => {
    const style = document.createElement('style');
    style.id = 'custom-livekit-layout';
    
    style.textContent = `
      /* 调整视频会议容器布局 */
      .lk-video-conference {
        display: flex !important;
        flex-direction: column !important;
        height: 100% !important;
      }
      
      /* 调整视频会议内部布局 */
      .lk-video-conference-inner {
        display: flex !important;
        flex-direction: column !important;
        flex: 1 !important;
      }
      
      /* 视频区域 - 占据主要空间 */
      .lk-focus-layout-wrapper,
      .lk-grid-layout-wrapper {
        flex: 1 !important;
        min-height: 0 !important;
      }
      
      /* 主播控制组件 - 固定在视频下方 */
      .lk-control-bar {
        order: 1 !important;
      }
      
      /* 聊天组件 - 放置在控制组件下方，与组件宽度一致 */
      .lk-chat {
        order: 2 !important;
        position: relative !important;
        width: 100% !important;
        height: 300px !important; /* 增加高度，大约显示10行 */
        background-color: #000 !important; /* 使用箭头指向的黑色背景 */
        border-top: 1px solid #333 !important;
        display: grid !important;
        grid-template-rows: 1fr auto !important;
      }
      
      /* 移除聊天标题 */
      .lk-chat-header {
        display: none !important;
      }
      
      /* 聊天消息列表 - 黑色背景，最新消息显示在底部 */
      .lk-chat-messages {
        background-color: #000 !important; /* 使用箭头指向的黑色背景 */
        display: block !important;
        overflow-y: scroll !important;
        /* 隐藏滚动条 */
        scrollbar-width: none !important; /* Firefox */
        -ms-overflow-style: none !important; /* IE/Edge */
      }
      
      /* Chrome/Safari 隐藏滚动条 */
      .lk-chat-messages::-webkit-scrollbar {
        display: none !important;
      }
      
      /* 聊天输入表单 - 黑色背景 */
      .lk-chat-form {
        background-color: #000 !important; /* 使用箭头指向的黑色背景 */
      }
      
      /* 聊天输入框 - 浅灰色背景，与黑色形成对比 */
      .lk-chat-form-input {
        background-color: #333 !important; /* 浅灰色背景，与黑色形成对比 */
        border: 1px solid #555 !important;
        color: #fff !important;
      }
      
      /* 聊天发送按钮 - 深灰色背景 */
      .lk-chat-form-button {
        background-color: #333 !important;
        color: #fff !important;
      }
      
      /* 确保视频区域不被聊天组件遮挡 - 移除不必要的内边距 */
      .lk-video-conference-inner {
        padding-bottom: 0 !important;
      }
      
      /* 聊天消息条目 - 所有元素在同一行，紧凑排列 */
      .lk-chat-entry {
        display: block !important;
        padding: 4px 8px !important; /* 减少上下内边距，使排列更紧凑 */
        border-bottom: none !important; /* 取消中间横线 */
        margin: 0 !important;
        line-height: 1.2 !important; /* 减少行高 */
      }
      
      /* 聊天内容容器 - 确保所有内容在同一行 */
      .lk-chat-content {
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        width: 100% !important;
      }
      
      /* 用户名 */
      .lk-participant-name {
        color: #4a9eff !important;
        font-weight: bold !important;
        white-space: nowrap !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* 时间戳 */
      .lk-timestamp {
        color: #666 !important;
        font-size: 0.8em !important;
        white-space: nowrap !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* 聊天消息体 - 与用户名时间在同一行，占据剩余空间 */
      .lk-message-body {
        color: #fff !important;
        flex: 1 !important;
        margin: 0 !important;
        padding: 0 !important;
        word-wrap: break-word !important;
      }
      
      /* 聊天附件 - 显示在消息下方 */
      .lk-message-attachements {
        display: block !important;
        margin-top: 4px !important;
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      const existingStyle = document.getElementById('custom-livekit-layout');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden', backgroundColor: '#000' }}>
      {!connectionDetails || !userChoices ? (
        <PreJoin
          defaults={{ username: displayName }}
          onSubmit={handlePreJoinSubmit}
          joinLabel="加入直播"
          micLabel="麦克风"
          camLabel="摄像头"
          userLabel="用户名"
        />
      ) : (
        <LiveKitRoom
          serverUrl={connectionDetails.serverUrl}
          token={connectionDetails.participantToken}
          options={{
            videoCaptureDefaults: {
              deviceId: userChoices.videoDeviceId ?? undefined,
            },
            audioCaptureDefaults: {
              deviceId: userChoices.audioDeviceId ?? undefined,
            },
          }}
          onDisconnected={handleDisconnect}
        >
          <VideoConference />
        </LiveKitRoom>
      )}
    </div>
  );
};

export default CustomLiveRoom;