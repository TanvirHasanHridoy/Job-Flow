'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft, RefreshCw, Clipboard, Check, Moon, Sun, Palette, Eye } from 'lucide-react';

interface VariableDefinition {
  name: string;
  label: string;
  defaultVal: string;
  description: string;
  example?: string;
  isRgba?: boolean;
}

// Default variable values
const DEFAULTS_SHARED: VariableDefinition[] = [
  { name: '--color-primary', label: 'Primary Accent Color', defaultVal: '#6366f1', description: 'Applies to buttons and active states. Examples: "Tailor Workspace" button on the dashboard, active navigation indicators, and primary action buttons.', example: 'Active buttons & indicators' },
  { name: '--color-primary-hover', label: 'Primary Accent Hover', defaultVal: '#4f46e5', description: 'The color of primary buttons and active components when you hover your mouse over them.', example: 'Buttons on hover' },
  { name: '--color-primary-deep', label: 'Primary Accent Deep', defaultVal: '#3730a3', description: 'Mainly used on light background hover states to ensure colors remain highly visible and readable (WCAG AAA standard compliant).', example: 'Text on light bg buttons' },
  { name: '--color-primary-light', label: 'Primary Accent Subtle Glow', defaultVal: '#818cf8', description: 'Subtle light blue/indigo glow borders, loading indicators, and active component frames.', example: 'Active loaders & panel borders' },
  { name: '--color-primary-pale', label: 'Primary Accent Pale Gradient', defaultVal: '#a5b4fc', description: 'The light end color used inside typography gradient fills.', example: 'Right side of title text gradient' },
  { name: '--color-secondary', label: 'Secondary Theme Color', defaultVal: '#a855f7', description: 'Applies to purple gradients, secondary badges, and glowing highlights.', example: 'Decorative background glow orbs' },
  { name: '--color-secondary-dark', label: 'Secondary Theme (Light Mode)', defaultVal: '#7c3aed', description: 'Used in place of secondary purple in light mode to provide appropriate contrast.', example: 'Purple text contrast in light mode' },
  { name: '--color-accent', label: 'Cyan Accent Glow', defaultVal: '#06b6d4', description: 'Applies to cyan highlight gradients, glowing blobs, and visual status tags.', example: 'Cyan tags & decorative tags' },
  { name: '--color-accent-dark', label: 'Cyan Accent (Light Mode)', defaultVal: '#0891b2', description: 'Used in place of cyan accent in light mode to maintain readability.', example: 'Cyan text contrast in light mode' },
  { name: '--color-success', label: 'Success / Green Status Badge', defaultVal: '#059669', description: 'Applies to successful status indicators, e.g., "Tailored" job application status tags or timeline checkmarks.', example: '"Tailored" tag & checkmarks' },
  { name: '--color-error', label: 'Error / Red Status Badge', defaultVal: '#e11d48', description: 'Applies to failure status indicators, warning text elements, and spillover page alerts.', example: 'Height limit warning notices' },
  { name: '--color-warning', label: 'Warning / Amber Status Badge', defaultVal: '#d97706', description: 'Applies to partial mismatch warnings, page overflow warnings, and warning status tags.', example: 'Page overflow spillover alerts' },
  { name: '--print-bg', label: 'PDF Export Sheet Background', defaultVal: '#ffffff', description: 'The physical sheet background when printing or exporting to PDF/Word.', example: 'A4 sheet background in document export' },
  { name: '--print-text', label: 'PDF Export Sheet Text', defaultVal: '#000000', description: 'The physical sheet body text color when printing or exporting.', example: 'A4 body text color in document export' },
];

