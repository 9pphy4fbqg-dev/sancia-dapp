import { http, createConfig } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { injected } from '@wagmi/connectors';

// 创建连接器 - 只使用本地注入钱包（兼容AVE浏览器）
const connectors = [
  injected({
    shimDisconnect: true,
  }),
];

// 只使用BSC主网配置
export const config = createConfig({
  chains: [bsc],
  connectors,
  transports: {
    [bsc.id]: http('https://bsc-dataseed.binance.org/'),
  },
  ssr: false,
});
