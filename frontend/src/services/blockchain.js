import { ethers } from 'ethers';

// Contract ABIs (simplified for the functions we need)
const EnergyTokenABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function buyEnergy(uint256 amount) payable",
  "function sellEnergy(uint256 amount)",
  "function getDynamicPrice(uint256 amount) view returns (uint256)",
  "function energyBalance(address) view returns (uint256)",
  "event EnergyBought(address indexed buyer, uint256 amount, uint256 price)",
  "event EnergySold(address indexed seller, uint256 amount, uint256 price)"
];

const EnergyExchangeABI = [
  "function placeOrder(uint256 amount, uint256 price, bool isBuyOrder)",
  "function orderBook(uint256) view returns (address user, uint256 amount, uint256 price, bool isBuyOrder)",
  "event OrderPlaced(address indexed user, uint256 amount, uint256 price, bool isBuyOrder)",
  "event OrderExecuted(address buyer, address seller, uint256 amount, uint256 price)"
];

const EnergyAMMABI = [
  "function getSwapPrice(uint256 tokenAmount) view returns (uint256)",
  "function swapEnergyForETH(uint256 tokenAmount)",
  "function tokenReserve() view returns (uint256)",
  "function ethReserve() view returns (uint256)"
];

// Contract addresses - update these after deployment
const CONTRACT_ADDRESSES = {
  // Polygon Amoy Testnet addresses (update after deployment)
  energyToken: import.meta.env.VITE_ENERGY_TOKEN_ADDRESS || '',
  energyExchange: import.meta.env.VITE_ENERGY_EXCHANGE_ADDRESS || '',
  energyAMM: import.meta.env.VITE_ENERGY_AMM_ADDRESS || ''
};