const DEFAULTS_DARK: VariableDefinition[] = [
  { name: '--background', label: 'App Main Background', defaultVal: '#030014', description: 'Background of the entire app interface, including landing page, dashboard, and tailor workspace.', example: 'Application background (body)' },
  { name: '--foreground', label: 'Primary Text', defaultVal: '#f4f4f5', description: 'Main readable body text color throughout the application in dark mode.', example: 'Main body text' },
  { name: '--surface-1', label: 'Primary Panels & Modals', defaultVal: '#0b081e', description: 'Background for core container panels (e.g., the tailor editor form, popups, and dialog overlays).', example: 'Tailor editor form background' },
  { name: '--surface-2', label: 'Secondary Panels & Toolbar', defaultVal: '#0a061b', description: 'Background of dropdowns, navigation drawer, and the sticky preview workspace header bar.', example: 'Dropdown menus & preview header' },
  { name: '--surface-3', label: 'Detail Drawers & Timeline Base', defaultVal: '#080517', description: 'Background of the application detail sidebar drawer and status timeline trail nodes.', example: 'Sidebar drawer & timeline node rings' },
  { name: '--surface-4', label: 'Preview Sheet Canvas Backdrop', defaultVal: '#040116', description: 'Background of the right-hand panel where the A4 paper document preview is hosted.', example: 'Right-hand side workspace bg' },
  { name: '--surface-5', label: 'Select Dropdown Items', defaultVal: '#0f0c1e', description: 'Background of native select drop-down option lists.', example: 'Select dropdown options' },
  { name: '--surface-checkerboard-base', label: 'Signature Canvas Base', defaultVal: '#0d0d0d', description: 'The base grid background color for the signature background remover canvas.', example: 'Signature pad grid base' },
  { name: '--surface-checkerboard-square', label: 'Signature Canvas Square', defaultVal: '#181818', description: 'The repeating square color for the signature background remover checkerboard grid.', example: 'Signature pad checkerboard squares' },
  { name: '--text-on-surface', label: 'Bright Text / Active Values', defaultVal: '#ffffff', description: 'Highlights selected tabs, highlighted text, and active input texts in panels.', example: 'Input text & active tabs' },
  { name: '--glass-bg', label: 'Glass Panel Backdrop', defaultVal: 'rgba(15, 12, 30, 0.55)', description: 'The semi-transparent container background using frosted-glass styling.', example: 'Landing page & login card backdrops', isRgba: true },
  { name: '--glass-border', label: 'Glass Panel Border', defaultVal: 'rgba(255, 255, 255, 0.08)', description: 'The thin outline border of glassmorphic panels and cards.', example: 'Frosted-glass card borders', isRgba: true },
  { name: '--glass-shadow', label: 'Glass Panel Shadow', defaultVal: 'rgba(0, 0, 0, 0.37)', description: 'The drop-shadow overlay color of glassmorphic containers.', example: 'Drop shadows under panels', isRgba: true },
  { name: '--glass-hover-bg', label: 'Glass Card Hover Background', defaultVal: 'rgba(20, 16, 40, 0.7)', description: 'Glass card background on mouse hover (e.g., Job Board application listings).', example: 'Job board cards on hover', isRgba: true },
  { name: '--glass-hover-border', label: 'Glass Card Hover Border', defaultVal: 'rgba(99, 102, 241, 0.3)', description: 'The border outline color of glassmorphic cards on mouse hover.', example: 'Job card border on hover', isRgba: true },
  { name: '--glass-hover-shadow', label: 'Glass Card Hover Shadow', defaultVal: 'rgba(99, 102, 241, 0.15)', description: 'The glow shadow outline of glassmorphic cards on mouse hover.', example: 'Outer border glow on hover', isRgba: true },
  { name: '--input-bg', label: 'Input Field Background', defaultVal: 'rgba(255, 255, 255, 0.03)', description: 'Default background color of text input boxes, dropdown selectors, and textareas.', example: 'Form input fields background', isRgba: true },
  { name: '--input-border', label: 'Input Field Border', defaultVal: 'rgba(255, 255, 255, 0.08)', description: 'Default border outline color of text input fields.', example: 'Form input fields border outline', isRgba: true },
  { name: '--input-focus-bg', label: 'Input Field Focus Background', defaultVal: 'rgba(255, 255, 255, 0.07)', description: 'Text input background when active/focused.', example: 'Background of active input field', isRgba: true },
  { name: '--input-focus-border', label: 'Input Field Focus Border', defaultVal: 'rgba(99, 102, 241, 0.5)', description: 'Border outline color of input boxes when active/focused.', example: 'Active input border ring', isRgba: true },
  { name: '--input-focus-ring', label: 'Input Field Focus Glow', defaultVal: 'rgba(99, 102, 241, 0.2)', description: 'The outer glow shadow color around inputs when active/focused.', example: 'Outer input border glow', isRgba: true },
  { name: '--scroll-track', label: 'Scrollbar Track', defaultVal: 'rgba(3, 0, 20, 0.5)', description: 'Scrollable container track background.', example: 'Scrollbar lane background', isRgba: true },
  { name: '--scroll-thumb', label: 'Scrollbar Slider', defaultVal: 'rgba(99, 102, 241, 0.3)', description: 'The color of the browser scrollbar slider thumb.', example: 'Scrollbar draggable handle', isRgba: true },
  { name: '--scroll-thumb-hover', label: 'Scrollbar Slider Hover', defaultVal: 'rgba(99, 102, 241, 0.5)', description: 'The color of the scrollbar slider thumb when hovered.', example: 'Scrollbar handle on hover', isRgba: true },
  { name: '--gradient-text-from', label: 'Text Gradient Start', defaultVal: '#ffffff', description: 'Starting color (left) of the main decorative title text gradients.', example: 'Left end of header text' },
  { name: '--gradient-text-via', label: 'Text Gradient Middle', defaultVal: '#e4e4e7', description: 'Middle transition color of main decorative title text gradients.', example: 'Middle of header text' },
  { name: '--gradient-text-to', label: 'Text Gradient End', defaultVal: '#a5b4fc', description: 'Ending color (right) of main decorative title text gradients.', example: 'Right end of header text' },
  { name: '--primary-glow-color', label: 'Background Orb 1 Glow', defaultVal: 'rgba(99, 102, 241, 0.15)', description: 'Indigo radial glow backdrop blur element behind the app interface.', example: 'Decorative indigo background orb', isRgba: true },
  { name: '--secondary-glow-color', label: 'Background Orb 2 Glow', defaultVal: 'rgba(168, 85, 247, 0.15)', description: 'Purple radial glow backdrop blur element behind the app interface.', example: 'Decorative purple background orb', isRgba: true },
];

