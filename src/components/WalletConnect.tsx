import { useEffect, useState } from 'react';
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { useDispatch } from 'react-redux';
import { updateWalletStatus } from '../features/wallet/walletSlice';
import { bsc } from 'wagmi/chains';

const WalletConnect: React.FC = () => {
  const { address, isConnected } = useAccount();
  const dappChainId = useChainId(); // DAPP配置的链ID
  const dispatch = useDispatch();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isWalletOnMainnet, setIsWalletOnMainnet] = useState(false); // 钱包实际是否在主网
  const [hasAttemptedSwitch, setHasAttemptedSwitch] = useState(false); // 是否已尝试切换网络

  // 监听钱包状态变化，同步到Redux store
  useEffect(() => {
    // 使用window.ethereum直接检查当前网络
    const checkAndSwitchNetwork = async () => {
      if (isConnected && typeof window.ethereum !== 'undefined') {
        try {
          // 获取钱包当前实际链ID
          const walletChainId = await window.ethereum.request({
            method: 'eth_chainId'
          });
          const currentChainId = parseInt(walletChainId, 16);
          
          // 检查是否为BSC主网（链ID 56）
          if (currentChainId === 56) {
            setIsWalletOnMainnet(true);
            dispatch(
              updateWalletStatus({
                isConnected,
                address: address as string | null,
                chainId: currentChainId,
              })
            );
          } else {
            setIsWalletOnMainnet(false);
            
            // 尝试自动切换到BSC主网
            if (!hasAttemptedSwitch) {
              setHasAttemptedSwitch(true);
              
              try {
                // 自动切换到BSC主网
                await window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: '0x38' }] // 0x38是56的十六进制表示
                });
                setIsWalletOnMainnet(true);
                dispatch(
                  updateWalletStatus({
                    isConnected,
                    address: address as string | null,
                    chainId: 56,
                  })
                );
                console.log('自动切换到BSC主网成功');
              } catch (switchError: any) {
                console.error('自动切换到BSC主网失败:', switchError);
                
                // 如果切换失败，提示用户手动切换
                if (switchError.code === 4902) {
                  // 如果BSC主网不在钱包中，添加BSC主网
                  try {
                    await window.ethereum.request({
                      method: 'wallet_addEthereumChain',
                      params: [{
                        chainId: '0x38',
                        chainName: 'Binance Smart Chain Mainnet',
                        nativeCurrency: {
                          name: 'BNB',
                          symbol: 'BNB',
                          decimals: 18
                        },
                        rpcUrls: ['https://bsc-dataseed.binance.org/'],
                        blockExplorerUrls: ['https://bscscan.com/']
                      }]
                    });
                    setIsWalletOnMainnet(true);
                    console.log('添加并切换到BSC主网成功');
                  } catch (addError) {
                    console.error('添加BSC主网失败:', addError);
                    alert('请手动切换到BSC主网以继续使用DAPP');
                  }
                } else {
                  alert('请手动切换到BSC主网以继续使用DAPP');
                }
              }
            }
          }
        } catch (error) {
          console.error('检查网络失败:', error);
          setIsWalletOnMainnet(false);
        }
      } else {
        // 未连接或没有window.ethereum
        setIsWalletOnMainnet(false);
      }
    };

    checkAndSwitchNetwork();
  }, [isConnected, address, hasAttemptedSwitch, dispatch]);

  // 监听链ID变化
  useEffect(() => {
    if (isConnected) {
      // 使用window.ethereum直接监听链ID变化
      const handleChainChanged = (chainId: string) => {
        const currentChainId = parseInt(chainId, 16);
        setIsWalletOnMainnet(currentChainId === 56);
        dispatch(
          updateWalletStatus({
            isConnected,
            address: address as string | null,
            chainId: currentChainId,
          })
        );
      };

      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.on('chainChanged', handleChainChanged);
      }

      return () => {
        if (typeof window.ethereum !== 'undefined') {
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [isConnected, address, dispatch]);

  // 重置切换状态
  useEffect(() => {
    if (!isConnected) {
      setHasAttemptedSwitch(false);
      setIsWalletOnMainnet(false);
    }
  }, [isConnected]);

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
