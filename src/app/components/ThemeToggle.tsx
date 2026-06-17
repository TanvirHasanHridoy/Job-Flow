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

  if (!mounted) {
    return <div className="w-24 h-8 rounded-xl bg-white/5 border border-white/5 animate-pulse" />;
  }

  return (
    <div className="flex items-center gap-0.5 bg-white/5 p-1 rounded-xl border border-white/5 no-print">
      <button
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
  );
}
