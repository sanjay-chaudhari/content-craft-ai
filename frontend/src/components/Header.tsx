import React from 'react';
import { useAuth } from '../auth/AuthContext';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const username = user?.username || user?.attributes?.email || '';

  return (
    <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-bold text-white text-base tracking-tight">ContentCraft</span>
          <span className="hidden sm:inline text-xs text-slate-500 font-medium px-2 py-0.5 bg-slate-800 rounded-full">
            Powered by Amazon Nova
          </span>
        </div>

        <div className="flex items-center gap-3">
          {username && (
            <span className="hidden sm:block text-xs text-slate-400 truncate max-w-[160px]">{username}</span>
          )}
          <button
            onClick={() => signOut()}
            className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
