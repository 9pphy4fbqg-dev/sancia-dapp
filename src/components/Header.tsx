import React from 'react';
import WalletConnect from './WalletConnect';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h1>SCIA Dapp</h1>
        </div>
        <div className="wallet-connect">
          <WalletConnect />
        </div>
      </div>
    </header>
  );
};

export default Header;
