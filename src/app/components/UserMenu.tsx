'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { LogOut, User, ChevronDown, Coins, Download, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTokens } from '@/context/TokenContext';
import Dialog from '@/app/components/Dialog';

interface UserData {
  email: string;
  name: string;
  avatar: string;
}

export default function UserMenu() {
  const [user, setUser] = useState<UserData | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  // "Delete my account" confirmation (type DELETE)
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { tokens, setIsTokenModalOpen } = useTokens();

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const hasDevCookie = typeof document !== 'undefined' && document.cookie.includes('jobmaster_dev_auth=');
      if (hasDevCookie) {
        setUser({
          email: 'dev@jobmaster.local',
          name: 'Dev Tester',
          avatar: '',
        });
        setLoading(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser({
          email: user.email || '',
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        });
      }
      setLoading(false);
    };

    getUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
        });
      } else {
        const hasDev = typeof document !== 'undefined' && document.cookie.includes('jobmaster_dev_auth=');
        if (!hasDev) setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/dev-logout', { method: 'POST' });
    } catch {}
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Your data could not be deleted.');
      }
      await handleSignOut();
    } catch (err: any) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
    );
  }

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all duration-200 group cursor-pointer"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full ring-2 ring-white/10 group-hover:ring-indigo-500/30 transition-all duration-200"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/10">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm text-zinc-300 font-medium hidden sm:inline max-w-[100px] truncate">
          {user.name}
        </span>
        
        {/* Header Token Badge */}
        {tokens !== null && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center gap-1">
            <Coins className="w-3 h-3 text-indigo-400" />
            {tokens}
          </span>
        )}

        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl backdrop-blur-xl bg-zinc-900/95 border border-white/10 shadow-2xl shadow-black/40 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full ring-2 ring-indigo-500/20"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--layout-backdrop-fg)] truncate">{user.name}</p>
                <p className="text-xs text-zinc-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Tokens Panel */}
          {tokens !== null && (
            <div className="px-4 py-3 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs text-zinc-400">Balance</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--layout-backdrop-fg)] bg-[var(--layout-surface-card-bg)] px-2 py-0.5 rounded border border-white/10">
                    {tokens} Tokens
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-1.5">
            <a
              href="/api/account"
              download
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:text-[var(--layout-backdrop-fg)] hover:bg-white/5 transition-all duration-200 cursor-pointer"
            >
              <Download className="w-4 h-4 text-zinc-500" />
              Download my data
            </a>
            <button
              onClick={() => { setOpen(false); setDeleteText(''); setDeleteError(null); setDeleteOpen(true); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 group cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-zinc-500 group-hover:text-red-400 transition-colors" />
              Delete my account
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:text-[var(--layout-backdrop-fg)] hover:bg-red-500/10 transition-all duration-200 group cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-red-400 transition-colors" />
              Sign out
            </button>
          </div>
        </div>
      )}

      {deleteOpen && (
        <Dialog onClose={() => setDeleteOpen(false)} label="Delete account" className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-zinc-900 p-6 shadow-2xl space-y-4 text-left">
            <div>
              <h3 className="text-lg font-bold text-white">Delete your account data?</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                This permanently deletes your Master Vault, all applications and generated documents, drafts,
                AI logs and your token balance. It cannot be undone. Consider downloading your data first.
              </p>
              <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                Your sign-in (Google / GitHub / LinkedIn) is not removed by this; contact support to close it completely.
              </p>
            </div>
            <label className="block text-xs text-zinc-300">
              Type <strong className="text-red-300">DELETE</strong> to confirm
              <input
                value={deleteText}
                onChange={e => setDeleteText(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-zinc-950 border border-white/10 text-sm text-white"
                autoFocus
              />
            </label>
            {deleteError && <p className="text-xs text-red-300">{deleteError}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg border border-white/10 text-sm text-zinc-300 hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteText !== 'DELETE' || deleting}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-semibold text-white disabled:opacity-40 cursor-pointer"
              >
                {deleting ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

