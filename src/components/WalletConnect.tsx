import { useEffect, useState } from 'react';
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { useDispatch } from 'react-redux';
import { updateWalletStatus } from '../features/wallet/walletSlice';
import { bsc } from 'wagmi/chains';

const WalletConnect: React.FC = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const dispatch = useDispatch();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [showDropdown, setShowDropdown] = useState(false);

  // 监听钱包状态变化，同步到Redux store
  useEffect(() => {
    dispatch(
      updateWalletStatus({
        isConnected,
        address: address as string | null,
        chainId,
      })
    );
  }, [isConnected, address, chainId, dispatch]);

  // 切换网络
  const handleSwitchNetwork = (targetChainId: number) => {
    if (switchChain) {
      switchChain({ chainId: targetChainId });
      setShowDropdown(false);
    }
  };

  return (
    <div className="wallet-connect-container" style={{ position: 'relative', height: '40px' }}>
      {isConnected ? (
        <div className="wallet-button-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
          {/* 主按钮 - 显示网络和钱包地址 */}
          <button 
            className="wallet-main-btn" 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              backgroundColor: '#1677ff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              height: '40px',
              minWidth: '200px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>BSC主网</span>
              <span style={{ opacity: 0.8 }}>|</span>
              <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
            </div>
            <span style={{ marginLeft: '8px' }}>▼</span>
          </button>

          {/* 下拉菜单 */}
          {showDropdown && (
            <div 
              className="wallet-dropdown" 
              style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                padding: '8px',
                zIndex: '1000',
                minWidth: '200px'
              }}
            >
              {/* 网络信息显示 */}
              <div style={{ padding: '4px 0', borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px', padding: '0 8px' }}>当前网络</div>
                <div 
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#1677ff',
                    fontWeight: '500',
                    backgroundColor: 'rgba(22, 119, 255, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>BSC主网</span>
                    <span>✓</span>
                  </div>
                </div>
              </div>

              {/* 断开连接选项 */}
              <button 
                className="disconnect-option"
                onClick={() => {
                  disconnect();
                  setShowDropdown(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: '#ff4d4f',
                  marginTop: '8px'
                }}
              >
                断开连接
              </button>
            </div>
          )}
        </div>
      ) : (
        <button 
          className="connect-button"
          onClick={() => connect({ connector: connectors[0] })}
          style={{
            padding: '8px 20px',
            backgroundColor: '#1677ff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            height: '40px'
          }}
        >
          连接钱包
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
