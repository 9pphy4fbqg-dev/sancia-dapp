import { useState, useCallback } from 'react';
import { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, OFFICIAL_ROOM_ID, OFFICIAL_HOST_WALLET_ADDRESSES } from '../../lib/livekit-config';

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
   * 
   * 🔥 官方最佳实践：
   * 1. 生产环境中，推荐通过后端API获取令牌，以保护API密钥安全
   * 2. 前端直接生成令牌会暴露API密钥，存在安全风险
   * 3. 后端应验证用户身份和权限，再生成带有适当权限的令牌
   * 
   * 当前实现已调整为支持生产环境部署
   * 如需更高安全性，请替换为后端API调用
   */
  const getToken = useCallback(async (options: LiveKitTokenOptions): Promise<LiveKitTokenResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // 验证必要配置
      if (!LIVEKIT_URL) {
        throw new Error('LIVEKIT_URL环境变量未配置');
      }

      // 验证API密钥和密钥配置
      if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
        throw new Error('LIVEKIT_API_KEY和LIVEKIT_API_SECRET环境变量未配置');
      }

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