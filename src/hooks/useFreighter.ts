"use client";

import { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  isConnected as freighterIsConnected,
  isAllowed as freighterIsAllowed,
  setAllowed as freighterSetAllowed,
  requestAccess,
  getAddress as freighterGetAddress,
  getNetworkDetails,
  signTransaction as freighterSignTransaction,
  signAuthEntry,
  signMessage as freighterSignMessage,
  addToken as freighterAddToken,
  WatchWalletChanges,
} from "@stellar/freighter-api";
import { logger } from '@/lib/logger';

interface UseFreighterReturn {
  // Detection
  isInstalled: boolean;
  isConnected: boolean;
  isAllowed: boolean;

  // Connection
  connect: () => Promise<string>;
  requestAccess: () => Promise<boolean>;

  // Network
  network: {
    name: string;
    passphrase: string;
    url: string;
    sorobanRpcUrl?: string;
  } | null;

  // Signing
  signTransaction: (xdr: string) => Promise<string>;
  signMessage: (message: string, address?: string) => Promise<{ signedMessage: string | null; signerAddress: string }>;
  signBlob: (blob: string, address?: string) => Promise<{ signedBlob: string | null; signerAddress: string }>;
  signAuthEntry: (authEntryXdr: string, address: string) => Promise<{ signedAuthEntry: Buffer | null; signerAddress: string }>;

  // Tokens
  addToken: (contractId: string, networkPassphrase?: string) => Promise<string>;

  // Loading states
  isLoading: boolean;
  error: string | null;
}

