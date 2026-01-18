import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Footer: React.FC = () => {
  const location = useLocation();

  const navigationItems = [
    { path: '/', label: '私募', icon: '💰' },
    { path: '/data', label: '数据', icon: '📊' },
    { path: '/community', label: '社区', icon: '👥' },
    { path: '/mall', label: '商城', icon: '🛒' },
    { path: '/profile', label: '我', icon: '👤' },
    { path: '/statistics', label: '统计', icon: '📈' },
  ];

  return (
    <footer className="footer">
      <div className="footer-content">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`footer-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="footer-icon">{item.icon}</span>
            <span className="footer-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </footer>
  );
};

export default Footer;
