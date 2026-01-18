import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 使用基础类型代替Wagmi特定类型
interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  status: 'disconnected' | 'connecting' | 'connected';
}

const initialState: WalletState = {
  isConnected: false,
  address: null,
  chainId: null,
  status: 'disconnected',
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    connectWallet: (state) => {
      state.status = 'connecting';
    },
    disconnectWallet: () => {
      return initialState;
    },
    updateWalletStatus: (state, action: PayloadAction<{
      isConnected: boolean;
      address: string | null;
      chainId: number | null;
    }>) => {
      state.isConnected = action.payload.isConnected;
      state.address = action.payload.address;
      state.chainId = action.payload.chainId;
      state.status = action.payload.isConnected ? 'connected' : 'disconnected';
    },
  },
});

export const { connectWallet, disconnectWallet, updateWalletStatus } = walletSlice.actions;

export default walletSlice.reducer;
