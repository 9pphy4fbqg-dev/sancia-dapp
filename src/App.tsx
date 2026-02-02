
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import PrivateSalePage from './pages/PrivateSale';
import ProfilePage from './pages/Profile';
import Layout from './pages/Layout';
import SplashPage from './pages/Splash';
import StatisticsPage from './pages/Statistics';
import CommunityPage from './pages/CommunityPage';
import MallPage from './pages/MallPage';
import NFTPage from './pages/NFTPage';
import { LanguageProvider } from './contexts/LanguageContext';


const App: React.FC = () => {
  return (
    <LanguageProvider>
      <Router basename="/">
        <Routes>
          {/* 根路径重定向到 /splash */}
          <Route path="/" element={<Navigate to="/splash" replace />} />
          {/* Splash页面 */}
          <Route path="/splash" element={<SplashPage />} />
          
          {/* 嵌套路由：所有页面使用统一Layout */}
          <Route element={<Layout />}>
            <Route path="/buy" element={<PrivateSalePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/data" element={<StatisticsPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/mall" element={<MallPage />} />
            <Route path="/nft" element={<NFTPage />} />
            <Route path="/me" element={<ProfilePage />} />
          </Route>
        </Routes>
        <Analytics />
      </Router>
    </LanguageProvider>
  );
};

export default App;