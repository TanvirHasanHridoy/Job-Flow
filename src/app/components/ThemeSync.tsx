'use client';

import { useEffect } from 'react';

export default function ThemeSync() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Apply any saved custom colors from localStorage on mount
    const applySavedColors = () => {
      try {
        const length = localStorage.length;
        for (let i = 0; i < length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('theme:')) {
            const varName = key.replace('theme:', '');
            const val = localStorage.getItem(key);
            if (val) {
              document.documentElement.style.setProperty(varName, val);
            }
          }
        }
      } catch (e) {
        console.error('Error applying theme variables from localStorage', e);
      }
    };

    applySavedColors();

    // 2. Open BroadcastChannel for real-time cross-tab synchronization
    const channel = new BroadcastChannel('theme-color-sync');
    channel.onmessage = (event) => {
      if (event.data && typeof event.data === 'object') {
        const { type, name, value, colors } = event.data;
        if (type === 'reset') {
          // Clear all custom property overrides on the DOM
          try {
            const keysToRemove: string[] = [];
            const length = localStorage.length;
            for (let i = 0; i < length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('theme:')) {
                keysToRemove.push(key.replace('theme:', ''));
              }
            }
            keysToRemove.forEach((varName) => {
              document.documentElement.style.removeProperty(varName);
            });
          } catch (e) {
            console.error('Error cleaning up DOM style overrides', e);
          }
        } else if (type === 'toggle-theme') {
          // Toggle dark/light theme class globally
          if (value === 'light') {
            document.documentElement.classList.add('light');
          } else {
            document.documentElement.classList.remove('light');
          }
        } else if (type === 'update-bulk') {
          // Apply bulk variables
          Object.entries(colors || {}).forEach(([k, v]) => {
            document.documentElement.style.setProperty(k, v as string);
          });
        } else {
          // Single variable live update
          document.documentElement.style.setProperty(name, value);
        }
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  return null;
}
