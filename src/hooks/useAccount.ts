"use client";

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { connectWallet, disconnectWallet, fetchBalance } from '@/store/walletSlice';
import {
  hasFreighter,
  isConnected,
  getAddress,
  getFreighterUserInfo,
  getFreighterNetwork,
  createWalletWatcher,
  WatchWalletChanges
} from '@/lib/wallet/freighter';
import { logger } from '@/lib/logger';
import { AppDispatch } from '@/store';

interface AccountInfo {
  address: string;
  displayName: string;
  network: string;
  networkPassphrase: string;
  isTestnet: boolean;
}

interface UseAccountReturn {
  account: AccountInfo | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
}

// Cache to prevent unnecessary re-renders
let addressCache: string | undefined;
let addressLookup: Promise<string | null> | null = null;
let walletWatcher: WatchWalletChanges | null = null;

const accountObject = { address: '', displayName: '', network: '', networkPassphrase: '', isTestnet: false };

const addressToHistoricObject = async (addr: string): Promise<AccountInfo> => {
  accountObject.address = addr;
  accountObject.displayName = `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  // Set default network information without making network calls
  accountObject.network = 'UNKNOWN';
  accountObject.networkPassphrase = '';
  accountObject.isTestnet = true;

  return { ...accountObject };
};

export function useAccount(): UseAccountReturn {
  const dispatch = useDispatch<AppDispatch>();
  const { isConnected: reduxConnected, publicKey, isLoading: reduxLoading, error: reduxError } = useSelector((state: RootState) => state.wallet);

  const [mounted, setMounted] = useState(false);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);

    // Cleanup wallet watcher on unmount
    return () => {
      if (walletWatcher) {
        walletWatcher.stop();
        walletWatcher = null;
      }
    };
  }, []);

  // Check connection and get account info
  useEffect(() => {
    if (!mounted) return;

    const checkConnection = async () => {
      try {
        if (!hasFreighter()) {
          setIsLoading(false);
          return;
        }

        if (reduxConnected && publicKey) {
          const accountInfo = await addressToHistoricObject(publicKey);
          setAccount(accountInfo);
          setIsLoading(false);
          return;
        }

        // Check if Freighter is connected
        const connected = await isConnected();
        if (!connected.isConnected) {
          setIsLoading(false);
          return;
        }

        // Get address if not cached
        if (!addressCache) {
          if (!addressLookup) {
            addressLookup = (async () => {
              try {
                const userInfo = await getFreighterUserInfo();
                return userInfo?.publicKey || null;
              } catch (error) {
                logger.error('useAccount', 'Failed to get user info', error);
                return null;
              }
            })();
          }

          const addr = await addressLookup;
          addressCache = addr || undefined;
          addressLookup = null;

          if (addr) {
            // Connect to Redux store
            dispatch(connectWallet(addr));

            // Fetch balance
            try {
              await dispatch(fetchBalance(addr)).unwrap();
            } catch (balanceError) {
              logger.warn('useAccount', 'Could not fetch balance', balanceError);
            }
          }
        }

        if (addressCache) {
          const accountInfo = await addressToHistoricObject(addressCache);
          setAccount(accountInfo);
        }

        setIsLoading(false);
      } catch (err: unknown) {
        const error = err as Error;
        logger.error('useAccount', 'Failed to check connection', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [mounted, reduxConnected, publicKey, dispatch]);

  // Skip wallet watcher to prevent network errors
  useEffect(() => {
    if (!mounted || !account) return;

    // Wallet watcher disabled to prevent continuous network calls
    // and errors. Basic functionality works without it.
  }, [mounted, account]);

  const connect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!hasFreighter()) {
        throw new Error('Freighter wallet not installed. Please install from https://freighter.app');
      }

      // Check if already connected
      const connected = await isConnected();
      if (!connected.isConnected) {
        throw new Error('Please connect your Freighter wallet first');
      }

      // Get address
      const addressResponse = await getAddress();
      if (!addressResponse.address) {
        throw new Error('Failed to get wallet address');
      }

      const addr = addressResponse.address;
      addressCache = addr;

      // Connect to Redux store
      dispatch(connectWallet(addr));

      // Fetch balance
      try {
        await dispatch(fetchBalance(addr)).unwrap();
      } catch (balanceError) {
        logger.warn('useAccount', 'Could not fetch balance', balanceError);
      }

      // Update account info
      const accountInfo = await addressToHistoricObject(addr);
      setAccount(accountInfo);

      logger.wallet('useAccount', 'Connected successfully', addr);
    } catch (err: unknown) {
      const error = err as Error;
      logger.error('useAccount', 'Connection failed', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    if (walletWatcher) {
      walletWatcher.stop();
      walletWatcher = null;
    }

    addressCache = undefined;
    addressLookup = null;
    setAccount(null);
    setError(null);
    setIsLoading(false);

    dispatch(disconnectWallet());
    logger.wallet('useAccount', 'Disconnected');
  };

  const refresh = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    try {
      await dispatch(fetchBalance(publicKey)).unwrap();
      const accountInfo = await addressToHistoricObject(publicKey);
      setAccount(accountInfo);
      logger.info('useAccount', 'Account refreshed');
    } catch (error) {
      logger.error('useAccount', 'Refresh failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    account,
    isConnected: reduxConnected && !!account,
    isLoading: isLoading || reduxLoading,
    error: error || reduxError,
    connect,
    disconnect,
    refresh,
  };
}