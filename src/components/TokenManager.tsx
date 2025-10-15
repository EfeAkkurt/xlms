"use client";

import React, { useState } from 'react';
import { useFreighter } from '@/hooks/useFreighter';
import { useAccount } from '@/hooks/useAccount';
import { logger } from '@/lib/logger';

export default function TokenManager() {
  const { account } = useAccount();
  const { network, addToken, isLoading, error } = useFreighter();

  const [contractId, setContractId] = useState('');
  const [addedToken, setAddedToken] = useState<string | null>(null);

  const handleAddToken = async () => {
    if (!contractId || !account || !network) return;

    try {
      setAddedToken(null);

      const result = await addToken(contractId, network.passphrase);
      setAddedToken(result);
      setContractId('');

      logger.info('TokenManager', 'Token added successfully', {
        contractId: result,
        network: network.name
      });
    } catch (error: unknown) {
      logger.error('TokenManager', 'Failed to add token', error);
    }
  };

  // Example token contracts for testing
  const exampleTokens = [
    {
      name: 'USDC Testnet',
      contractId: 'CDLZFC3SYJYDZT7K67VY751LEV6G3IZ5WYDJGHQUFOQHTB4L42SGRKFS',
      network: 'TESTNET'
    },
    {
      name: 'EURC Testnet',
      contractId: 'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOCPFY6RQKIAB',
      network: 'TESTNET'
    },
    {
      name: 'Custom Token',
      contractId: '',
      network: ''
    }
  ];

  if (!account) return null;

  return (
    <div className="space-y-6 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">Soroban Token Manager</h3>

      {/* Add Token */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Add Soroban Token to Wallet
        </label>

        <input
          type="text"
          value={contractId}
          onChange={(e) => setContractId(e.target.value)}
          placeholder="Enter token contract ID..."
          className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono text-sm"
        />

        {/* Example Tokens */}
        <div className="space-y-2">
          <p className="text-xs text-gray-400">Example tokens (Testnet):</p>
          <div className="grid gap-2">
            {exampleTokens.map((token, index) => (
              <button
                key={index}
                onClick={() => setContractId(token.contractId)}
                className="text-left px-3 py-2 bg-gray-900/30 hover:bg-gray-900/50 border border-gray-700/50 rounded-lg transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-200 group-hover:text-cyan-400">
                      {token.name}
                    </p>
                    {token.contractId && (
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        {token.contractId.slice(0, 20)}...{token.contractId.slice(-10)}
                      </p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleAddToken}
          disabled={!contractId || isLoading}
          className="w-full py-2 px-4 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-medium rounded-lg transition-all duration-200 border border-green-500/30 hover:border-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Adding Token...' : 'Add Token to Wallet'}
        </button>

        {addedToken && (
          <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-400 mb-1">Token added successfully!</p>
            <p className="text-xs text-gray-400">
              <span className="font-medium">Contract ID:</span> {addedToken}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Check your Freighter wallet to see the added token.
            </p>
          </div>
        )}
      </div>

      {/* Network Info */}
      {network && (
        <div className="pt-4 border-t border-gray-700/50">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Current Network</h4>
          <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Network:</span>
              <span className="text-sm font-medium text-cyan-400">{network.name}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Type:</span>
              <span className={`text-sm font-medium ${network.name === 'PUBLIC' ? 'text-green-400' : 'text-yellow-400'}`}>
                {network.name === 'PUBLIC' ? 'Mainnet' : 'Testnet'}
              </span>
            </div>
            {network.sorobanRpcUrl && (
              <div className="mt-2 pt-2 border-t border-gray-700/50">
                <span className="text-xs text-gray-500">Soroban RPC:</span>
                <p className="text-xs text-gray-400 mt-1 break-all">{network.sorobanRpcUrl}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">Error: {error}</p>
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-xs text-yellow-300">
          <span className="font-medium">Warning:</span> Only add tokens from trusted sources.
          Verify token contracts before adding them to your wallet.
        </p>
      </div>

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-300">
          <span className="font-medium">Info:</span> Soroban tokens are smart contracts on Stellar that
          represent custom assets. Once added, Freighter will track their balance and display them in your wallet.
        </p>
      </div>
    </div>
  );
}