"use client";

import React, { useState } from 'react';
import { useFreighter } from '@/hooks/useFreighter';
import { useAccount } from '@/hooks/useAccount';
import { logger } from '@/lib/logger';

export default function MessageSigning() {
  const { account } = useAccount();
  const { signMessage, signBlob, isLoading, error } = useFreighter();

  const [message, setMessage] = useState('');
  const [blob, setBlob] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [blobSignature, setBlobSignature] = useState<string | null>(null);
  const [signerAddress, setSignerAddress] = useState<string | null>(null);

  const handleSignMessage = async () => {
    if (!message || !account) return;

    try {
      setSignature(null);
      setSignerAddress(null);

      const result = await signMessage(message, account.address);
      setSignature(result.signedMessage);
      setSignerAddress(result.signerAddress);

      logger.info('MessageSigning', 'Message signed successfully', {
        messageLength: message.length,
        signerAddress: result.signerAddress
      });
    } catch (error: unknown) {
      logger.error('MessageSigning', 'Failed to sign message', error);
    }
  };

  const handleSignBlob = async () => {
    if (!blob || !account) return;

    try {
      setBlobSignature(null);
      setSignerAddress(null);

      const result = await signBlob(blob, account.address);
      setBlobSignature(result.signedBlob);
      setSignerAddress(result.signerAddress);

      logger.info('MessageSigning', 'Blob signed successfully', {
        blobLength: blob.length,
        signerAddress: result.signerAddress
      });
    } catch (error: unknown) {
      logger.error('MessageSigning', 'Failed to sign blob', error);
    }
  };

  const encodeToBase64 = (str: string): string => {
    try {
      return btoa(str);
    } catch {
      return '';
    }
  };

  const decodeFromBase64 = (str: string): string => {
    try {
      return atob(str);
    } catch {
      return str;
    }
  };

  if (!account) return null;

  return (
    <div className="space-y-6 p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">Message & Data Signing</h3>

      {/* Message Signing */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Sign Text Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter message to sign..."
          className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
          rows={3}
        />
        <button
          onClick={handleSignMessage}
          disabled={!message || isLoading}
          className="w-full py-2 px-4 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 font-medium rounded-lg transition-all duration-200 border border-cyan-500/30 hover:border-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing...' : 'Sign Message'}
        </button>

        {signature && (
          <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-400 mb-2">Message signed successfully!</p>
            <p className="text-xs text-gray-400 mb-1">
              <span className="font-medium">Signer:</span> {signerAddress?.slice(0, 10)}...{signerAddress?.slice(-10)}
            </p>
            <p className="text-xs text-gray-400 mb-2">
              <span className="font-medium">Signature (Base64):</span>
            </p>
            <div className="p-2 bg-gray-900/50 rounded border border-gray-700/50 break-all">
              <code className="text-xs text-cyan-300">{signature}</code>
            </div>
          </div>
        )}
      </div>

      {/* Blob Signing */}
      <div className="space-y-3 pt-4 border-t border-gray-700/50">
        <label className="block text-sm font-medium text-gray-300">
          Sign Data (Blob)
        </label>
        <textarea
          value={blob}
          onChange={(e) => setBlob(e.target.value)}
          placeholder="Enter data to sign (will be encoded as base64)..."
          className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600/50 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all"
          rows={3}
        />
        <div className="flex gap-2">
          <button
            onClick={() => setBlob(encodeToBase64(blob))}
            disabled={!blob}
            className="flex-1 py-2 px-4 bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-all duration-200"
          >
            Encode to Base64
          </button>
          <button
            onClick={() => setBlob(decodeFromBase64(blob))}
            disabled={!blob}
            className="flex-1 py-2 px-4 bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-all duration-200"
          >
            Decode from Base64
          </button>
        </div>
        <button
          onClick={handleSignBlob}
          disabled={!blob || isLoading}
          className="w-full py-2 px-4 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 font-medium rounded-lg transition-all duration-200 border border-purple-500/30 hover:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing...' : 'Sign Blob'}
        </button>

        {blobSignature && (
          <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-400 mb-2">Blob signed successfully!</p>
            <p className="text-xs text-gray-400 mb-1">
              <span className="font-medium">Signer:</span> {signerAddress?.slice(0, 10)}...{signerAddress?.slice(-10)}
            </p>
            <p className="text-xs text-gray-400 mb-2">
              <span className="font-medium">Signature (Base64):</span>
            </p>
            <div className="p-2 bg-gray-900/50 rounded border border-gray-700/50 break-all">
              <code className="text-xs text-purple-300">{blobSignature}</code>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">Error: {error}</p>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-300">
          <span className="font-medium">Note:</span> Signing proves ownership of the private key without revealing it.
          The signature can be verified against your public address.
        </p>
      </div>
    </div>
  );
}