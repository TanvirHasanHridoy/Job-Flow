'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, User, Sparkles } from 'lucide-react';

const PUBLIC_ROUTES = ['/', '/login'];

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on public pages or printable views
  if (PUBLIC_ROUTES.includes(pathname) || pathname === '/cv-preview') {
    return null;
  }

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard'
    },
    {
      label: 'Tailor AI',
      href: '/tailor',
      icon: Sparkles,
      isActive: pathname === '/tailor',
      isHero: true
    },
    {
      label: 'Profile Vault',
      href: '/profile',
      icon: User,
      isActive: pathname === '/profile'
    }
  ];

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="no-print fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-panel bg-zinc-950/90 dark:bg-zinc-950/90 light:bg-white/95 backdrop-blur-xl border-t border-white/10 light:border-slate-200/80 px-4 py-1.5 flex items-center justify-around shadow-2xl transition-all duration-300 w-full max-w-full overflow-hidden"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 6px), 8px)' }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.isActive;

        if (item.isHero) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative -top-2 flex flex-col items-center group focus:outline-none"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                  active
                    ? 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white scale-110 shadow-indigo-500/40 ring-2 ring-indigo-400/50'
                    : 'bg-gradient-to-tr from-zinc-800 to-zinc-700 text-zinc-300 hover:text-white group-hover:scale-105 shadow-zinc-900/40'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'animate-pulse' : ''}`} />
              </div>
              <span
                className={`text-[10px] font-bold tracking-tight mt-0.5 transition-colors ${
                  active ? 'text-indigo-400 light:text-indigo-600' : 'text-zinc-400'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 min-w-[64px] ${
              active
                ? 'text-indigo-400 light:text-indigo-600 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 light:text-zinc-500'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5 transition-transform duration-200" />
              {active && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
