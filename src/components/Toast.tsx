'use client';

import { useEffect } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

export default function Toast({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slideUp backdrop-blur-sm ${
        toast.type === 'success'
          ? 'bg-gradient-to-r from-green-500/90 to-emerald-500/90 text-white'
          : 'bg-gradient-to-r from-red-500/90 to-rose-500/90 text-white'
      }`}
    >
      <div className="flex-shrink-0">
        {toast.type === 'success' ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <span className="font-medium">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-auto hover:opacity-75 transition-opacity"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}