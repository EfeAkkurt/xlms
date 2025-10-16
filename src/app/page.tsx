'use client';

import ConnectWallet from '@/components/ConnectWallet';
import NetworkStatus from '@/components/NetworkStatus';
import Transfer from '@/components/Transfer';
import TransactionHistory from '@/components/TransactionHistory';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export default function Home() {
  const { publicKey, isConnected } = useSelector((state: RootState) => state.wallet);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header with Logo and Connect */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                <img src="/favicon.svg" alt="XLMS Logo" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-lg sm:text-xl leading-tight">XLMS</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <NetworkStatus />
            <ConnectWallet />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          // Welcome Screen
          <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <div className="text-center max-w-4xl">
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8 sm:p-12 lg:p-16">
                <div className="flex justify-center mb-6 sm:mb-8">
                  <div className="relative group">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 flex items-center justify-center shadow-2xl shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all duration-300 transform group-hover:scale-105">
                      <img src="/favicon.svg" alt="XLMS Logo" className="w-full h-full object-contain drop-shadow-2xl" />
                    </div>
                  </div>
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-3 sm:mb-4">
                  XLMS
                </h1>
                <div className="text-gray-400 space-y-6">
                  <p className="text-lg">
                    Connect your wallet to get started
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
                    <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:bg-gray-800/70 hover:border-gray-600/50 transition-all duration-300">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-cyan-400/20 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                          </svg>
                        </div>
                        <h3 className="text-cyan-400 font-semibold">Send & Receive</h3>
                      </div>
                      <p className="text-sm text-gray-400">XLM transactions</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:bg-gray-800/70 hover:border-gray-600/50 transition-all duration-300">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-purple-400/20 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </div>
                        <h3 className="text-purple-400 font-semibold">Sign Messages</h3>
                      </div>
                      <p className="text-sm text-gray-400">Verify identity</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:bg-gray-800/70 hover:border-gray-600/50 transition-all duration-300">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-green-400/20 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        </div>
                        <h3 className="text-green-400 font-semibold">Soroban Tokens</h3>
                      </div>
                      <p className="text-sm text-gray-400">Smart contracts</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:bg-gray-800/70 hover:border-gray-600/50 transition-all duration-300">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                          </svg>
                        </div>
                        <h3 className="text-yellow-400 font-semibold">Real-time Balance</h3>
                      </div>
                      <p className="text-sm text-gray-400">Live updates</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:bg-gray-800/70 hover:border-gray-600/50 transition-all duration-300">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-pink-400/20 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                          </svg>
                        </div>
                        <h3 className="text-pink-400 font-semibold">Transaction History</h3>
                      </div>
                      <p className="text-sm text-gray-400">Complete records</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:bg-gray-800/70 hover:border-gray-600/50 transition-all duration-300">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-indigo-400/20 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                          </svg>
                        </div>
                        <h3 className="text-indigo-400 font-semibold">Multi-Asset</h3>
                      </div>
                      <p className="text-sm text-gray-400">Token support</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Wallet Interface
          <div className="space-y-8">
            {/* Account Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Account Address</h3>
                  <p className="text-sm text-gray-400 break-all font-mono">{publicKey}</p>
                </div>
              </div>
              <div className="space-y-6">
                <NetworkStatus />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <Transfer />
              </div>
              <div>
                <TransactionHistory />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <p className="text-gray-500 text-sm">
                Powered by{' '}
                <span className="text-cyan-400 font-medium">Stellar</span>
                {' '}•{' '}
                <span className="text-purple-400 font-medium">Soroban</span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="https://stellar.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-cyan-400 transition-colors text-sm"
              >
                Stellar.org
              </a>
              <a
                href="https://freighter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-purple-400 transition-colors text-sm"
              >
                Freighter
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}