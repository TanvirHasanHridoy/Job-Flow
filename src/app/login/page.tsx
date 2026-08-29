'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';

type Provider = 'google' | 'github' | 'linkedin_oidc';

interface ProviderConfig {
  id: Provider;
  name: string;
  icon: React.ReactNode;
  bgClass: string;
  hoverClass: string;
  scopes?: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'google',
    name: 'Google',
    bgClass: 'bg-white text-zinc-900',
    hoverClass: 'hover:bg-zinc-100',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: 'github',
    name: 'GitHub',
    bgClass: 'bg-zinc-800 text-white border border-zinc-700',
    hoverClass: 'hover:bg-zinc-700',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
      </svg>
    ),
  },
  {
    id: 'linkedin_oidc',
    name: 'LinkedIn',
    bgClass: 'bg-[#0A66C2] text-white',
    hoverClass: 'hover:bg-[#084e96]',
    scopes: 'openid profile email',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
];

export default function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const [isDevLoggingIn, setIsDevLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (provider: ProviderConfig) => {
    setLoadingProvider(provider.id);
    setError(null);

    const supabase = createClient();

    const options: any = {
      redirectTo: `${window.location.origin}/auth/callback`,
    };

    if (provider.scopes) {
      options.scopes = provider.scopes;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider.id,
      options,
    });

    if (error) {
      setError(error.message);
      setLoadingProvider(null);
    }
  };

  const handleDevQuickLogin = async () => {
    setIsDevLoggingIn(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/dev-login', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        setError('Failed to create dev session');
        setIsDevLoggingIn(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Dev login failed');
      setIsDevLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full flex items-center justify-center relative overflow-x-hidden bg-[var(--layout-backdrop-bg)]">
      {/* Animated background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none max-w-full">
        <div className="absolute -top-40 -left-40 w-[min(600px,80vw)] h-[min(600px,80vw)] rounded-full bg-indigo-600/15 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[min(500px,70vw)] h-[min(500px,70vw)] rounded-full bg-purple-600/15 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(300px,50vw)] h-[min(300px,50vw)] rounded-full bg-cyan-600/10 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 overflow-hidden opacity-[0.03] pointer-events-none max-w-full" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4 px-2">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
              J
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-white via-zinc-200 to-indigo-300 bg-clip-text text-transparent">
              JobFlow <span className="text-indigo-400 font-extrabold text-sm tracking-wider uppercase ml-1 px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20">AI</span>
            </span>
          </Link>
          <p className="text-zinc-400 text-sm max-w-xs mx-auto leading-relaxed">
            AI-powered CV &amp; Cover Letter tailoring for international job markets
          </p>
        </div>

        {/* Glass card */}
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/20">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-zinc-400 text-sm">Choose your sign-in method</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleLogin(provider)}
                disabled={loadingProvider !== null || isDevLoggingIn}
                className={`w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer ${provider.bgClass} ${provider.hoverClass}`}
              >
                {loadingProvider === provider.id ? (
                  <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  provider.icon
                )}
                {loadingProvider === provider.id ? 'Signing in...' : `Continue with ${provider.name}`}
              </button>
            ))}
          </div>

          {/* Dev Mode Quick Login for Phone & LAN Testing */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={handleDevQuickLogin}
              disabled={isDevLoggingIn || loadingProvider !== null}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isDevLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                  <span>Logging in via Dev Quick Access...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>⚡ Quick Test Login (Mobile &amp; LAN Access)</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-zinc-500 mt-2">
              Instantly bypasses OAuth callback for direct testing on your phone or local IP server.
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-zinc-500 text-xs">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-zinc-600 text-xs">
            Secured by Supabase Authentication
          </p>
        </div>
      </div>
    </div>
  );
}
