/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly REACT_APP_NETWORK: string;
  readonly REACT_APP_CHAIN_ID: string;
  readonly REACT_APP_RPC_URL: string;
  readonly REACT_APP_BSC_SCAN_URL: string;
  readonly REACT_APP_SANCIA_TOKEN_ADDRESS: string;
  readonly REACT_APP_REFERRAL_CENTER_ADDRESS: string;
  readonly REACT_APP_PRIVATE_SALE_CONTRACT_ADDRESS: string;
  readonly REACT_APP_USDT_ADDRESS: string;
  readonly REACT_APP_DEPLOYER_ADDRESS: string;
  readonly REACT_APP_BSCSCAN_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
