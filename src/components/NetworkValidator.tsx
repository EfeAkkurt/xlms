"use client";

import { useState, useEffect } from 'react';
import { getFreighterNetwork } from '@/lib/wallet/freighter';
import { logger } from '@/lib/logger';

type WindowWithFreighter = Window & {
  freighterApi?: {
    isConnected: () => Promise<{ isConnected: boolean; error?: string }>;
    isAllowed: () => Promise<{ isAllowed: boolean; error?: string }>;
    setAllowed: () => Promise<{ isAllowed: boolean; error?: string }>;
    requestAccess: () => Promise<{ address: string; error?: string }>;
    getAddress: () => Promise<{ address: string; error?: string }>;
    getUserInfo: () => Promise<{ publicKey: string; publicKeySignature?: string }>;
    getNetworkDetails: () => Promise<{
      network: string;
      networkUrl: string;
      networkPassphrase: string;
      sorobanRpcUrl?: string;
    }>;
    signTransaction: (xdr: string, opts?: { network?: string }) => Promise<string>;
    signAuthEntry: (authEntryXdr: string, opts: { address: string }) => Promise<{
      signedAuthEntry: Buffer | null;
      signerAddress: string;
    }>;
    signMessage: (message: string, opts: { address: string }) => Promise<{
      signedMessage: string | null;
      signerAddress: string;
    }>;
    signBlob: (opts: { address: string; blob: string }) => Promise<{
      signedBlob: string | null;
      signerAddress: string;
    }>;
    addToken: (opts: { contractId: string; networkPassphrase?: string }) => Promise<{
      contractId: string;
      error?: string;
    }>;
  };
}

const EXPECTED_NETWORK = (process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'TESTNET').toUpperCase();

const NETWORK_CONFIG = {
  PUBLIC: {
    name: 'Public Network',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    horizon: 'https://horizon.stellar.org',
    friendbot: null
  },
  TESTNET: {
    name: 'Test Network',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    horizon: 'https://horizon-testnet.stellar.org',
    friendbot: 'https://friendbot.stellar.org'
  },
  FUTURENET: {
    name: 'Future Network',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    horizon: 'https://horizon-futurenet.stellar.org',
    friendbot: 'https://friendbot-futurenet.stellar.org'
  },
  SANDBOX: {
    name: 'Sandbox',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    horizon: 'http://localhost:8000',
    friendbot: null
  }
};

export default function NetworkValidator() {
  const [currentNetwork, setCurrentNetwork] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkNetwork = async () => {
    setIsLoading(true);
    try {
      // First check if Freighter is installed
      if (typeof window === 'undefined' || !(window as WindowWithFreighter).freighterApi) {
        setCurrentNetwork('NOT_INSTALLED');
        setIsCorrect(false);
        logger.warn('NetworkValidator', 'Freighter not installed');
        return;
      }

      const details = await getFreighterNetwork();
      const network = details.network?.toUpperCase() || 'UNKNOWN';
      setCurrentNetwork(network);

      const correct = network === EXPECTED_NETWORK;
      setIsCorrect(correct);

      if (!correct) {
        logger.warn('NetworkValidator', 'Network mismatch detected', {
          current: network,
          expected: EXPECTED_NETWORK
        });
      }

      logger.info('NetworkValidator', 'Network checked', {
        current: network,
        expected: EXPECTED_NETWORK,
        isCorrect: correct
      });

    } catch (error: unknown) {
      const err = error as Error;
      logger.error('NetworkValidator', 'Failed to check network', err);

      // Check if error is about Freighter not being installed
      if (err.message.includes('not found') || err.message.includes('not installed')) {
        setCurrentNetwork('NOT_INSTALLED');
      } else {
        setCurrentNetwork('ERROR');
      }
      setIsCorrect(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkNetwork();

    // Check network every 10 seconds
    const interval = setInterval(checkNetwork, 10000);
    return () => clearInterval(interval);
  }, []);

  const networkConfig = NETWORK_CONFIG[currentNetwork as keyof typeof NETWORK_CONFIG] || NETWORK_CONFIG.TESTNET;
  const expectedConfig = NETWORK_CONFIG[EXPECTED_NETWORK as keyof typeof NETWORK_CONFIG] || NETWORK_CONFIG.TESTNET;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <div className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin"></div>
        <span>Checking network...</span>
      </div>
    );
  }

  if (isCorrect) {
    return (
      <div className={`flex items-center gap-2 text-xs ${networkConfig.color} ${networkConfig.bgColor} px-3 py-1.5 rounded-full border ${networkConfig.borderColor}`}>
        <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
        <span className="font-medium">{networkConfig.name}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {currentNetwork === 'NOT_INSTALLED' ? (
        <div className="flex items-center gap-2 text-xs p-3 rounded-xl border border-red-500/20 bg-red-500/10">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-red-400">Freighter not installed</span>
        </div>
      ) : (
        <div
          className="flex items-center justify-between gap-2 text-xs p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/10 cursor-pointer hover:bg-yellow-500/20 transition-colors"
          onClick={() => setShowInstructions(!showInstructions)}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <span className="text-yellow-400 font-medium">Network Mismatch</span>
              <span className="text-gray-400 ml-2">
                {currentNetwork} → {EXPECTED_NETWORK}
              </span>
            </div>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${showInstructions ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}

      {showInstructions && (
        <div className="text-xs space-y-3 p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
          {currentNetwork !== 'NOT_INSTALLED' && (
            <div>
              <p className="text-gray-300 font-medium mb-2">How to switch networks in Freighter:</p>
              <ol className="space-y-2 text-gray-400">
                <li className="flex gap-2">
                  <span className="text-cyan-400 font-bold">1.</span>
                  <span>Click the Freighter icon in your browser</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-400 font-bold">2.</span>
                  <span>Go to Settings (gear icon)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-400 font-bold">3.</span>
                  <span>Select &quot;Change Network&quot;</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-400 font-bold">4.</span>
                  <span>Choose <span className="text-cyan-400 font-mono">{expectedConfig.name}</span></span>
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-400 font-bold">5.</span>
                  <span>Return to this page and refresh</span>
                </li>
              </ol>
            </div>
          )}

          {currentNetwork === 'NOT_INSTALLED' && (
            <div className="pt-2 border-t border-gray-700">
              <p className="text-gray-300 mb-2">Freighter wallet is required:</p>
              <a
                href="https://freighter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Install Freighter Wallet →
              </a>
            </div>
          )}

          {currentNetwork !== 'NOT_INSTALLED' && expectedConfig.friendbot && (
            <div className="pt-2 border-t border-gray-700">
              <p className="text-gray-300 mb-1">Need test XLM?</p>
              <a
                href={expectedConfig.friendbot}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Get Test XLM from Friendbot →
              </a>
            </div>
          )}

          <button
            onClick={checkNetwork}
            className="w-full py-2 px-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors border border-cyan-500/20 hover:border-cyan-500/30"
          >
            Re-check Network
          </button>
        </div>
      )}
    </div>
  );
}