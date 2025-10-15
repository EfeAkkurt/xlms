'use client';

import { useFreighter } from '@/hooks/useFreighter';

export default function NetworkStatus() {
  const { network, isInstalled } = useFreighter();

  if (!isInstalled) {
    return (
      <div className="bg-red-900/20 border border-red-700/50 rounded-xl px-4 py-2">
        <p className="text-red-400 text-sm font-medium">Freighter Not Installed</p>
      </div>
    );
  }

  if (!network) {
    return (
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-2">
        <p className="text-gray-400 text-sm">Connecting...</p>
      </div>
    );
  }

  const isTestnet = network.name.toLowerCase().includes('test');

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-2">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isTestnet ? 'bg-yellow-400' : 'bg-green-400'} animate-pulse`}></div>
        <p className="text-sm">
          <span className="text-gray-400">Network:</span>{' '}
          <span className={`font-medium ${isTestnet ? 'text-yellow-400' : 'text-green-400'}`}>
            {network.name}
          </span>
        </p>
      </div>
    </div>
  );
}