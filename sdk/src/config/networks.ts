/**
 * Network configurations for different blockchain networks
 */

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  blockExplorer?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  testnet: boolean;
}

/**
 * Predefined network configurations
 */
export const NETWORKS: Record<string, NetworkConfig> = {
  // Mainnets
  ethereum: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    testnet: false
  },

  polygon: {
    name: 'Polygon Mainnet',
    chainId: 137,
    rpcUrl: 'https://polygon.llamarpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18
    },
    testnet: false
  },

  arbitrum: {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arbitrum.llamarpc.com',
    blockExplorer: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    testnet: false
  },

  duckchain: {
    name: 'DuckChain Mainnet',
    chainId: 20241133,
    rpcUrl: 'https://rpc.duckchain.io',
    blockExplorer: 'https://scan.duckchain.io',
    nativeCurrency: {
      name: 'DUCK',
      symbol: 'DUCK',
      decimals: 18
    },
    testnet: false
  },

  // Testnets
  sepolia: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: 'https://ethereum-sepolia.publicnode.com',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SEP',
      decimals: 18
    },
    testnet: true
  },

  polygonMumbai: {
    name: 'Polygon Mumbai',
    chainId: 80001,
    rpcUrl: 'https://polygon-mumbai.g.alchemy.com/v2/demo',
    blockExplorer: 'https://mumbai.polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    testnet: true
  },

  arbitrumSepolia: {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorer: 'https://sepolia.arbiscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    testnet: true
  },

  seiTestnet: {
    name: 'Sei Testnet',
    chainId: 713715,
    rpcUrl: 'https://evm-rpc-testnet.sei-apis.com',
    blockExplorer: 'https://seitrace.com',
    nativeCurrency: {
      name: 'SEI',
      symbol: 'SEI',
      decimals: 18
    },
    testnet: true
  },

  // Local development
  localhost: {
    name: 'Localhost',
    chainId: 1337,
    rpcUrl: 'http://localhost:8545',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    testnet: true
  },

  hardhat: {
    name: 'Hardhat Network',
    chainId: 31337,
    rpcUrl: 'http://localhost:8545',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    testnet: true
  }
};

/**
 * Get network configuration by name or chain ID
 */
export function getNetwork(identifier: string | number): NetworkConfig | undefined {
  if (typeof identifier === 'string') {
    return NETWORKS[identifier];
  }
  
  return Object.values(NETWORKS).find(network => network.chainId === identifier);
}

/**
 * Get all testnet configurations
 */
export function getTestnets(): NetworkConfig[] {
  return Object.values(NETWORKS).filter(network => network.testnet);
}

/**
 * Get all mainnet configurations
 */
export function getMainnets(): NetworkConfig[] {
  return Object.values(NETWORKS).filter(network => !network.testnet);
}

/**
 * Check if a network is supported
 */
export function isNetworkSupported(chainId: number): boolean {
  return Object.values(NETWORKS).some(network => network.chainId === chainId);
}
