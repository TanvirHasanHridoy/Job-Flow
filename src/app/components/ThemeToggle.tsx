'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
    setTheme(saved);
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else if (newTheme === 'dark') {
      document.documentElement.classList.remove('light');
    } else {
      // System
      const matches = window.matchMedia('(prefers-color-scheme: light)').matches;
      if (matches) {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    }
  };

  const cycleTheme = () => {
    if (theme === 'dark') applyTheme('light');
    else if (theme === 'light') applyTheme('system');
    else applyTheme('dark');
  };

  if (!mounted) {
    return <div className="w-8 sm:w-24 h-8 rounded-xl bg-white/5 border border-white/5 animate-pulse" />;
  }

  return (
    <>
      {/* Mobile Compact Single Button (sm:hidden) */}
      <button
        type="button"
        onClick={cycleTheme}
        className="sm:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center no-print shrink-0"
        title={`Current theme: ${theme}. Tap to toggle.`}
      >
        {theme === 'light' ? (
          <Sun className="w-4 h-4 text-amber-400" />
        ) : theme === 'dark' ? (
          <Moon className="w-4 h-4 text-indigo-400" />
        ) : (
          <Laptop className="w-4 h-4 text-zinc-300" />
        )}
      </button>

      {/* Desktop 3-Button Pill (hidden sm:flex) */}
      <div className="hidden sm:flex items-center gap-0.5 bg-white/5 p-1 rounded-xl border border-white/5 no-print shrink-0">
        <button
          type="button"
          onClick={() => applyTheme('light')}
          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
            theme === 'light' 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          title="Light Mode"
        >
          <Sun className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyTheme('dark')}
          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
            theme === 'dark' 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          title="Dark Mode"
        >
          <Moon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => applyTheme('system')}
          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
            theme === 'system' 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
          title="System Mode"
        >
          <Laptop className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
}
