import React, { useEffect, useRef, useState } from 'react';
import '@livekit/components-styles';
import { Room, ConnectionState, RoomEvent, Track, VideoPresets, RemoteParticipant } from 'livekit-client';
import { LIVEKIT_URL } from '../../lib/livekit-config';
import { PlayCircleOutlined, PauseCircleOutlined, CameraOutlined, SoundOutlined, DesktopOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

interface LiveRoomProps {
  token: string;
  roomId: string;
  identity: string;
  isPublisher: boolean;
  metadata?: Record<string, any>;
  onLiveStatusChange?: (isLive: boolean) => void;
}

const LiveRoom: React.FC<LiveRoomProps> = ({ token, roomId, identity, isPublisher, metadata, onLiveStatusChange }) => {
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
  const [showAudioPermission, setShowAudioPermission] = useState(true); // 音频授权弹窗显示状态，初始为true
  // 聊天组件直接开启，不需要隐藏功能，移除相关状态
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; from: string; content: string; timestamp: number }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  // 远程参与者管理状态 - 用于连麦功能
  const [remoteParticipants, setRemoteParticipants] = useState<Map<string, RemoteParticipant>>(new Map());
  const [activeSpeakers, setActiveSpeakers] = useState<RemoteParticipant[]>([]);
  const [connectedAudience, setConnectedAudience] = useState<string[]>([]); // 存储当前连接的连麦观众identity
  
  // 连麦请求状态管理
  const [isRequestingMic, setIsRequestingMic] = useState(false); // 观众是否正在请求连麦
  const [micRequestingUsers, setMicRequestingUsers] = useState<string[]>([]); // 主播端显示的请求连麦用户列表
  const [isMicConnected, setIsMicConnected] = useState(false); // 观众是否已连麦
  const [joinMicRequested, setJoinMicRequested] = useState(false); // 观众是否已发送连麦请求

  useEffect(() => {
    // 验证必要的配置
    if (!LIVEKIT_URL) {
      const errorMsg = 'LIVEKIT_URL环境变量未配置';
      setError(errorMsg);
      return;
    }
    
    // 如果token不存在或为空，不要立即报错，而是等待token生成
    if (!token || token.trim() === '') {
      setError(null);
      return;
    }
    
    // 检查token是否有效（简单检查是否为JWT格式）
    const isJWT = token.split('.').length === 3;
    if (!isJWT) {
      return;
    }
    
    // 对于观众端(isPublisher=false)，需要自动连接到服务器以接收直播画面
    // 对于主播端(isPublisher=true)，等待用户点击开播按钮
    if (!isPublisher) {
      // 创建LiveKit房间实例 - 固定高质量视频（禁用自适应和动态调整）
       const room = new Room({
         adaptiveStream: false, // 禁用自适应流，固定画质
         dynacast: false, // 禁用动态调整，固定画质
       });
      roomRef.current = room;

      // 处理连接状态变化
      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        setConnectionState(state);
      });

      // 处理连接成功
      room.on(RoomEvent.Connected, () => {
        setError(null);
      });

      // 监听参与者连接
      room.on(RoomEvent.ParticipantConnected, (participant) => {
        setRemoteParticipants(prev => new Map(prev.set(participant.identity, participant)));
        // 如果参与者有音频轨道，添加到连麦观众列表
        if (participant.isMicrophoneEnabled) {
          setConnectedAudience(prev => [...prev, participant.identity]);
        }
      });

      // 监听参与者断开连接
      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        setRemoteParticipants(prev => {
          const newMap = new Map(prev);
          newMap.delete(participant.identity);
          return newMap;
        });
        setConnectedAudience(prev => prev.filter(id => id !== participant.identity));
      });

      // 监听活跃说话者变化
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        // 只保留远程参与者作为活跃说话者
        const remoteSpeakers = speakers.filter(speaker => speaker !== room.localParticipant) as RemoteParticipant[];
        setActiveSpeakers(remoteSpeakers);
      });

      // 处理远程轨道订阅
      room.on(RoomEvent.TrackSubscribed, (track: Track, publication, participant) => {
        if (!videoRef.current) return;
        
        try {
          let currentStream = videoRef.current.srcObject as MediaStream | null;
          if (!currentStream) {
            currentStream = new MediaStream();
          }
          
          // 对于视频轨道，先移除现有视频轨道，避免多个视频轨道冲突
          if (track.kind === 'video') {
            const existingVideoTracks = currentStream.getVideoTracks();
            existingVideoTracks.forEach(existingTrack => {
              currentStream!.removeTrack(existingTrack);
            });
            
            // 添加新视频轨道
            currentStream.addTrack(track.mediaStreamTrack);
            
            // 更新视频元素
            videoRef.current.srcObject = currentStream;
            videoRef.current.autoplay = true;
            videoRef.current.playsInline = true;
            // 只有主播端静音，观众端不静音
            videoRef.current.muted = false;
          } 
          // 对于音频轨道，使用独立的音频元素，支持多个音频轨道同时播放
          else if (track.kind === 'audio') {
            // 创建独立的音频元素，不共享MediaStream
            const audioElement = track.attach();
            audioElement.autoplay = true;
            audioElement.muted = false;
            // 设置id以便后续清理
            audioElement.id = `audio-${participant.identity}-${publication.trackSid}`;
            // 添加到body或特定容器中（隐藏显示）
            audioElement.style.display = 'none';
            document.body.appendChild(audioElement);
          }
        } catch (error) {
          console.error('处理远程轨道时出错:', error);
        }
      });
      
      // 处理远程轨道取消订阅，清理资源
      room.on(RoomEvent.TrackUnsubscribed, (track: Track, publication, participant) => {
        if (track.kind === 'audio') {
          // 清理独立的音频元素
          const audioElement = document.getElementById(`audio-${participant.identity}-${publication.trackSid}`);
          if (audioElement) {
            document.body.removeChild(audioElement);
          }
        }
      });

      // 处理接收到的数据通道消息
      room.on(RoomEvent.DataReceived, (payload, participant, _kind, _topic) => {
        try {
          const message = JSON.parse(new TextDecoder().decode(payload));
          
          // 处理聊天消息
          if (message.content && message.from && message.timestamp && message.from !== identity) {
            setChatMessages(prev => [...prev, message]);
          }
          
          // 处理连麦请求相关消息
          if (message.type) {
            switch (message.type) {
              case 'mic_request':
                // 主播端接收到连麦请求
                if (isPublisher && message.from !== identity) {
                  setMicRequestingUsers(prev => [...prev, message.from]);
                }
                break;
              
              case 'cancel_mic_request':
                // 主播端接收到取消连麦请求
                if (isPublisher && message.from !== identity) {
                  setMicRequestingUsers(prev => prev.filter(id => id !== message.from));
                }
                break;
              
              case 'approve_mic':
                // 观众端接收到批准连麦消息
                if (!isPublisher && message.to === identity) {
                  setIsMicConnected(true);
                  setIsRequestingMic(false);
                  setJoinMicRequested(false);
                  // 开启麦克风
                  if (roomRef.current) {
                    // 直接调用setMicrophoneEnabled，LiveKit会自动创建和发布麦克风轨道
                    roomRef.current.localParticipant.setMicrophoneEnabled(true)
                      .then(() => {
                        console.log('麦克风轨道已成功发布');
                      })
                      .catch(error => {
                        console.error('发布麦克风轨道失败:', error);
                      });
                  }
                }
                break;
              
              case 'reject_mic':
                // 观众端接收到拒绝连麦消息
                if (!isPublisher && message.to === identity) {
                  setIsRequestingMic(false);
                  setJoinMicRequested(false);
                }
                break;
              
              case 'leave_mic':
                // 主播端接收到观众断开连麦消息
                if (isPublisher && message.from !== identity) {
                  setConnectedAudience(prev => prev.filter(id => id !== message.from));
                }
                break;
              
              case 'disconnect_mic':
                // 观众端接收到主播断开连麦消息
                if (!isPublisher && message.to === identity) {
                  setIsMicConnected(false);
                  setJoinMicRequested(false);
                  // 关闭麦克风
                  roomRef.current?.localParticipant.setMicrophoneEnabled(false);
                }
                break;
            }
          }
        } catch (err) {
          console.error('解析数据通道消息失败:', err);
        }
      });

      // 监听参与者连接
      room.on(RoomEvent.ParticipantConnected, (participant) => {
        setRemoteParticipants(prev => new Map(prev.set(participant.identity, participant)));
        // 如果参与者有音频轨道，添加到连麦观众列表
        if (participant.isMicrophoneEnabled) {
          setConnectedAudience(prev => [...prev, participant.identity]);
        }
      });

      // 监听参与者断开连接
      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        setRemoteParticipants(prev => {
          const newMap = new Map(prev);
          newMap.delete(participant.identity);
          return newMap;
        });
        setConnectedAudience(prev => prev.filter(id => id !== participant.identity));
      });

      // 监听活跃说话者变化
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        // 只保留远程参与者作为活跃说话者
        const remoteSpeakers = speakers.filter(speaker => speaker !== room.localParticipant) as RemoteParticipant[];
        setActiveSpeakers(remoteSpeakers);
      });

      // 连接到LiveKit服务器
      const connectToLiveKit = async () => {
        try {
          await room.connect(LIVEKIT_URL, token);
        } catch (err) {
          console.error('LiveKit连接失败:', err);
          setError('连接LiveKit服务器失败: ' + (err as Error).message);
        }
      };

      // 调用连接函数
      connectToLiveKit();
    }

    // 清理函数
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      // 清理视频流
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };
  }, [token, roomId]);

  // 开播/停止直播
  const togglePublishing = async () => {
    try {
      if (isPublishing) {
        // 停止直播 - 断开服务器连接
        if (roomRef.current) {
          roomRef.current.disconnect();
          roomRef.current = null;
        }
        
        // 更新所有状态
        setIsPublishing(false);
        setIsCameraEnabled(false);
        setIsMicrophoneEnabled(false);
        setIsScreenSharing(false);
        
        // 清理视频流
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      } else {
        // 开始直播 - 创建房间实例并连接服务器
        if (!token) {
          const errorMsg = 'LiveKit令牌不存在';
          setError(errorMsg);
          return;
        }
        
        // 1. 创建LiveKit房间实例 - 固定高质量视频（禁用自适应和动态调整）
        const room = new Room({
          adaptiveStream: false, // 禁用自适应流，固定画质
          dynacast: false, // 禁用动态调整，固定画质
        });
        roomRef.current = room;

        // 处理连接状态变化
        room.on(RoomEvent.ConnectionStateChanged, (state) => {
          setConnectionState(state);
        });

        // 处理连接成功
        room.on(RoomEvent.Connected, () => {
          setError(null);
        });

        // 处理远程轨道订阅
      room.on(RoomEvent.TrackSubscribed, (track: Track, publication, participant) => {
        if (!videoRef.current) return;
        
        try {
          let currentStream = videoRef.current.srcObject as MediaStream | null;
          if (!currentStream) {
            currentStream = new MediaStream();
          }
          
          // 对于视频轨道，先移除现有视频轨道，避免多个视频轨道冲突
          if (track.kind === 'video') {
            const existingVideoTracks = currentStream.getVideoTracks();
            existingVideoTracks.forEach(existingTrack => {
              currentStream!.removeTrack(existingTrack);
            });
            
            // 添加新视频轨道
            currentStream.addTrack(track.mediaStreamTrack);
            
            // 更新视频元素
            videoRef.current.srcObject = currentStream;
            videoRef.current.autoplay = true;
            videoRef.current.playsInline = true;
            // 只有主播端静音自己（避免回声），观众端不静音
            videoRef.current.muted = isPublisher;
          } 
          // 对于音频轨道，使用独立的音频元素，支持多个音频轨道同时播放
          else if (track.kind === 'audio') {
            // 创建独立的音频元素，不共享MediaStream
            const audioElement = track.attach();
            audioElement.autoplay = true;
            audioElement.muted = false;
            // 设置id以便后续清理
            audioElement.id = `audio-${participant.identity}-${publication.trackSid}`;
            // 添加到body或特定容器中（隐藏显示）
            audioElement.style.display = 'none';
            document.body.appendChild(audioElement);
          }
        } catch (error) {
          console.error('处理远程轨道时出错:', error);
        }
      });
      
      // 处理远程轨道取消订阅，清理资源
      room.on(RoomEvent.TrackUnsubscribed, (track: Track, publication, participant) => {
        if (track.kind === 'audio') {
          // 清理独立的音频元素
          const audioElement = document.getElementById(`audio-${participant.identity}-${publication.trackSid}`);
          if (audioElement) {
            document.body.removeChild(audioElement);
          }
        }
      });

        // 处理本地轨道发布
        room.on(RoomEvent.LocalTrackPublished, (publication) => {
          if (!publication.track) return;
          
          // 更新状态
          if (publication.source === 'camera') {
            setIsCameraEnabled(true);
            // 本地预览（仅摄像头）
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = new MediaStream([publication.track.mediaStreamTrack]);
              localVideoRef.current.autoplay = true;
              localVideoRef.current.playsInline = true;
              localVideoRef.current.muted = true;
            }
            
            // 摄像头轨道设置到主视频元素
            if (videoRef.current) {
              let currentStream = videoRef.current.srcObject as MediaStream | null;
              if (!currentStream) {
                currentStream = new MediaStream();
              }
              
              // 移除现有视频轨道
              const existingVideoTracks = currentStream.getVideoTracks();
              existingVideoTracks.forEach(existingTrack => {
                currentStream!.removeTrack(existingTrack);
              });
              
              // 添加摄像头轨道
              currentStream.addTrack(publication.track.mediaStreamTrack);
              videoRef.current.srcObject = currentStream;
              // 只有主播端静音自己（避免回声），观众端不静音
              videoRef.current.muted = isPublisher;
            }
          } else if (publication.source === 'screen_share') {
            setIsScreenSharing(true);
            
            // 屏幕共享轨道设置到主视频元素
            if (videoRef.current) {
              let currentStream = videoRef.current.srcObject as MediaStream | null;
              if (!currentStream) {
                currentStream = new MediaStream();
              }
              
              // 移除现有视频轨道
              const existingVideoTracks = currentStream.getVideoTracks();
              existingVideoTracks.forEach(existingTrack => {
                currentStream!.removeTrack(existingTrack);
              });
              
              // 添加屏幕共享轨道
              currentStream.addTrack(publication.track.mediaStreamTrack);
              videoRef.current.srcObject = currentStream;
              // 只有主播端静音自己（避免回声），观众端不静音
              videoRef.current.muted = isPublisher;
            }
          } else if (publication.source === 'microphone') {
            setIsMicrophoneEnabled(true);
            
            // 音频轨道添加到当前视频流
            if (videoRef.current) {
              let currentStream = videoRef.current.srcObject as MediaStream | null;
              if (!currentStream) {
                currentStream = new MediaStream();
              }
              
              // 移除现有音频轨道
              const existingAudioTracks = currentStream.getAudioTracks();
              existingAudioTracks.forEach(existingTrack => {
                currentStream!.removeTrack(existingTrack);
              });
              
              // 添加音频轨道
              currentStream.addTrack(publication.track.mediaStreamTrack);
              videoRef.current.srcObject = currentStream;
              // 只有主播端静音自己（避免回声），观众端不静音
              videoRef.current.muted = isPublisher;
            }
          }
        });

        // 处理本地轨道移除
        room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
          // 更新状态
          if (publication.source === 'camera') {
            setIsCameraEnabled(false);
          } else if (publication.source === 'screen_share') {
            setIsScreenSharing(false);
          } else if (publication.source === 'microphone') {
            setIsMicrophoneEnabled(false);
          }
        });

        // 处理接收到的数据通道消息
        room.on(RoomEvent.DataReceived, (payload, participant, _kind, _topic) => {
          try {
            const message = JSON.parse(new TextDecoder().decode(payload));
            
            // 处理聊天消息
            if (message.content && message.from && message.timestamp && message.from !== identity) {
              setChatMessages(prev => [...prev, message]);
            }
            
            // 处理连麦请求相关消息
            if (message.type) {
              switch (message.type) {
                case 'mic_request':
                  // 主播端接收到连麦请求
                  if (isPublisher && message.from !== identity) {
                    setMicRequestingUsers(prev => [...prev, message.from]);
                  }
                  break;
                
                case 'cancel_mic_request':
                  // 主播端接收到取消连麦请求
                  if (isPublisher && message.from !== identity) {
                    setMicRequestingUsers(prev => prev.filter(id => id !== message.from));
                  }
                  break;
                
                case 'approve_mic':
                  // 观众端接收到批准连麦消息
                  if (!isPublisher && message.to === identity) {
                    setIsMicConnected(true);
                    setIsRequestingMic(false);
                    setJoinMicRequested(false);
                    // 开启麦克风
                    if (roomRef.current) {
                      // 直接调用setMicrophoneEnabled，LiveKit会自动创建和发布麦克风轨道
                      roomRef.current.localParticipant.setMicrophoneEnabled(true)
                        .then(() => {
                          console.log('麦克风轨道已成功发布');
                        })
                        .catch(error => {
                          console.error('发布麦克风轨道失败:', error);
                        });
                    }
                  }
                  break;
                
                case 'reject_mic':
                  // 观众端接收到拒绝连麦消息
                  if (!isPublisher && message.to === identity) {
                    setIsRequestingMic(false);
                    setJoinMicRequested(false);
                  }
                  break;
                
                case 'leave_mic':
                  // 主播端接收到观众断开连麦消息
                  if (isPublisher && message.from !== identity) {
                    setConnectedAudience(prev => prev.filter(id => id !== message.from));
                  }
                  break;
                
                case 'disconnect_mic':
                  // 观众端接收到主播断开连麦消息
                  if (!isPublisher && message.to === identity) {
                    setIsMicConnected(false);
                    setJoinMicRequested(false);
                    // 关闭麦克风
                    roomRef.current?.localParticipant.setMicrophoneEnabled(false);
                  }
                  break;
              }
            }
          } catch (err) {
            console.error('解析数据通道消息失败:', err);
          }
        });

        // 2. 连接到LiveKit服务器 - 使用官方推荐的connectOptions
        await room.connect(LIVEKIT_URL, token, {
          autoSubscribe: true,
        });
        
        // 3. 设置为直播状态
        setIsPublishing(true);
        
        // 4. 自动发布默认媒体轨道（摄像头和麦克风）
        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(true);
      }
    } catch (err) {
      console.error('开播/停止直播失败:', err);
      setError('操作失败: ' + (err as Error).message);
      
      // 重置状态
      if (isPublishing) {
        setIsPublishing(false);
        setIsCameraEnabled(false);
        setIsMicrophoneEnabled(false);
        setIsScreenSharing(false);
      }
    }
  };

  // 切换摄像头
  const toggleCamera = async () => {
    // 只有在直播状态下才能切换设备
    if (!roomRef.current || !isPublisher || !isPublishing) {
      return;
    }

    try {
      const newState = !isCameraEnabled;
      
      // 更新本地状态
      setIsCameraEnabled(newState);
      
      // 直接调用LiveKit API切换摄像头轨道
      await roomRef.current.localParticipant.setCameraEnabled(newState);
    } catch (err) {
      console.error('切换摄像头失败:', err);
      setError('操作失败: ' + (err as Error).message);
      // 恢复状态
      setIsCameraEnabled(!isCameraEnabled);
    }
  };

  // 切换前后摄像头
  const toggleCameraFacing = async () => {
    if (!isPublisher) {
      return;
    }

    try {
      const newFacing = currentCameraFacing === 'user' ? 'environment' : 'user';
      setCurrentCameraFacing(newFacing);
      
      // 如果摄像头已经开启，获取当前摄像头轨道并重启它，指定新的摄像头方向
      if (isCameraEnabled && roomRef.current) {
        // 获取摄像头轨道出版物
        const cameraPublication = roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera);
        if (cameraPublication?.track) {
          // 重启轨道并指定新的摄像头方向
          await (cameraPublication.track as any).restartTrack({
            facingMode: newFacing
          });
        }
      }
    } catch (err) {
      console.error('切换前后摄像头失败:', err);
      setError('切换前后摄像头失败: ' + (err as Error).message);
    }
  };

  // 切换麦克风
  const toggleMicrophone = async () => {
    // 只有在直播状态下才能切换设备
    if (!roomRef.current || !isPublisher || !isPublishing) {
      return;
    }

    try {
      const newState = !isMicrophoneEnabled;
      
      // 更新本地状态
      setIsMicrophoneEnabled(newState);
      
      // 直接调用LiveKit API切换麦克风轨道
      await roomRef.current.localParticipant.setMicrophoneEnabled(newState);
    } catch (err) {
      console.error('切换麦克风失败:', err);
      setError('操作失败: ' + (err as Error).message);
      // 恢复状态
      setIsMicrophoneEnabled(!isMicrophoneEnabled);
    }
  };

  // 切换屏幕分享
  const toggleScreenSharing = async () => {
    // 只有在直播状态下才能切换设备
    if (!roomRef.current || !isPublisher || !isPublishing) {
      return;
    }

    try {
      const newState = !isScreenSharing;
      
      // 检查是否为移动设备，屏幕分享在某些移动端浏览器上可能不支持或有限制
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // 如果是移动端且要开启屏幕分享，给出提示
      if (isMobile && newState) {
        console.warn('移动端屏幕分享可能不支持或有限制');
      }
      
      // 更新本地状态
      setIsScreenSharing(newState);
      
      // 直接调用LiveKit API切换屏幕分享轨道
      await roomRef.current.localParticipant.setScreenShareEnabled(newState);
    } catch (err) {
      console.error('切换屏幕分享失败:', err);
      setError('操作失败: ' + (err as Error).message);
      // 恢复状态
      setIsScreenSharing(!isScreenSharing);
    }
  };

  // 显示/隐藏本地预览
  const toggleLocalPreview = () => {
    const newState = !showLocalPreview;
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
    
    // 使用LiveKit数据通道发送消息
    if (roomRef.current) {
      roomRef.current.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(newMessage)),
        {
          topic: 'chat',
          reliable: true
        }
      );
    }
  };
  
  // 连麦请求相关函数
  
  // 观众发送连麦请求
  const sendMicRequest = async () => {
    if (!roomRef.current || isMicConnected || joinMicRequested) return;
    
    try {
      setIsRequestingMic(true);
      setJoinMicRequested(true);
      
      // 通过数据通道发送连麦请求
      const requestMsg = {
        type: 'mic_request',
        from: identity,
        timestamp: Date.now()
      };
      
      roomRef.current.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(requestMsg)),
        {
          topic: 'mic_requests',
          reliable: true
        }
      );
    } catch (err) {
      console.error('发送连麦请求失败:', err);
      setError('发送连麦请求失败: ' + (err as Error).message);
      setIsRequestingMic(false);
      setJoinMicRequested(false);
    }
  };
  
  // 观众取消连麦请求
  const cancelMicRequest = async () => {
    if (!roomRef.current || !joinMicRequested) return;
    
    try {
      // 通过数据通道发送取消连麦请求
      const cancelMsg = {
        type: 'cancel_mic_request',
        from: identity,
        timestamp: Date.now()
      };
      
      roomRef.current.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(cancelMsg)),
        {
          topic: 'mic_requests',
          reliable: true
        }
      );
      
      setIsRequestingMic(false);
      setJoinMicRequested(false);
    } catch (err) {
      console.error('取消连麦请求失败:', err);
      setError('取消连麦请求失败: ' + (err as Error).message);
    }
  };
  
  // 观众断开连麦
  const leaveMic = async () => {
    if (!roomRef.current || !isMicConnected) return;
    
    try {
      // 关闭麦克风
      await roomRef.current.localParticipant.setMicrophoneEnabled(false);
      
      // 通过数据通道发送断开连麦消息
      const leaveMsg = {
        type: 'leave_mic',
        from: identity,
        timestamp: Date.now()
      };
      
      roomRef.current.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(leaveMsg)),
        {
          topic: 'mic_requests',
          reliable: true
        }
      );
      
      setIsMicConnected(false);
      setJoinMicRequested(false);
      
      // 从连麦观众列表中移除
      setConnectedAudience(prev => prev.filter(id => id !== identity));
    } catch (err) {
      console.error('断开连麦失败:', err);
      setError('断开连麦失败: ' + (err as Error).message);
    }
  };
  
  // 主播批准连麦请求
  const approveMicRequest = async (userId: string) => {
    if (!roomRef.current) return;
    
    try {
      // 通过数据通道发送批准连麦消息
      const approveMsg = {
        type: 'approve_mic',
        from: identity,
        to: userId,
        timestamp: Date.now()
      };
      
      roomRef.current.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(approveMsg)),
        {
          topic: 'mic_requests',
          reliable: true
        }
      );
      
      // 从请求列表中移除
      setMicRequestingUsers(prev => prev.filter(id => id !== userId));
      
      // 将用户添加到已连接连麦观众列表中
      setConnectedAudience(prev => [...prev, userId]);
    } catch (err) {
      console.error('批准连麦请求失败:', err);
      setError('批准连麦请求失败: ' + (err as Error).message);
    }
  };
  
  // 主播拒绝连麦请求
  const rejectMicRequest = async (userId: string) => {
    if (!roomRef.current) return;
    
    try {
      // 通过数据通道发送拒绝连麦消息
      const rejectMsg = {
        type: 'reject_mic',
        from: identity,
        to: userId,
        timestamp: Date.now()
      };
      
      roomRef.current.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(rejectMsg)),
        {
          topic: 'mic_requests',
          reliable: true
        }
      );
      
      // 从请求列表中移除
      setMicRequestingUsers(prev => prev.filter(id => id !== userId));
    } catch (err) {
      console.error('拒绝连麦请求失败:', err);
      setError('拒绝连麦请求失败: ' + (err as Error).message);
    }
  };
  
  // 主播断开观众连麦
  const disconnectAudienceMic = async (userId: string) => {
    if (!roomRef.current) return;
    
    try {
      // 通过数据通道发送断开连麦消息
      const disconnectMsg = {
        type: 'disconnect_mic',
        from: identity,
        to: userId,
        timestamp: Date.now()
      };
      
      roomRef.current.localParticipant.publishData(
        new TextEncoder().encode(JSON.stringify(disconnectMsg)),
        {
          topic: 'mic_requests',
          reliable: true
        }
      );
      
      // 从连麦观众列表中移除
      setConnectedAudience(prev => prev.filter(id => id !== userId));
    } catch (err) {
      console.error('断开观众连麦失败:', err);
      setError('断开观众连麦失败: ' + (err as Error).message);
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

  // 音频授权函数
  const handleAudioPermission = async () => {
    try {
      // 激活音频上下文
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // 如果有视频元素，确保其不静音
      if (videoRef.current) {
        videoRef.current.muted = false;
      }
      
      // 隐藏授权弹窗
      setShowAudioPermission(false);
      console.log('🔊 音频授权已通过');
    } catch (error) {
      console.error('音频授权失败:', error);
    }
  };

  // 当直播状态变化时，通知父组件
  useEffect(() => {
    if (onLiveStatusChange) {
      onLiveStatusChange(isPublishing);
    }
  }, [isPublishing, onLiveStatusChange]);

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
              <div style={{ marginBottom: '8px' }}>{isPublisher ? '直播组件已加载，等待用户点击开播按钮' : '正在连接到直播间...'}</div>
              <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '4px' }}>房间ID: {roomId}</div>
              <div style={{ fontSize: '14px', color: '#aaa' }}>LiveKit URL: {LIVEKIT_URL}</div>
              <div style={{ fontSize: '14px', color: '#aaa', marginTop: '8px' }}>连接状态: {connectionState}</div>
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
        
        {/* 音频授权弹窗 - 仅观众端显示 */}
        {!isPublisher && showAudioPermission && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid #fff',
            borderRadius: '8px',
            padding: '12px 20px',
            color: '#fff',
            fontSize: '14px',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            maxWidth: '80%',
            textAlign: 'center'
          }}>
            <span>🔊</span>
            <span>请点击授权播放音频</span>
            <button
              onClick={handleAudioPermission}
              style={{
                backgroundColor: '#1890ff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              允许
            </button>
          </div>
        )}
      </div>
      
      {/* 底部控制区域 - 包含聊天和主播控制 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2px' }}>
        {/* 聊天面板 - 放在左侧，与主播控制按钮底部齐平 */}
        <div style={{ flex: 1, marginRight: '10px', display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', height: '249px' }}>
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
          
          {/* 观众连麦请求按钮 */}
          {!isPublisher && (
            <div style={{
              display: 'flex',
              gap: '4px',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '8px'
            }}>
              {!isMicConnected && !joinMicRequested && (
                <button
                  onClick={sendMicRequest}
                  style={{
                    // 彻底重置按钮样式
                    all: 'unset',
                    // 重新定义必要样式
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: '#1890ff',
                    color: '#fff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: '1px solid #1890ff',
                    outline: 'none',
                    boxShadow: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  请求连麦
                </button>
              )}
              
              {isRequestingMic && (
                <button
                  onClick={cancelMicRequest}
                  style={{
                    // 彻底重置按钮样式
                    all: 'unset',
                    // 重新定义必要样式
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: '#ff4d4f',
                    color: '#fff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: '1px solid #ff4d4f',
                    outline: 'none',
                    boxShadow: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  取消请求
                </button>
              )}
              
              {isMicConnected && (
                <button
                  onClick={leaveMic}
                  style={{
                    // 彻底重置按钮样式
                    all: 'unset',
                    // 重新定义必要样式
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: '#ff4d4f',
                    color: '#fff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: '1px solid #ff4d4f',
                    outline: 'none',
                    boxShadow: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  断开连麦
                </button>
              )}
              
              {joinMicRequested && !isRequestingMic && !isMicConnected && (
                <div style={{
                  fontSize: '12px',
                  color: '#52c41a',
                  padding: '4px 8px',
                  backgroundColor: 'rgba(82, 196, 26, 0.1)',
                  borderRadius: '4px',
                  border: '1px solid #52c41a'
                }}>
                  连麦请求已发送
                </div>
              )}
            </div>
          )}
          
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
                  fontSize: '16px', /* 增加到16px，避免移动端自动放大 */
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
        
        {/* 连麦请求审批面板 - 主播端显示 */}
        {isPublisher && micRequestingUsers.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid #666',
            borderRadius: '4px',
            padding: '8px',
            zIndex: 20
          }}>
            <div style={{
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>连麦请求</div>
            
            {micRequestingUsers.map((userId) => (
              <div key={userId} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
                padding: '4px',
                backgroundColor: 'rgba(102, 102, 102, 0.3)',
                borderRadius: '2px'
              }}>
                <span style={{
                  color: '#fff',
                  fontSize: '12px',
                  maxWidth: '100px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>{userId.slice(0, 6)}...{userId.slice(-4)}</span>
                
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => approveMicRequest(userId)}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: '#52c41a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '2px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    批准
                  </button>
                  
                  <button
                    onClick={() => rejectMicRequest(userId)}
                    style={{
                      padding: '2px 6px',
                      backgroundColor: '#ff4d4f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '2px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
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
      
      {/* 连麦观众列表 - 在主视频下方显示连麦观众编号 */}
      {connectedAudience.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '10px',
          padding: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderRadius: '4px',
          border: '1px solid #666',
          zIndex: 5
        }}>
          {connectedAudience.map((audienceId, index) => {
            const participant = remoteParticipants.get(audienceId);
            const isSpeaking = activeSpeakers.some(speaker => speaker.identity === audienceId);
            
            return (
              <div 
                key={audienceId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: isSpeaking ? '#52c41a' : 'rgba(102, 102, 102, 0.8)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: `2px solid ${isSpeaking ? '#52c41a' : 'transparent'}`,
                  boxShadow: isSpeaking ? '0 0 10px rgba(82, 196, 26, 0.6)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                {index + 1}
              </div>
            );
          })}
        </div>
      )}
      
      {/* 调试信息 - 隐藏 */}
      <div style={{ display: 'none' }}>
        <div>身份: {identity}</div>
      </div>
    </div>
  );
};

export default LiveRoom;