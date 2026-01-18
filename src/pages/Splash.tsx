import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sancialogo from '../assets/Sancialogo.svg';

const Splash: React.FC = () => {
  const navigate = useNavigate();
  const logoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // 动画结束后跳转到 /buy
    const timer = setTimeout(() => {
      navigate('/buy');
    }, 5000);

    // 使用 JavaScript 实现动画
    if (logoRef.current) {
      // 初始状态
      logoRef.current.style.width = '1px';
      logoRef.current.style.height = 'auto';
      logoRef.current.style.position = 'absolute';
      logoRef.current.style.top = '50%';
      logoRef.current.style.left = '50%';
      logoRef.current.style.transform = 'translate(-50%, -50%)';
      logoRef.current.style.transition = 'width 3s ease-in-out';
      logoRef.current.style.objectFit = 'contain';

      // 触发动画：先设置初始状态，然后立即开始动画
      setTimeout(() => {
        if (logoRef.current) {
          logoRef.current.style.width = '50vw';
        }
      }, 10);
    }

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000000',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <img
        ref={logoRef}
        src={Sancialogo}
        alt="Sancia Logo"
      />
    </div>
  );
};

export default Splash;