const DEFAULTS_LIGHT: VariableDefinition[] = [
  { name: '--background', label: 'App Main Background (Light)', defaultVal: '#f9fafb', description: 'Main background color of application shell in light mode.', example: 'Application background (light Mode)' },
  { name: '--foreground', label: 'Primary Text & Headings (Light)', defaultVal: '#111827', description: 'Main headings, dashboard text, and title labels in light mode.', example: 'Headings & labels' },
  { name: '--surface-1', label: 'Primary Cards & Modals (Light)', defaultVal: '#ffffff', description: 'Background of main container cards, dialog popups, and dropdown elements in light mode.', example: 'Cards & modal popups' },
  { name: '--surface-2', label: 'Secondary Surfaces (Light)', defaultVal: '#f3f4f6', description: 'Background of lists and helper panels in light mode.', example: 'List panels & helpers' },
  { name: '--surface-3', label: 'Buttons / Inactive Rings (Light)', defaultVal: '#e5e7eb', description: 'Default background color of buttons and status rings in light mode.', example: 'Default buttons & rings' },
  { name: '--surface-4', label: 'Interactive Button Hover (Light)', defaultVal: '#d1d5db', description: 'Background color of buttons when hovered in light mode.', example: 'Button hover overlay' },
  { name: '--text-on-surface', label: 'Active Input Value (Light)', defaultVal: '#111827', description: 'Color of text inside active input controls and selectors in light mode.', example: 'Text inside select dropdowns' },
  { name: '--text-secondary', label: 'Bold Subheaders (Light)', defaultVal: '#1f2937', description: 'Secondary subheadings and intermediate labels in light mode.', example: 'Subheadings & bold labels' },
  { name: '--text-tertiary', label: 'Paragraphs & Text Listings (Light)', defaultVal: '#374151', description: 'Standard body text, descriptions, and list items in light mode.', example: 'Standard body text' },
  { name: '--text-muted', label: 'Muted / Info Text (Light)', defaultVal: '#4b5563', description: 'Smaller status texts and informational elements in light mode.', example: 'Helper text & detail captions' },
  { name: '--text-subtle', label: 'Faint Text (Light)', defaultVal: '#6b7280', description: 'Subtle meta tags, page targets, and unfocused dates in light mode.', example: 'Faint dates & counter limits' },
  { name: '--glass-bg', label: 'Glass Background (Light)', defaultVal: 'rgba(255, 255, 255, 0.7)', description: 'Faceted container panel background using light mode frosted-glass styling.', example: 'Glass card panel backdrop', isRgba: true },
  { name: '--glass-border', label: 'Glass Border (Light)', defaultVal: 'rgba(0, 0, 0, 0.06)', description: 'The border outline color of glassmorphic elements in light mode.', example: 'Glass card borders', isRgba: true },
  { name: '--glass-shadow', label: 'Glass Shadow (Light)', defaultVal: 'rgba(0, 0, 0, 0.05)', description: 'The drop-shadow overlay of glassmorphic elements in light mode.', example: 'Glass card shadows', isRgba: true },
  { name: '--glass-hover-bg', label: 'Glass Hover Background (Light)', defaultVal: 'rgba(255, 255, 255, 0.85)', description: 'Background of light mode glassmorphic cards when hovered.', example: 'Glass cards on hover', isRgba: true },
  { name: '--glass-hover-border', label: 'Glass Hover Border (Light)', defaultVal: 'rgba(99, 102, 241, 0.2)', description: 'The border outline of light mode glassmorphic elements on hover.', example: 'Glass card border on hover', isRgba: true },
  { name: '--glass-hover-shadow', label: 'Glass Hover Shadow (Light)', defaultVal: 'rgba(99, 102, 241, 0.08)', description: 'The glow shadow outline of light mode glassmorphic elements on hover.', example: 'Glass card shadow on hover', isRgba: true },
  { name: '--input-bg', label: 'Input Field Background (Light)', defaultVal: 'rgba(0, 0, 0, 0.02)', description: 'Default background color of text inputs in light mode.', example: 'Form inputs background', isRgba: true },
  { name: '--input-border', label: 'Input Field Border (Light)', defaultVal: 'rgba(0, 0, 0, 0.08)', description: 'Default border outline of text inputs in light mode.', example: 'Form inputs border outline', isRgba: true },
  { name: '--input-focus-bg', label: 'Input Field Focus (Light)', defaultVal: 'rgba(0, 0, 0, 0.04)', description: 'Background of inputs when active in light mode.', example: 'Background of active inputs', isRgba: true },
  { name: '--input-focus-border', label: 'Input Field Focus Border (Light)', defaultVal: 'rgba(99, 102, 241, 0.4)', description: 'Border outline of inputs when active in light mode.', example: 'Active inputs border outline', isRgba: true },
  { name: '--gradient-text-from', label: 'Gradient Text Start (Light)', defaultVal: '#111827', description: 'Starting color of decorative titles in light mode.', example: 'Header text gradient start' },
  { name: '--gradient-text-via', label: 'Gradient Text Middle (Light)', defaultVal: '#374151', description: 'Middle transition color of titles in light mode.', example: 'Header text gradient middle' },
  { name: '--gradient-text-to', label: 'Gradient Text End (Light)', defaultVal: '#4f46e5', description: 'Ending color of titles in light mode.', example: 'Header text gradient end' },
  { name: '--primary-glow-color', label: 'Background Orb 1 Glow (Light)', defaultVal: 'rgba(99, 102, 241, 0.06)', description: 'Subtle light mode background orb glow color.', example: 'Decorative orb 1 glow', isRgba: true },
  { name: '--secondary-glow-color', label: 'Background Orb 2 Glow (Light)', defaultVal: 'rgba(168, 85, 247, 0.06)', description: 'Subtle light mode background orb secondary glow color.', example: 'Decorative orb 2 glow', isRgba: true },
];

