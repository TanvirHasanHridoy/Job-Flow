'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { X, Sparkles, Coins, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TokenContextType {
  tokens: number | null;
  loading: boolean;
  isTokenModalOpen: boolean;
  setIsTokenModalOpen: (open: boolean) => void;
  fetchTokens: () => Promise<void>;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const supabase = createClient();

  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/tokens');
      if (res.ok) {
        const data = await res.json();
        setTokens(data.tokens);
      }
    } catch (err) {
      console.error('Failed to fetch tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  // Listen for user sign-in/out to fetch tokens
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
        fetchTokens();
      } else {
        setIsAuthenticated(false);
        setTokens(null);
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        fetchTokens();
      } else {
        setIsAuthenticated(false);
        setTokens(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <TokenContext.Provider
      value={{
        tokens,
        loading,
        isTokenModalOpen,
        setIsTokenModalOpen,
        fetchTokens,
      }}
    >
      {children}

      {/* Global Warning Modal */}
      {isTokenModalOpen && isAuthenticated && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl glass-panel border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200 bg-zinc-900/90 text-left">
            
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

            <div className="p-6 relative z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                    <AlertCircle className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-sans">Insufficient Tokens</h3>
                    <p className="text-xs text-zinc-400">LLM Limit Reached</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTokenModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Message */}
              <div className="space-y-3.5 mb-6 text-sm text-zinc-300">
                <p>
                  You do not have enough tokens remaining to perform this AI operation. 
                </p>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-zinc-500" />
                    Your Current Balance
                  </span>
                  <span className="font-bold text-zinc-200 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-white/10">
                    {tokens !== null ? `${tokens} Tokens` : '0 Tokens'}
                  </span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Tokens control your access to JobFlow's tailoring and import operations. Please contact support or your administrator to top up your token balance.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setIsTokenModalOpen(false)}
                  className="relative w-full py-3 px-4 font-semibold text-sm text-white rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 hover:scale-[1.01] hover:shadow-lg hover:shadow-indigo-500/10 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 group overflow-hidden"
                >
                  Close & Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TokenContext.Provider>
  );
}

export function useTokens() {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error('useTokens must be used within a TokenProvider');
  }
  return context;
}
