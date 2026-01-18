import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import walletReducer from '../features/wallet/walletSlice';
import userReducer from '../features/user';

// 配置Redux store
export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    user: userReducer,
    // 在这里添加你的slice reducers
    // 例如：[apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // 禁用序列化检查，允许非序列化值（如BigInt）
    }).concat(
      // 在这里添加你的RTK Query中间件
      // 例如：apiSlice.middleware,
    ),
});

// 设置监听器，用于支持RTK Query的refetchOnFocus和refetchOnReconnect功能
export const setupReduxListeners = setupListeners(store.dispatch);

// 导出类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