// Helper to parse rgba string to hex and alpha
function parseRgba(rgbaStr: string) {
  const match = rgbaStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
    const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    return { hex, alpha: a };
  }
  return { hex: '#ffffff', alpha: 1 };
}

// Helper to compile hex and alpha to rgba string
function toRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function ColorEditor() {
  const [isLightMode, setIsLightMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resetFinished, setResetFinished] = useState(false);

  // States holding current custom colors
  const [colorsShared, setColorsShared] = useState<Record<string, string>>({});
  const [colorsDark, setColorsDark] = useState<Record<string, string>>({});
  const [colorsLight, setColorsLight] = useState<Record<string, string>>({});

  // Initialize values
  useEffect(() => {
    // Detect current theme mode from html class list
    if (typeof window !== 'undefined') {
      setIsLightMode(document.documentElement.classList.contains('light'));
    }

    // Load defaults, localStorage, or currently applied variables in DOM
    const loadCurrentValues = (defs: VariableDefinition[]) => {
      const vals: Record<string, string> = {};
      defs.forEach((v) => {
        let current = '';
        if (typeof window !== 'undefined') {
          // 1. Try localStorage
          current = localStorage.getItem('theme:' + v.name) || '';
          if (!current) {
            // 2. Try document style
            current = document.documentElement.style.getPropertyValue(v.name).trim();
          }
        }
        vals[v.name] = current || v.defaultVal;
      });
      return vals;
    };

    setColorsShared(loadCurrentValues(DEFAULTS_SHARED));
    setColorsDark(loadCurrentValues(DEFAULTS_DARK));
    setColorsLight(loadCurrentValues(DEFAULTS_LIGHT));
  }, []);

  // Sync variables live to document element styles & broadcast changes
  const updateVariableInDom = (name: string, value: string, isShared = false, isLight = false) => {
    if (typeof window === 'undefined') return;

    // Save to localStorage
    localStorage.setItem('theme:' + name, value);

    // Set property on document element
    if (isShared) {
      document.documentElement.style.setProperty(name, value);
    } else if (isLight === isLightMode) {
      document.documentElement.style.setProperty(name, value);
    }

    // Broadcast change across tabs
    const channel = new BroadcastChannel('theme-color-sync');
    channel.postMessage({ type: 'update', name, value });
    channel.close();
  };

  // Handle color picker edits
  const handleColorChange = (name: string, value: string, category: 'shared' | 'dark' | 'light') => {
    if (category === 'shared') {
      setColorsShared((prev) => ({ ...prev, [name]: value }));
      updateVariableInDom(name, value, true, false);
    } else if (category === 'dark') {
      setColorsDark((prev) => ({ ...prev, [name]: value }));
      updateVariableInDom(name, value, false, false);
    } else {
      setColorsLight((prev) => ({ ...prev, [name]: value }));
      updateVariableInDom(name, value, false, true);
    }
  };

  // Toggle app light/dark mode for live preview checking
  const toggleThemeMode = () => {
    if (typeof window === 'undefined') return;
    const newLightMode = !isLightMode;
    setIsLightMode(newLightMode);

    localStorage.setItem('theme', newLightMode ? 'light' : 'dark');

    if (newLightMode) {
      document.documentElement.classList.add('light');
      // Apply light mode variables in style so they show up
      Object.entries(colorsLight).forEach(([k, v]) => {
        document.documentElement.style.setProperty(k, v);
      });
    } else {
      document.documentElement.classList.remove('light');
      // Re-apply dark mode variables in style
      Object.entries(colorsDark).forEach(([k, v]) => {
        document.documentElement.style.setProperty(k, v);
      });
    }

    // Broadcast theme toggle & update variables for all other tabs
    const channel = new BroadcastChannel('theme-color-sync');
    channel.postMessage({ type: 'toggle-theme', value: newLightMode ? 'light' : 'dark' });
    channel.postMessage({ type: 'update-bulk', colors: newLightMode ? colorsLight : colorsDark });
    channel.close();
  };

  // Reset all colors to defaults
  const handleReset = () => {
    if (typeof window === 'undefined') return;

    // Clear theme variables in localStorage
    try {
      const keysToRemove: string[] = [];
      const length = localStorage.length;
      for (let i = 0; i < length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('theme:')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.error(e);
    }

    // Reset Shared
    const resetShared: Record<string, string> = {};
    DEFAULTS_SHARED.forEach((v) => {
      resetShared[v.name] = v.defaultVal;
      document.documentElement.style.setProperty(v.name, v.defaultVal);
    });
    setColorsShared(resetShared);

    // Reset Dark
    const resetDark: Record<string, string> = {};
    DEFAULTS_DARK.forEach((v) => {
      resetDark[v.name] = v.defaultVal;
      if (!isLightMode) {
        document.documentElement.style.setProperty(v.name, v.defaultVal);
      }
    });
    setColorsDark(resetDark);

    // Reset Light
    const resetLight: Record<string, string> = {};
    DEFAULTS_LIGHT.forEach((v) => {
      resetLight[v.name] = v.defaultVal;
      if (isLightMode) {
        document.documentElement.style.setProperty(v.name, v.defaultVal);
      }
    });
    setColorsLight(resetLight);

    // Broadcast reset command to other tabs
    const channel = new BroadcastChannel('theme-color-sync');
    channel.postMessage({ type: 'reset' });
    channel.close();

    setResetFinished(true);
    setTimeout(() => setResetFinished(false), 2000);
  };

  // Generate complete copy-paste CSS block
  const handleExport = () => {
    const buildCssList = (vals: Record<string, string>) => {
      return Object.entries(vals)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join('\n');
    };

    const cssText = `/* Centralized Custom Theme Colors */
:root {
  /* Shared Colors (Universal) */
${buildCssList(colorsShared)}

  /* Dark Theme Colors */
${buildCssList(colorsDark)}
}

/* Light Theme Color Overrides */
.light {
${buildCssList(colorsLight)}
}`;

    navigator.clipboard.writeText(cssText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Render individual editor card
  const renderEditorCard = (v: VariableDefinition, currentVal: string, category: 'shared' | 'dark' | 'light') => {
    const isRgba = !!v.isRgba;
    let hex = currentVal;
    let alpha = 1;

    if (isRgba) {
      const parsed = parseRgba(currentVal);
      hex = parsed.hex;
      alpha = parsed.alpha;
    }

    return (
      <div key={v.name} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col justify-between gap-3 text-zinc-300 font-sans shadow-md hover:border-white/20 hover:bg-white/[0.07] transition-all">
        <div>
          <div className="flex items-start justify-between gap-2 flex-wrap md:flex-nowrap">
            <span className="text-[13px] font-bold text-white tracking-wide">{v.label}</span>
            <code className="text-[10px] text-zinc-500 font-mono select-all">{v.name}</code>
          </div>
          {v.example && (
            <div className="mt-1 flex items-center">
              <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold">
                Used in: {v.example}
              </span>
            </div>
          )}
          <p className="text-[11px] text-zinc-400 mt-2 leading-normal">{v.description}</p>
        </div>

        <div className="flex items-center gap-3.5 mt-2 bg-black/20 p-2.5 rounded-xl border border-white/5">
          {/* Color Preview Block */}
          <div
            className="w-8 h-8 rounded-lg border border-white/10 flex-shrink-0 shadow-inner"
            style={{ backgroundColor: currentVal }}
          />

          {/* Color Controls */}
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={hex}
                onChange={(e) => {
                  const newHex = e.target.value;
                  const newVal = isRgba ? toRgba(newHex, alpha) : newHex;
                  handleColorChange(v.name, newVal, category);
                }}
                className="w-6 h-6 p-0 border-0 bg-transparent rounded cursor-pointer [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-md"
              />
              <input
                type="text"
                value={isRgba ? currentVal : hex}
                onChange={(e) => {
                  handleColorChange(v.name, e.target.value, category);
                }}
                className="flex-1 text-[11px] font-mono bg-black/40 border border-white/10 rounded px-2 py-0.5 text-white outline-none focus:border-indigo-500/50"
              />
            </div>

            {/* Opacity Slider for RGBA */}
            {isRgba && (
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-500 font-mono w-7">Alpha:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={alpha}
                  onChange={(e) => {
                    const newAlpha = parseFloat(e.target.value);
                    const newVal = toRgba(hex, newAlpha);
                    handleColorChange(v.name, newVal, category);
                  }}
                  className="flex-grow h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-[10px] text-zinc-400 font-mono w-8 text-right">
                  {Math.round(alpha * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-y-auto">
      {/* Header Banner */}
      <div className="sticky top-0 z-40 bg-[var(--surface-2)]/95 backdrop-blur-md border-b border-white/5 px-6 py-4 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-400" />
              <h1 className="text-xl font-bold text-white">Theme Color Customizer</h1>
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Live Preview
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Tweak color variables in real-time and export them back into globals.css</p>
          </div>
        </div>

        {/* Global Toolbar Options */}
        <div className="flex items-center gap-2.5">
          {/* Preview Mode Selector */}
          <button
            onClick={toggleThemeMode}
            className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md"
            title="Toggle app theme layout to preview edits"
          >
            {isLightMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Previewing Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Previewing Dark Mode</span>
              </>
            )}
          </button>

          {/* Reset All */}
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-zinc-700/60 shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetFinished ? 'animate-spin' : ''}`} />
            <span>{resetFinished ? 'Reset Complete!' : 'Reset Defaults'}</span>
          </button>

          {/* Copy to Clipboard */}
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied CSS Variables!</span>
              </>
            ) : (
              <>
                <Clipboard className="w-3.5 h-3.5" />
                <span>Export CSS Properties</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="max-w-[1400px] mx-auto px-6 py-8 md:px-12 grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Navigation jump table */}
        <div className="lg:col-span-1">
          <div className="sticky top-[100px] bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col gap-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Navigation Guide</h3>
            <div className="flex flex-col gap-1.5 font-sans">
              <a href="#shared-vars" className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-white/5 text-zinc-300 hover:text-white transition-all flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Universal Brand Accents</span>
              </a>
              <a href="#dark-vars" className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-white/5 text-zinc-300 hover:text-white transition-all flex items-center gap-2">
                <Moon className="w-4 h-4 text-purple-400" />
                <span>Dark Theme Surfaces</span>
              </a>
              <a href="#light-vars" className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-white/5 text-zinc-300 hover:text-white transition-all flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Theme Surfaces</span>
              </a>
            </div>

            <div className="h-px bg-white/10 my-1" />

            {/* Quick Live Preview Banner */}
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs flex flex-col gap-2.5 leading-relaxed text-indigo-300">
              <div className="flex items-center gap-2 font-bold text-white text-[11px] uppercase tracking-wider">
                <Eye className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span>Live Sandbox Note</span>
              </div>
              <p>As you tweak colors, you will see elements on this page and the entire app (in other browser tabs) change in real time. Use the top bar toggles to swap and examine dark vs. light styling instantly.</p>
            </div>
          </div>
        </div>

        {/* Input variables lists */}
        <div className="lg:col-span-3 flex flex-col gap-12">

          {/* Universal Accents */}
          <section id="shared-vars">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              <h2 className="text-lg font-bold text-white font-sans">Universal Brand Accent & Print Colors</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEFAULTS_SHARED.map((v) => renderEditorCard(v, colorsShared[v.name] || v.defaultVal, 'shared'))}
            </div>
          </section>

          {/* Dark Theme Colors */}
          <section id="dark-vars">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6">
              <Moon className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white font-sans">Dark Theme Backgrounds & Surfaces</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEFAULTS_DARK.map((v) => renderEditorCard(v, colorsDark[v.name] || v.defaultVal, 'dark'))}
            </div>
          </section>

          {/* Light Theme Colors */}
          <section id="light-vars">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6">
              <Sun className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white font-sans">Light Theme Backgrounds & Surfaces</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEFAULTS_LIGHT.map((v) => renderEditorCard(v, colorsLight[v.name] || v.defaultVal, 'light'))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
