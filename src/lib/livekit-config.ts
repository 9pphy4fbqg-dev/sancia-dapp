// LiveKit Cloud配置
// 官方最佳实践：将API密钥和密钥存储在环境变量中，避免硬编码

// 确保URL格式正确，包含完整的WebSocket协议和路径
export const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;

// 生产环境中，API密钥和密钥不应暴露在前端
// 以下配置仅用于开发环境，生产环境应通过后端服务获取token
export const LIVEKIT_API_KEY = import.meta.env.VITE_LIVEKIT_API_KEY;
export const LIVEKIT_API_SECRET = import.meta.env.VITE_LIVEKIT_API_SECRET;

// 官方直播间配置
export const OFFICIAL_ROOM_ID = 'official';
export const OFFICIAL_HOST_WALLET_ADDRESSES = [
  '0x5bea8f58ac26d10351455c4cdec6a76bf11c1fea',
  '0x77d8b5f8a03cb7a7f5eed8d979750650f924d709'
]; // 只有这两个钱包地址可以在官方直播间开播

export const HOST_WALLET_ADDRESS = OFFICIAL_HOST_WALLET_ADDRESSES[0]; // 保留默认值，兼容现有代码

// SCIA代币配置
export const SCIA_TOKEN_ADDRESS = '0x3f435D68576B7F0373F8D739F4c78B4eF0F51BFE';
export const MIN_SCIA_BALANCE = BigInt('1000000000000000000000'); // 1000 SCIA in wei

// 房间类型
export type RoomType = 'official' | 'user';

// 房间信息接口
export interface RoomInfo {
  id: string;
  name: string;
  type: RoomType;
  participants: number;
  isLive: boolean;
  creator?: string;
  createdAt?: number;
}