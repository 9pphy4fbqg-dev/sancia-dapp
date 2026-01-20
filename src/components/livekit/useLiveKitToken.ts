import { useState, useCallback } from 'react';
import { HOST_WALLET_ADDRESS, LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, OFFICIAL_ROOM_ID, OFFICIAL_HOST_WALLET_ADDRESSES } from '../../lib/livekit-config';
import { TrackSource } from 'livekit-server-sdk';

export interface LiveKitTokenOptions {
  room: string;
  identity: string;
  isPublisher: boolean;
  metadata?: Record<string, any>;
}

export interface LiveKitTokenResponse {
  token: string;
  url: string;
}

export const useLiveKitToken = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 生成LiveKit令牌
   * 注意：在生产环境中，此函数应调用后端API获取令牌
   * 这里我们使用livekit-server-sdk在客户端生成令牌（仅用于演示）
   * 生产环境中必须将此逻辑移到后端，否则会暴露API密钥
   */
  const getToken = useCallback(async (options: LiveKitTokenOptions): Promise<LiveKitTokenResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // 验证身份权限
      if (options.room === OFFICIAL_ROOM_ID) {
        if (options.isPublisher && !OFFICIAL_HOST_WALLET_ADDRESSES.includes(options.identity.toLowerCase())) {
          throw new Error('只有官方钱包可以在官方直播间发布内容');
        }
      }

      // 用户直播间权限验证：只允许创建者发布内容
      if (options.room.startsWith('user-')) {
        if (options.isPublisher) {
          // 在生产环境中，应从后端获取房间创建者信息进行验证
          // 这里我们从metadata中获取创建者信息
          const creator = options.metadata?.creator || options.metadata?.address;
          if (!creator || creator.toLowerCase() !== options.identity.toLowerCase()) {
            throw new Error('只有房间创建者可以在该直播间发布内容');
          }
        }
      }

      if (!LIVEKIT_URL) {
        throw new Error('LiveKit URL未配置');
      }

      if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
        throw new Error('LiveKit API密钥未配置');
      }

      // 动态导入livekit-server-sdk，仅在需要时加载
      const { AccessToken } = await import('livekit-server-sdk');
      
      // 创建AccessToken实例
      const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        identity: options.identity,
        name: options.identity,
        metadata: JSON.stringify(options.metadata || {})
      });

      // 设置房间权限
        at.addGrant({
          room: options.room,
          roomJoin: true,
          canPublish: options.isPublisher,
          canSubscribe: true,
          canPublishData: true,
          canPublishSources: options.isPublisher ? [TrackSource.CAMERA, TrackSource.MICROPHONE, TrackSource.SCREEN_SHARE] : []
        });

        // 生成JWT令牌
        const token = await at.toJwt();
        
        console.log('✅ LiveKit令牌生成成功:', {
          room: options.room,
          identity: options.identity,
          isPublisher: options.isPublisher,
          tokenLength: token.length
        });

        return {
          token,
          url: LIVEKIT_URL,
        };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成LiveKit令牌失败';
      setError(errorMessage);
      console.error('❌ 生成LiveKit令牌失败:', err);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getToken, isLoading, error };
};