// Polygon Amoy Chain ID
const POLYGON_AMOY_CHAIN_ID = 80002;

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.energyToken = null;
    this.energyExchange = null;
    this.energyAMM = null;
    this.isConnected = false;
  }

  async connect() {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      // Check if on correct network
      const network = await this.provider.getNetwork();
      if (Number(network.chainId) !== POLYGON_AMOY_CHAIN_ID) {
        await this.switchToPolygonAmoy();
      }
      
      // Initialize contracts
      if (CONTRACT_ADDRESSES.energyToken) {
        this.energyToken = new ethers.Contract(
          CONTRACT_ADDRESSES.energyToken,
          EnergyTokenABI,
          this.signer
        );
      }
      
      if (CONTRACT_ADDRESSES.energyExchange) {
        this.energyExchange = new ethers.Contract(
          CONTRACT_ADDRESSES.energyExchange,
          EnergyExchangeABI,
          this.signer
        );
      }
      
      if (CONTRACT_ADDRESSES.energyAMM) {
        this.energyAMM = new ethers.Contract(
          CONTRACT_ADDRESSES.energyAMM,
          EnergyAMMABI,
          this.signer
        );
      }
      
      this.isConnected = true;
      return await this.signer.getAddress();
    } catch (error) {
      console.error('Failed to connect to blockchain:', error);
      throw error;
    }
  }

  async switchToPolygonAmoy() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + POLYGON_AMOY_CHAIN_ID.toString(16) }],
      });
    } catch (switchError) {
      // Chain not added, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x' + POLYGON_AMOY_CHAIN_ID.toString(16),
            chainName: 'Polygon Amoy Testnet',
            nativeCurrency: {
              name: 'MATIC',
              symbol: 'MATIC',
              decimals: 18
            },
            rpcUrls: ['https://rpc-amoy.polygon.technology/'],
            blockExplorerUrls: ['https://amoy.polygonscan.com/']
          }]
        });
      } else {
        throw switchError;
      }
    }
  }

  async getWalletAddress() {
    if (!this.signer) {
      throw new Error('Not connected to wallet');
    }
    return await this.signer.getAddress();
  }

  async getEnergyTokenBalance(address) {
    if (!this.energyToken) {
      throw new Error('EnergyToken contract not initialized');
    }
    const balance = await this.energyToken.balanceOf(address);
    return ethers.formatEther(balance);
  }

  async getEnergyBalance(address) {
    if (!this.energyToken) {
      throw new Error('EnergyToken contract not initialized');
    }
    const balance = await this.energyToken.energyBalance(address);
    return ethers.formatEther(balance);
  }

  async getDynamicPrice(amount) {
    if (!this.energyToken) {
      throw new Error('EnergyToken contract not initialized');
    }
    const amountWei = ethers.parseEther(amount.toString());
    const price = await this.energyToken.getDynamicPrice(amountWei);
    return ethers.formatEther(price);
  }

  async buyEnergy(amount) {
    if (!this.energyToken) {
      throw new Error('EnergyToken contract not initialized');
    }
    
    const amountWei = ethers.parseEther(amount.toString());
    const price = await this.energyToken.getDynamicPrice(amountWei);
    
    const tx = await this.energyToken.buyEnergy(amountWei, { 
      value: price,
      maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'),
      maxFeePerGas: ethers.parseUnits('40', 'gwei')
    });
    await tx.wait();
    
    return tx.hash;
  }

  async sellEnergy(amount) {
    if (!this.energyToken) {
      throw new Error('EnergyToken contract not initialized');
    }
    
    const amountWei = ethers.parseEther(amount.toString());
    const tx = await this.energyToken.sellEnergy(amountWei, {
      maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'),
      maxFeePerGas: ethers.parseUnits('40', 'gwei')
    });
    await tx.wait();
    
    return tx.hash;
  }

  async placeOrder(amount, price, isBuyOrder) {
    if (!this.energyExchange) {
      throw new Error('EnergyExchange contract not initialized');
    }
    
    const amountWei = ethers.parseEther(amount.toString());
    const priceWei = ethers.parseEther(price.toString());
    
    const tx = await this.energyExchange.placeOrder(amountWei, priceWei, isBuyOrder, {
      maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'),
      maxFeePerGas: ethers.parseUnits('40', 'gwei')
    });
    await tx.wait();
    
    return tx.hash;
  }

  async getSwapPrice(tokenAmount) {
    if (!this.energyAMM) {
      throw new Error('EnergyAMM contract not initialized');
    }
    
    const amountWei = ethers.parseEther(tokenAmount.toString());
    const price = await this.energyAMM.getSwapPrice(amountWei);
    return ethers.formatEther(price);
  }

  async swapEnergyForETH(tokenAmount) {
    if (!this.energyAMM) {
      throw new Error('EnergyAMM contract not initialized');
    }
    
    const amountWei = ethers.parseEther(tokenAmount.toString());
    const tx = await this.energyAMM.swapEnergyForETH(amountWei, {
      maxPriorityFeePerGas: ethers.parseUnits('30', 'gwei'),
      maxFeePerGas: ethers.parseUnits('40', 'gwei')
    });
    await tx.wait();
    
    return tx.hash;
  }

  async getPoolReserves() {
    if (!this.energyAMM) {
      throw new Error('EnergyAMM contract not initialized');
    }
    
    const tokenReserve = await this.energyAMM.tokenReserve();
    const ethReserve = await this.energyAMM.ethReserve();
    
    return {
      tokenReserve: ethers.formatEther(tokenReserve),
      ethReserve: ethers.formatEther(ethReserve)
    };
  }

  onAccountsChanged(callback) {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', callback);
    }
  }

  onChainChanged(callback) {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', callback);
    }
  }

  isContractsConfigured() {
    return !!(CONTRACT_ADDRESSES.energyToken && 
              CONTRACT_ADDRESSES.energyExchange && 
              CONTRACT_ADDRESSES.energyAMM);
  }

  subscribeToEnergyEvents(onEnergyBought, onEnergySold) {
    if (!this.energyToken) {
      console.warn('EnergyToken contract not initialized for events');
      return;
    }

    // Clean up existing listeners to avoid duplicates
    this.energyToken.removeAllListeners("EnergyBought");
    this.energyToken.removeAllListeners("EnergySold");

    if (onEnergyBought) {
      this.energyToken.on("EnergyBought", (buyer, amount, price, event) => {
        onEnergyBought({
          buyer,
          amount: ethers.formatEther(amount),
          price: ethers.formatEther(price),
          transactionHash: event.log?.transactionHash || ''
        });
      });
    }

    if (onEnergySold) {
      this.energyToken.on("EnergySold", (seller, amount, price, event) => {
        onEnergySold({
          seller,
          amount: ethers.formatEther(amount),
          price: ethers.formatEther(price),
          transactionHash: event.log?.transactionHash || ''
        });
      });
    }
  }

  unsubscribeFromEnergyEvents() {
    if (this.energyToken) {
      this.energyToken.removeAllListeners("EnergyBought");
      this.energyToken.removeAllListeners("EnergySold");
    }
  }
}

export const blockchainService = new BlockchainService();
export default blockchainService;
