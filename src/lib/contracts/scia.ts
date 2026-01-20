import { createPublicClient, http } from 'viem';
import { bsc } from 'viem/chains';
import { SCIA_TOKEN_ADDRESS } from '../livekit-config';

// SCIA代币合约ABI
const SCIA_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// 创建公共客户端
const publicClient = createPublicClient({
  chain: bsc,
  transport: http(import.meta.env.REACT_APP_RPC_URL || 'https://bsc-dataseed.binance.org/')
});

/**
 * 检查指定地址的SCIA余额
 * @param address 用户钱包地址
 * @returns SCIA余额（wei单位）
 */
export async function checkSciaBalance(address: string): Promise<bigint> {
  try {
    const balance = await publicClient.readContract({
      address: SCIA_TOKEN_ADDRESS as `0x${string}`,
      abi: SCIA_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    });
    return balance;
  } catch (error) {
    console.error('Error checking SCIA balance:', error);
    throw new Error('Failed to check SCIA balance');
  }
}

/**
 * 检查用户是否持有≥指定数量的SCIA代币
 * @param address 用户钱包地址
 * @param minimumBalance 最小余额（wei单位）
 * @returns 是否满足余额要求
 */
export async function hasMinimumSciaBalance(address: string, minimumBalance: bigint): Promise<boolean> {
  try {
    const balance = await checkSciaBalance(address);
    return balance >= minimumBalance;
  } catch (error) {
    console.error('Error checking minimum SCIA balance:', error);
    return false;
  }
}
