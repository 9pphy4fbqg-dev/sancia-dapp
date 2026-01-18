import { createSlice } from '@reduxjs/toolkit';

export interface UserState {
  walletAddress: string | null;
}

const initialState: UserState = {
  walletAddress: null
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // 简化用户状态，只保留钱包地址
  }
});

export default userSlice.reducer;