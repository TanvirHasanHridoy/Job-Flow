'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Sparkles } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';

const PUBLIC_ROUTES = ['/', '/login'];

export default function AppHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Don't render the header on public pages (landing, login)
  if (PUBLIC_ROUTES.includes(pathname)) {
    return null;
  }

  return (
    <header className="no-print sticky top-0 z-30 glass-panel border-b border-white/5 light:border-slate-200/80 px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-3 w-full bg-zinc-950/80 dark:bg-zinc-950/80 light:bg-white/80 backdrop-blur-xl transition-all">
      <div className="flex items-center gap-3 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-all duration-300 text-sm">
            J
          </div>
          <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-white via-zinc-200 to-indigo-300 light:from-slate-900 light:to-indigo-600 bg-clip-text text-transparent tracking-tight">
            JobFlow <span className="text-indigo-400 light:text-indigo-600 font-extrabold text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">AI</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          <Link
            href="/dashboard"
            className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${pathname === '/dashboard' ? 'text-indigo-400 light:text-indigo-600 font-bold' : 'text-zinc-400 hover:text-white light:text-slate-600 light:hover:text-slate-900'
              }`}
          >
            Dashboard
          </Link>
          <Link
            href="/profile"
            className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${pathname === '/profile' ? 'text-indigo-400 light:text-indigo-600 font-bold' : 'text-zinc-400 hover:text-white light:text-slate-600 light:hover:text-slate-900'
              }`}
          >
            Master Vault
          </Link>
          <Link
            href="/tailor"
            className="px-4 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all duration-200 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Tailor Workspace
          </Link>
        </nav>

        <div className="h-4 w-[1px] bg-white/10 light:bg-slate-200 hidden lg:block" />

        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