export function useFreighter(): UseFreighterReturn {
  const { publicKey, isConnected: reduxConnected } = useSelector((state: RootState) => state.wallet);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkInfo, setNetworkInfo] = useState<UseFreighterReturn['network']>(null);
  const [isAllowed, setIsAllowed] = useState(false);

  // Check if Freighter is installed - using direct API check
  const isInstalled = typeof freighterIsConnected === "function";

  // Connection state
  const isWalletConnected = isInstalled && reduxConnected && !!publicKey;

  // Check if app is allowed
  useEffect(() => {
    const checkAllowed = async () => {
      if (!isInstalled) {
        setIsAllowed(false);
        return;
      }

      try {
        const allowed = await freighterIsAllowed();
        setIsAllowed(allowed.isAllowed || false);
      } catch (error) {
        logger.error('useFreighter', 'Failed to check permissions', error);
        setIsAllowed(false);
      }
    };

    checkAllowed();
  }, [isInstalled]);

  // Connect to Freighter - simplified flow
  const connect = useCallback(async (): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isInstalled) {
        throw new Error('Freighter wallet not installed. Please install from https://freighter.app');
      }

      // Check if connected
      const connected = await freighterIsConnected();
      if (!connected.isConnected) {
        throw new Error('Please connect your Freighter wallet first');
      }

      // Request access and get address
      const accessResponse = await requestAccess();

      if (accessResponse.error) {
        throw new Error(accessResponse.error);
      }

      const pubKey = accessResponse.address;

      if (!pubKey || pubKey.length !== 56) {
        throw new Error('Invalid public key received');
      }

      // Get network info
      try {
        const network = await getNetworkDetails();
        setNetworkInfo({
          name: network.network || 'UNKNOWN',
          passphrase: network.networkPassphrase || '',
          url: network.networkUrl || '',
          sorobanRpcUrl: network.sorobanRpcUrl
        });
      } catch (networkError) {
        logger.warn('useFreighter', 'Failed to get network info', networkError);
      }

      logger.wallet('useFreighter', 'Connected successfully', pubKey);
      return pubKey;
    } catch (err: unknown) {
      const error = err as Error;
      logger.error('useFreighter', 'Connection failed', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isInstalled]);

  // Request permission - simplified
  const requestAccessFn = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isInstalled) {
        throw new Error('Freighter wallet not installed');
      }

      const result = await freighterSetAllowed();
      const allowed = result.isAllowed || false;

      logger.info('useFreighter', 'Permission request result', { allowed });
      return allowed;
    } catch (err: unknown) {
      const error = err as Error;
      logger.error('useFreighter', 'Permission request failed', error);
      setError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInstalled]);

  // Sign transaction
  const signTransaction = useCallback(async (xdr: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!xdr) {
        throw new Error('No transaction data to sign');
      }

      logger.info('useFreighter', "Signing transaction");

      const signedResult = await freighterSignTransaction(xdr);

      if (!signedResult) {
        throw new Error('Transaction signing was cancelled by user');
      }

      const signedXdr = typeof signedResult === 'string' ? signedResult : signedResult.signedTxXdr;

      if (!signedXdr) {
        throw new Error('No signed transaction received');
      }

      logger.info('useFreighter', "Transaction signed successfully");
      return signedXdr;
    } catch (err: unknown) {
      const error = err as Error;
      let errorMessage = error.message || 'Unknown error';

      if (errorMessage.includes('rejected') || errorMessage.includes('cancelled') || errorMessage.includes('denied')) {
        errorMessage = 'Transaction was rejected by user';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'Transaction timed out. Please try again.';
      }

      logger.error('useFreighter', 'Sign transaction failed', { error: errorMessage });
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign message
  const signMessage = useCallback(async (message: string, address?: string): Promise<{ signedMessage: string | null; signerAddress: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!message) {
        throw new Error('No message to sign');
      }

      const signerAddress = address || (await freighterGetAddress()).address;
      if (!signerAddress) {
        throw new Error('No signer address available');
      }

      logger.info('useFreighter', 'Signing message');

      const result = await freighterSignMessage(message, { address: signerAddress });

      if (result.error) {
        throw new Error(result.error);
      }

      // Convert Buffer to string if needed
      const signedMessage = result.signedMessage
        ? typeof result.signedMessage === 'string'
          ? result.signedMessage
          : result.signedMessage.toString('base64')
        : null;

      logger.info('useFreighter', 'Message signed successfully');
      return { signedMessage, signerAddress: result.signerAddress };
    } catch (err: unknown) {
      const error = err as Error;
      let errorMessage = error.message || 'Unknown error';

      if (errorMessage.includes('rejected') || errorMessage.includes('cancelled') || errorMessage.includes('denied')) {
        errorMessage = 'Message signing was rejected by user';
      }

      logger.error('useFreighter', 'Sign message failed', { error: errorMessage });
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sign blob (using message signing as fallback)
  const signBlob = useCallback(async (blob: string, address?: string) => {
    const result = await signMessage(blob, address);
    return {
      signedBlob: result.signedMessage,
      signerAddress: result.signerAddress
    };
  }, [signMessage]);

  // Sign auth entry
  const signAuthEntryFn = useCallback(async (authEntryXdr: string, address: string): Promise<{ signedAuthEntry: Buffer | null; signerAddress: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!authEntryXdr) {
        throw new Error('No auth entry to sign');
      }

      logger.info('useFreighter', 'Signing auth entry');

      const result = await signAuthEntry(authEntryXdr, { address });

      if (result.error) {
        throw new Error(result.error);
      }

      logger.info('useFreighter', 'Auth entry signed successfully');
      return result;
    } catch (err: unknown) {
      const error = err as Error;
      let errorMessage = error.message || 'Unknown error';

      if (errorMessage.includes('rejected') || errorMessage.includes('cancelled') || errorMessage.includes('denied')) {
        errorMessage = 'Auth entry signing was rejected by user';
      }

      logger.error('useFreighter', 'Sign auth entry failed', { error: errorMessage });
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add token
  const addToken = useCallback(async (contractId: string, networkPassphrase?: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!contractId) {
        throw new Error('No contract ID provided');
      }

      logger.info('useFreighter', 'Adding token', { contractId });

      const result = await freighterAddToken({ contractId, networkPassphrase });

      if (result.error) {
        throw new Error(result.error);
      }

      logger.info('useFreighter', 'Token added successfully', { contractId: result.contractId });
      return result.contractId;
    } catch (err: unknown) {
      const error = err as Error;
      let errorMessage = error.message || 'Unknown error';

      if (errorMessage.includes('rejected') || errorMessage.includes('cancelled') || errorMessage.includes('denied')) {
        errorMessage = 'Token addition was rejected by user';
      }

      logger.error('useFreighter', 'Add token failed', { error: errorMessage });
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize network info when connected
  useEffect(() => {
    const initializeNetwork = async () => {
      if (!isInstalled || !isWalletConnected) return;

      try {
        const network = await getNetworkDetails();
        setNetworkInfo({
          name: network.network || 'UNKNOWN',
          passphrase: network.networkPassphrase || '',
          url: network.networkUrl || '',
          sorobanRpcUrl: network.sorobanRpcUrl
        });
      } catch (error) {
        logger.error('useFreighter', 'Failed to get network info', error);
      }
    };

    initializeNetwork();
  }, [isInstalled, isWalletConnected]);

  return {
    isInstalled,
    isConnected: isWalletConnected,
    isAllowed,
    connect,
    requestAccess: requestAccessFn,
    network: networkInfo,
    signTransaction,
    signMessage,
    signBlob,
    signAuthEntry: signAuthEntryFn,
    addToken,
    isLoading,
    error
  };
}