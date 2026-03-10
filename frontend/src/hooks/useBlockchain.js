import { useState, useEffect, useCallback } from 'react';
import blockchainService from '../services/blockchain';

export const useBlockchain = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [energyBalance, setEnergyBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isContractsConfigured, setIsContractsConfigured] = useState(false);

  useEffect(() => {
    setIsContractsConfigured(blockchainService.isContractsConfigured());
  }, []);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const address = await blockchainService.connect();
      setWalletAddress(address);
      setIsConnected(true);
      await refreshBalances(address);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBalances = useCallback(async (address) => {
    if (!address || !blockchainService.isContractsConfigured()) return;
    
    try {
      const tokenBal = await blockchainService.getEnergyTokenBalance(address);
      const energyBal = await blockchainService.getEnergyBalance(address);
      setTokenBalance(tokenBal);
      setEnergyBalance(energyBal);
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    }
  }, []);

  const buyEnergy = useCallback(async (amount) => {
    if (!isConnected) throw new Error('Not connected');
    setLoading(true);
    setError(null);
    try {
      const txHash = await blockchainService.buyEnergy(amount);
      await refreshBalances(walletAddress);
      return txHash;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isConnected, walletAddress, refreshBalances]);

  const sellEnergy = useCallback(async (amount) => {
    if (!isConnected) throw new Error('Not connected');
    setLoading(true);
    setError(null);
    try {
      const txHash = await blockchainService.sellEnergy(amount);
      await refreshBalances(walletAddress);
      return txHash;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isConnected, walletAddress, refreshBalances]);

  const placeOrder = useCallback(async (amount, price, isBuyOrder) => {
    if (!isConnected) throw new Error('Not connected');
    setLoading(true);
    setError(null);
    try {
      const txHash = await blockchainService.placeOrder(amount, price, isBuyOrder);
      return txHash;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  const getDynamicPrice = useCallback(async (amount) => {
    try {
      return await blockchainService.getDynamicPrice(amount);
    } catch (err) {
      console.error('Failed to get price:', err);
      return '0';
    }
  }, []);

  const swapEnergyForETH = useCallback(async (amount) => {
    if (!isConnected) throw new Error('Not connected');
    setLoading(true);
    setError(null);
    try {
      const txHash = await blockchainService.swapEnergyForETH(amount);
      await refreshBalances(walletAddress);
      return txHash;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isConnected, walletAddress, refreshBalances]);

  useEffect(() => {
    blockchainService.onAccountsChanged((accounts) => {
      if (accounts.length === 0) {
        setIsConnected(false);
        setWalletAddress('');
        setTokenBalance('0');
        setEnergyBalance('0');
      } else {
        setWalletAddress(accounts[0]);
        refreshBalances(accounts[0]);
      }
    });

    blockchainService.onChainChanged(() => {
      window.location.reload();
    });
  }, [refreshBalances]);

  const subscribeToEnergyEvents = useCallback((onEnergyBought, onEnergySold) => {
    blockchainService.subscribeToEnergyEvents(onEnergyBought, onEnergySold);
  }, []);

  const unsubscribeFromEnergyEvents = useCallback(() => {
    blockchainService.unsubscribeFromEnergyEvents();
  }, []);

  return {
    isConnected,
    walletAddress,
    tokenBalance,
    energyBalance,
    loading,
    error,
    isContractsConfigured,
    connect,
    buyEnergy,
    sellEnergy,
    placeOrder,
    getDynamicPrice,
    swapEnergyForETH,
    refreshBalances,
    subscribeToEnergyEvents,
    unsubscribeFromEnergyEvents
  };
};

export default useBlockchain;
