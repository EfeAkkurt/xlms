"use client";

import React, { useState, useEffect } from 'react';
import { isConnected as checkIsConnected, setAllowed, requestAccess } from '@stellar/freighter-api';
import { logger } from '@/lib/logger';

export default function ConnectWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const connected = await checkIsConnected();
      setIsConnected(connected.isConnected);

      if (connected.isConnected) {
        const accessResponse = await requestAccess();
        if (accessResponse.address) {
          setPublicKey(accessResponse.address);
        }
      }
    } catch (err) {
      logger.error('ConnectWallet', 'Failed to check connection', err);
    }
  };

  
  const handleSetAllowed = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await setAllowed();

      if (result.isAllowed) {
        await checkConnection();
      } else {
        setError('Permission denied. Please allow access to your Freighter wallet.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      logger.error('ConnectWallet', 'Permission request failed', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center max-w-xs">
      {publicKey && (
        <div className="text-sm text-green-400 bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20 w-full mb-4">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Connected: {publicKey.slice(0, 4)}...{publicKey.slice(-4)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20 w-full mb-4">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {!publicKey && (
        <button
          onClick={handleSetAllowed}
          disabled={isLoading}
          className="group relative w-full py-3 px-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:scale-[1.02] hover:brightness-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/25"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
          {isLoading ? (
            <>
              <div className="relative w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="relative">Connecting...</span>
            </>
          ) : (
            <>
              <svg className="relative w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="relative">Connect Wallet</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}