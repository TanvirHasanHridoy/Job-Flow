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
    <header className="no-print sticky top-0 z-50 glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
            J
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white via-zinc-200 to-indigo-300 bg-clip-text text-transparent">
            JobFlow <span className="text-indigo-400 font-extrabold text-xs tracking-wider uppercase ml-1 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">AI</span>
          </span>
        </Link>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/dashboard" 
            className={`text-sm font-medium transition-colors duration-200 ${
              pathname === '/dashboard' ? 'text-[var(--foreground)] font-semibold' : 'text-zinc-400 hover:text-[var(--foreground)]'
            }`}
          >
            Dashboard
          </Link>
          <Link 
            href="/profile" 
            className={`text-sm font-medium transition-colors duration-200 ${
              pathname === '/profile' ? 'text-[var(--foreground)] font-semibold' : 'text-zinc-400 hover:text-[var(--foreground)]'
            }`}
          >
            Master Profile Vault
          </Link>
          <Link 
            href="/tailor" 
            className="px-4 py-2 text-xs font-semibold rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-300 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Tailor Workspace
          </Link>
        </nav>
        
        <ThemeToggle />
        <UserMenu />

        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-[var(--foreground)] hover:bg-white/5 transition-all cursor-pointer"
          title="Toggle Navigation"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Navigation Drawer */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#0a061b]/95 backdrop-blur-md border-b border-white/5 p-5 flex flex-col gap-3.5 md:hidden z-40 animate-in slide-in-from-top duration-200 shadow-2xl">
          <Link 
            href="/dashboard"
            onClick={() => setMenuOpen(false)}
            className={`text-sm font-medium p-2.5 rounded-xl hover:bg-white/5 transition-colors ${
              pathname === '/dashboard' ? 'text-[var(--foreground)] font-semibold bg-white/5' : 'text-zinc-400'
            }`}
          >
            Dashboard
          </Link>
          <Link 
            href="/profile"
            onClick={() => setMenuOpen(false)}
            className={`text-sm font-medium p-2.5 rounded-xl hover:bg-white/5 transition-colors ${
              pathname === '/profile' ? 'text-[var(--foreground)] font-semibold bg-white/5' : 'text-zinc-400'
            }`}
          >
            Master Profile Vault
          </Link>
          <Link 
            href="/tailor"
            onClick={() => setMenuOpen(false)}
            className="px-4 py-3 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Tailor Workspace
          </Link>
        </div>
      )}
    </header>
  );
}
