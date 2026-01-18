import { useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useDispatch } from 'react-redux';
import { updateWalletStatus } from '../features/wallet/walletSlice';

// 自定义hook，用于监听钱包状态变化并更新Redux store
export const useWalletStatus = () => {
  const dispatch = useDispatch();
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    dispatch(updateWalletStatus({
      isConnected,
      address: address as string | null,
      chainId,
    }));
  }, [address, isConnected, chainId, dispatch]);

  return {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    chainId,
  };
};
