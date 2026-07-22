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

// 1. Shared / Universal Variables (Accents & Canvas)
const DEFAULTS_SHARED: VariableDefinition[] = [
  /* Primary Action Tier */
  { name: '--action-primary-bg', label: 'Primary Button Background', defaultVal: '#6366f1', description: 'Base color for main primary action buttons (e.g. "Tailor Workspace" button, confirmation buttons).', example: 'Primary action CTA buttons' },
  { name: '--action-primary-fg', label: 'Primary Button Foreground', defaultVal: '#ffffff', description: 'Text/icon color displayed on top of primary buttons.', example: 'Primary button text' },
  { name: '--action-primary-border', label: 'Primary Action Border/Glow', defaultVal: '#818cf8', description: 'Border lines, active focus glows, and highlights for primary items.', example: 'Active item borders & loaders' },
  { name: '--action-primary-bg-hover', label: 'Primary Button Hover BG', defaultVal: '#4f46e5', description: 'Background color of primary action buttons on mouse hover.', example: 'Primary button hover state' },
  { name: '--action-primary-fg-hover', label: 'Primary Button Hover FG', defaultVal: '#ffffff', description: 'Text color of primary buttons on mouse hover.', example: 'Primary button hover text' },
  { name: '--action-primary-border-hover', label: 'Primary Button Hover Border', defaultVal: '#6366f1', description: 'Border outline color of primary buttons on mouse hover.', example: 'Primary button hover border' },

  /* CTA Action Tier */
  { name: '--action-cta-bg', label: 'Marketing CTA Background', defaultVal: '#a855f7', description: 'Base background color of secondary conversion or marketing actions (e.g. export button gradients).', example: 'Conversion badges & CTA buttons' },
  { name: '--action-cta-fg', label: 'Marketing CTA Foreground', defaultVal: '#ffffff', description: 'Text color displayed on top of CTA actions.', example: 'CTA button labels' },
  { name: '--action-cta-border', label: 'Marketing CTA Border', defaultVal: '#c084fc', description: 'Border/glow outline for CTA components.', example: 'CTA active frame outlines' },
  { name: '--action-cta-bg-hover', label: 'Marketing CTA Hover BG', defaultVal: '#7c3aed', description: 'Background color of CTA buttons on mouse hover.', example: 'CTA button hover state' },
  { name: '--action-cta-fg-hover', label: 'Marketing CTA Hover FG', defaultVal: '#ffffff', description: 'Text color of CTA buttons on mouse hover.', example: 'CTA button hover text' },
  { name: '--action-cta-border-hover', label: 'Marketing CTA Hover Border', defaultVal: '#a855f7', description: 'Border color of CTA buttons on mouse hover.', example: 'CTA button hover border' },

  /* Destructive Action Tier */
  { name: '--action-destructive-bg', label: 'Destructive Action Background', defaultVal: '#e11d48', description: 'Base color for cancellation, deletion, or destructive actions.', example: 'Sign out & delete buttons' },
  { name: '--action-destructive-fg', label: 'Destructive Action Foreground', defaultVal: '#ffffff', description: 'Text/icon color displayed on destructive buttons.', example: 'Destructive action labels' },
  { name: '--action-destructive-border', label: 'Destructive Action Border', defaultVal: '#fda4af', description: 'Border outline for destructive buttons.', example: 'Destructive buttons border' },
  { name: '--action-destructive-bg-hover', label: 'Destructive Action Hover BG', defaultVal: '#be123c', description: 'Background color of destructive buttons on hover.', example: 'Destructive hover state bg' },
  { name: '--action-destructive-fg-hover', label: 'Destructive Action Hover FG', defaultVal: '#ffffff', description: 'Text color of destructive buttons on hover.', example: 'Destructive hover text' },
  { name: '--action-destructive-border-hover', label: 'Destructive Action Hover Border', defaultVal: '#e11d48', description: 'Border outline of destructive buttons on hover.', example: 'Destructive hover border outline' },
];

// 2. Dark Mode variables
const DEFAULTS_DARK: VariableDefinition[] = [
  /* Canvas & Layout */
  { name: '--layout-backdrop-bg', label: 'App Backdrop Background', defaultVal: '#030014', description: 'Default background color of the HTML body / app view wrapper.', example: 'Entire app main background' },
  { name: '--layout-backdrop-fg', label: 'App Backdrop Foreground', defaultVal: '#f4f4f5', description: 'Default main paragraph and text color inside the workspace.', example: 'Main page typography base' },
  { name: '--layout-surface-card-bg', label: 'Card Container Surface', defaultVal: 'rgba(15, 12, 30, 0.55)', description: 'Semi-transparent background for card listing panels.', example: 'Application listing blocks', isRgba: true },
  { name: '--layout-surface-card-border', label: 'Card Container Border', defaultVal: 'rgba(255, 255, 255, 0.08)', description: 'Standard card outline border.', example: 'Card boundary limits', isRgba: true },
  { name: '--layout-surface-card-shadow', label: 'Card Container Shadow', defaultVal: 'rgba(0, 0, 0, 0.37)', description: 'Default drop shadow applied under cards.', example: 'Container drop shadow', isRgba: true },
  { name: '--layout-surface-card-bg-hover', label: 'Card Hover Surface', defaultVal: 'rgba(20, 16, 40, 0.7)', description: 'Background of card panels when hovered.', example: 'Application list hover state', isRgba: true },
  { name: '--layout-surface-card-border-hover', label: 'Card Hover Border', defaultVal: 'rgba(99, 102, 241, 0.3)', description: 'Border outline of card panels when hovered.', example: 'Application list hover outline', isRgba: true },
  { name: '--layout-surface-card-shadow-hover', label: 'Card Hover Shadow', defaultVal: 'rgba(99, 102, 241, 0.15)', description: 'Active glow shadow of card panels when hovered.', example: 'Application list hover glow', isRgba: true },
  { name: '--layout-surface-panel-bg', label: 'Panel / Modal Surface', defaultVal: '#0a061b', description: 'Core backdrop panels for active dialog modals and navigation drawers.', example: 'Mobile drawer & popups' },
  { name: '--layout-surface-panel-border', label: 'Panel / Modal Border', defaultVal: 'rgba(255, 255, 255, 0.1)', description: 'Outline border of active modal boxes.', example: 'Popup card boundary line' },
  { name: '--layout-surface-panel-shadow', label: 'Panel / Modal Shadow', defaultVal: 'rgba(0, 0, 0, 0.5)', description: 'Drop shadow under panel dialogs.', example: 'Modal overlay shadow', isRgba: true },
  { name: '--layout-surface-workspace-bg', label: 'Workspace Sheet Canvas Backdrop', defaultVal: '#040116', description: 'The workspace background behind the document workspace canvas.', example: 'Workspace editor layout background' },
  { name: '--layout-divider-border', label: 'Separation Boundary Line', defaultVal: 'rgba(255, 255, 255, 0.08)', description: 'Decorative separation lines dividing sections.', example: 'Horizontal divider lines', isRgba: true },

  /* Typography */
  { name: '--text-title-fg', label: 'Title / Heading Typography', defaultVal: '#ffffff', description: 'Text color of titles and section headers.', example: 'Workspace headers & titles' },
  { name: '--text-body-fg', label: 'Main Paragraph Typography', defaultVal: '#e4e4e7', description: 'Standard readable paragraph text color.', example: 'Main body copy text' },
  { name: '--text-muted-fg', label: 'Secondary / Caption Typography', defaultVal: '#a5b4fc', description: 'Subheaders, list detail labels, and secondary texts.', example: 'Secondary captions' },
  { name: '--text-subtle-fg', label: 'Subtle / Info Typography', defaultVal: '#64748b', description: 'Timestamps, limits counters, and unfocused dates.', example: 'Timestamps & details text' },
  { name: '--text-inverse-fg', label: 'High Contrast Inverse Typography', defaultVal: '#ffffff', description: 'Text color layered on top of dark/colored action assets.', example: 'Tokens indicator text' },

  /* Secondary Action */
  { name: '--action-secondary-bg', label: 'Secondary Action Background', defaultVal: 'rgba(255, 255, 255, 0.03)', description: 'Base color for secondary Ghost button shapes.', example: 'Ghost outline actions', isRgba: true },
  { name: '--action-secondary-fg', label: 'Secondary Action Foreground', defaultVal: '#f4f4f5', description: 'Text color for secondary actions.', example: 'Secondary button text' },
  { name: '--action-secondary-border', label: 'Secondary Action Border', defaultVal: 'rgba(255, 255, 255, 0.08)', description: 'Outline border for secondary buttons.', example: 'Secondary outline borders', isRgba: true },
  { name: '--action-secondary-bg-hover', label: 'Secondary Action Hover BG', defaultVal: 'rgba(255, 255, 255, 0.07)', description: 'Background of secondary actions when hovered.', example: 'Secondary button hover state', isRgba: true },
  { name: '--action-secondary-fg-hover', label: 'Secondary Action Hover FG', defaultVal: '#ffffff', description: 'Text color of secondary actions when hovered.', example: 'Secondary button hover text' },
  { name: '--action-secondary-border-hover', label: 'Secondary Action Hover Border', defaultVal: 'rgba(255, 255, 255, 0.15)', description: 'Border of secondary actions when hovered.', example: 'Secondary button hover border', isRgba: true },

  /* Inputs */
  { name: '--input-default-bg', label: 'Form Input Background', defaultVal: 'rgba(255, 255, 255, 0.03)', description: 'Default background color of textboxes and textareas.', example: 'Textbox default backdrop', isRgba: true },
  { name: '--input-default-fg', label: 'Form Input Value Text', defaultVal: '#ffffff', description: 'Color of text written inside form inputs.', example: 'Textbox user text value' },
  { name: '--input-default-border', label: 'Form Input Border', defaultVal: 'rgba(255, 255, 255, 0.08)', description: 'Inactive boundary border line for inputs.', example: 'Textbox borders', isRgba: true },
  { name: '--input-focus-bg', label: 'Form Input Focus Background', defaultVal: 'rgba(255, 255, 255, 0.07)', description: 'Background of input elements when focused.', example: 'Active textbox backdrop', isRgba: true },
  { name: '--input-focus-fg', label: 'Form Input Focus Value Text', defaultVal: '#ffffff', description: 'Text color inside active input elements.', example: 'Active textbox user values' },
  { name: '--input-focus-border', label: 'Form Input Focus Border', defaultVal: 'rgba(99, 102, 241, 0.5)', description: 'Border of input elements when focused.', example: 'Active textbox borders', isRgba: true },
  { name: '--input-focus-ring', label: 'Form Input Focus Glow Ring', defaultVal: 'rgba(99, 102, 241, 0.2)', description: 'Shadow glow around focused input elements.', example: 'Active textbox glow ring', isRgba: true },

  /* Feedback */
  { name: '--feedback-success-bg', label: 'Success Alert Background', defaultVal: 'rgba(5, 150, 105, 0.1)', description: 'Green status backdrop for successful indicators.', example: '"Tailored" status tag bg', isRgba: true },
  { name: '--feedback-success-fg', label: 'Success Alert Foreground', defaultVal: '#10b981', description: 'Green status typography.', example: '"Tailored" status label text' },
  { name: '--feedback-success-border', label: 'Success Alert Border', defaultVal: 'rgba(5, 150, 105, 0.25)', description: 'Success status frame borders.', example: 'Success tag framing line', isRgba: true },
  { name: '--feedback-warning-bg', label: 'Warning Alert Background', defaultVal: 'rgba(217, 119, 6, 0.1)', description: 'Amber status backdrop for warnings.', example: 'Spillover warn tag bg', isRgba: true },
  { name: '--feedback-warning-fg', label: 'Warning Alert Foreground', defaultVal: '#f59e0b', description: 'Amber status text.', example: 'Spillover warn label text' },
  { name: '--feedback-warning-border', label: 'Warning Alert Border', defaultVal: 'rgba(217, 119, 6, 0.25)', description: 'Warning status borders.', example: 'Spillover tag framing line', isRgba: true },
  { name: '--feedback-error-bg', label: 'Error Alert Background', defaultVal: 'rgba(225, 29, 72, 0.1)', description: 'Rose status backdrop for error boxes.', example: 'Page cutoff warning backdrop', isRgba: true },
  { name: '--feedback-error-fg', label: 'Error Alert Foreground', defaultVal: '#f43f5e', description: 'Rose status text.', example: 'Cutoff warning text' },
  { name: '--feedback-error-border', label: 'Error Alert Border', defaultVal: 'rgba(225, 29, 72, 0.25)', description: 'Error status borders.', example: 'Cutoff warning border', isRgba: true },

  /* Effects */
  { name: '--effect-glow-primary', label: 'Background Orb 1 (Indigo)', defaultVal: 'rgba(99, 102, 241, 0.15)', description: 'Indigo glow orb behind the dashboard.', example: 'Indigo decorative glow layer', isRgba: true },
  { name: '--effect-glow-secondary', label: 'Background Orb 2 (Purple)', defaultVal: 'rgba(168, 85, 247, 0.15)', description: 'Purple glow orb behind the dashboard.', example: 'Purple decorative glow layer', isRgba: true },
  { name: '--effect-checkerboard-base', label: 'Signature Canvas Base', defaultVal: '#0d0d0d', description: 'Signature checker grid canvas background color.', example: 'Signature pad grid base' },
  { name: '--effect-checkerboard-square', label: 'Signature Canvas Squares', defaultVal: '#181818', description: 'Signature checker grid canvas square grid color.', example: 'Signature pad grid square' },
  { name: '--effect-scrollbar-track', label: 'Scrollbar Track', defaultVal: 'rgba(3, 0, 20, 0.5)', description: 'Track background of scroll bars.', example: 'Scroll lane track', isRgba: true },
  { name: '--effect-scrollbar-thumb', label: 'Scrollbar Slider', defaultVal: 'rgba(99, 102, 241, 0.3)', description: 'Slider handle of scroll bars.', example: 'Scroll slider thumb', isRgba: true },
  { name: '--effect-scrollbar-thumb-hover', label: 'Scrollbar Slider Hover', defaultVal: 'rgba(99, 102, 241, 0.5)', description: 'Scrollbar slider handle on hover.', example: 'Scroll thumb on hover', isRgba: true },
];

// 3. Light Mode variables
const DEFAULTS_LIGHT: VariableDefinition[] = [
  /* Canvas & Layout */
  { name: '--layout-backdrop-bg', label: 'App Backdrop Background (Light)', defaultVal: '#f9fafb', description: 'Default background color of the HTML body / app view wrapper.', example: 'Entire app main background' },
  { name: '--layout-backdrop-fg', label: 'App Backdrop Foreground (Light)', defaultVal: '#111827', description: 'Default main paragraph and text color inside the workspace.', example: 'Main page typography base' },
  { name: '--layout-surface-card-bg', label: 'Card Container Surface (Light)', defaultVal: 'rgba(255, 255, 255, 0.7)', description: 'Semi-transparent background for card listing panels.', example: 'Application listing blocks', isRgba: true },
  { name: '--layout-surface-card-border', label: 'Card Container Border (Light)', defaultVal: 'rgba(0, 0, 0, 0.06)', description: 'Standard card outline border.', example: 'Card boundary limits', isRgba: true },
  { name: '--layout-surface-card-shadow', label: 'Card Container Shadow (Light)', defaultVal: 'rgba(0, 0, 0, 0.05)', description: 'Default drop shadow applied under cards.', example: 'Container drop shadow', isRgba: true },
  { name: '--layout-surface-card-bg-hover', label: 'Card Hover Surface (Light)', defaultVal: 'rgba(255, 255, 255, 0.85)', description: 'Background of card panels when hovered.', example: 'Application list hover state', isRgba: true },
  { name: '--layout-surface-card-border-hover', label: 'Card Hover Border (Light)', defaultVal: 'rgba(99, 102, 241, 0.2)', description: 'Border outline of card panels when hovered.', example: 'Application list hover outline', isRgba: true },
  { name: '--layout-surface-card-shadow-hover', label: 'Card Hover Shadow (Light)', defaultVal: 'rgba(99, 102, 241, 0.08)', description: 'Active glow shadow of card panels when hovered.', example: 'Application list hover glow', isRgba: true },
  { name: '--layout-surface-panel-bg', label: 'Panel / Modal Surface (Light)', defaultVal: '#ffffff', description: 'Core backdrop panels for active dialog modals and navigation drawers.', example: 'Mobile drawer & popups' },
  { name: '--layout-surface-panel-border', label: 'Panel / Modal Border (Light)', defaultVal: 'rgba(0, 0, 0, 0.08)', description: 'Outline border of active modal boxes.', example: 'Popup card boundary line' },
  { name: '--layout-surface-panel-shadow', label: 'Panel / Modal Shadow (Light)', defaultVal: 'rgba(0, 0, 0, 0.03)', description: 'Drop shadow under panel dialogs.', example: 'Modal overlay shadow', isRgba: true },
  { name: '--layout-surface-workspace-bg', label: 'Workspace Sheet Canvas Backdrop (Light)', defaultVal: '#d1d5db', description: 'The workspace background behind the document workspace canvas.', example: 'Workspace editor layout background' },
  { name: '--layout-divider-border', label: 'Separation Boundary Line (Light)', defaultVal: 'rgba(0, 0, 0, 0.12)', description: 'Decorative separation lines dividing sections.', example: 'Horizontal divider lines', isRgba: true },

  /* Typography */
  { name: '--text-title-fg', label: 'Title / Heading Typography (Light)', defaultVal: '#111827', description: 'Text color of titles and section headers.', example: 'Workspace headers & titles' },
  { name: '--text-body-fg', label: 'Main Paragraph Typography (Light)', defaultVal: '#374151', description: 'Standard readable paragraph text color.', example: 'Main body copy text' },
  { name: '--text-muted-fg', label: 'Secondary / Caption Typography (Light)', defaultVal: '#4b5563', description: 'Subheaders, list detail labels, and secondary texts.', example: 'Secondary captions' },
  { name: '--text-subtle-fg', label: 'Subtle / Info Typography (Light)', defaultVal: '#6b7280', description: 'Timestamps, limits counters, and unfocused dates.', example: 'Timestamps & details text' },
  { name: '--text-inverse-fg', label: 'High Contrast Inverse Typography (Light)', defaultVal: '#ffffff', description: 'Text color layered on top of dark/colored action assets.', example: 'Tokens indicator text' },

  /* Secondary Action */
  { name: '--action-secondary-bg', label: 'Secondary Action Background (Light)', defaultVal: 'rgba(0, 0, 0, 0.02)', description: 'Base color for secondary Ghost button shapes.', example: 'Ghost outline actions', isRgba: true },
  { name: '--action-secondary-fg', label: 'Secondary Action Foreground (Light)', defaultVal: '#111827', description: 'Text color for secondary actions.', example: 'Secondary button text' },
  { name: '--action-secondary-border', label: 'Secondary Action Border (Light)', defaultVal: 'rgba(0, 0, 0, 0.08)', description: 'Outline border for secondary buttons.', example: 'Secondary outline borders', isRgba: true },
  { name: '--action-secondary-bg-hover', label: 'Secondary Action Hover BG (Light)', defaultVal: 'rgba(0, 0, 0, 0.04)', description: 'Background of secondary actions when hovered.', example: 'Secondary button hover state', isRgba: true },
  { name: '--action-secondary-fg-hover', label: 'Secondary Action Hover FG (Light)', defaultVal: '#111827', description: 'Text color of secondary actions when hovered.', example: 'Secondary button hover text' },
  { name: '--action-secondary-border-hover', label: 'Secondary Action Hover Border (Light)', defaultVal: 'rgba(0, 0, 0, 0.15)', description: 'Border of secondary actions when hovered.', example: 'Secondary button hover border', isRgba: true },

  /* Inputs */
  { name: '--input-default-bg', label: 'Form Input Background (Light)', defaultVal: 'rgba(0, 0, 0, 0.02)', description: 'Default background color of text inputs.', example: 'Textbox default backdrop', isRgba: true },
  { name: '--input-default-fg', label: 'Form Input Value Text (Light)', defaultVal: '#111827', description: 'Color of text written inside form inputs.', example: 'Textbox user text value' },
  { name: '--input-default-border', label: 'Form Input Border (Light)', defaultVal: 'rgba(0, 0, 0, 0.08)', description: 'Inactive boundary border line for inputs.', example: 'Textbox borders', isRgba: true },
  { name: '--input-focus-bg', label: 'Form Input Focus BG (Light)', defaultVal: 'rgba(0, 0, 0, 0.04)', description: 'Background of inputs when focused.', example: 'Active textbox backdrop', isRgba: true },
  { name: '--input-focus-fg', label: 'Form Input Focus Value (Light)', defaultVal: '#111827', description: 'Text color inside active input elements.', example: 'Active textbox user values' },
  { name: '--input-focus-border', label: 'Form Input Focus Border (Light)', defaultVal: 'rgba(99, 102, 241, 0.4)', description: 'Border of inputs when focused.', example: 'Active textbox borders' },
  { name: '--input-focus-ring', label: 'Form Input Focus Ring (Light)', defaultVal: 'rgba(99, 102, 241, 0.15)', description: 'Shadow glow around focused inputs.', example: 'Active textbox glow ring', isRgba: true },

  /* Feedback */
  { name: '--feedback-success-bg', label: 'Success Alert Background (Light)', defaultVal: 'rgba(5, 150, 105, 0.05)', description: 'Green status backdrop for successful indicators.', example: '"Tailored" status tag bg', isRgba: true },
  { name: '--feedback-success-fg', label: 'Success Alert Foreground (Light)', defaultVal: '#059669', description: 'Green status typography.', example: '"Tailored" status label text' },
  { name: '--feedback-success-border', label: 'Success Alert Border (Light)', defaultVal: 'rgba(5, 150, 105, 0.15)', description: 'Success status frame borders.', example: 'Success tag framing line', isRgba: true },
  { name: '--feedback-warning-bg', label: 'Warning Alert Background (Light)', defaultVal: 'rgba(217, 119, 6, 0.05)', description: 'Amber status backdrop for warnings.', example: 'Spillover warn tag bg', isRgba: true },
  { name: '--feedback-warning-fg', label: 'Warning Alert Foreground (Light)', defaultVal: '#d97706', description: 'Amber status text.', example: 'Spillover warn label text' },
  { name: '--feedback-warning-border', label: 'Warning Alert Border (Light)', defaultVal: 'rgba(217, 119, 6, 0.15)', description: 'Warning status borders.', example: 'Spillover tag framing line', isRgba: true },
  { name: '--feedback-error-bg', label: 'Error Alert Background (Light)', defaultVal: 'rgba(225, 29, 72, 0.05)', description: 'Rose status backdrop for error boxes.', example: 'Page cutoff warning backdrop', isRgba: true },
  { name: '--feedback-error-fg', label: 'Error Alert Foreground (Light)', defaultVal: '#e11d48', description: 'Rose status text.', example: 'Cutoff warning text' },
  { name: '--feedback-error-border', label: 'Error Alert Border (Light)', defaultVal: 'rgba(225, 29, 72, 0.15)', description: 'Error status borders.', example: 'Cutoff warning border', isRgba: true },

  /* Effects */
  { name: '--effect-glow-primary', label: 'Background Orb 1 Glow (Light)', defaultVal: 'rgba(99, 102, 241, 0.06)', description: 'Subtle light mode background orb glow color.', example: 'Decorative orb 1 glow', isRgba: true },
  { name: '--effect-glow-secondary', label: 'Background Orb 2 Glow (Light)', defaultVal: 'rgba(168, 85, 247, 0.06)', description: 'Subtle light mode background orb secondary glow color.', example: 'Decorative orb 2 glow', isRgba: true },
  { name: '--effect-checkerboard-base', label: 'Signature Canvas Base (Light)', defaultVal: '#f3f4f6', description: 'Signature checker grid canvas background color in light mode.', example: 'Signature pad grid base' },
  { name: '--effect-checkerboard-square', label: 'Signature Canvas Square (Light)', defaultVal: '#e5e7eb', description: 'Signature checker grid canvas square grid color in light mode.', example: 'Signature pad grid square' },
  { name: '--effect-scrollbar-track', label: 'Scrollbar Track (Light)', defaultVal: 'rgba(243, 244, 246, 0.5)', description: 'Track background of scroll bars.', example: 'Scroll lane track', isRgba: true },
  { name: '--effect-scrollbar-thumb', label: 'Scrollbar Slider (Light)', defaultVal: 'rgba(99, 102, 241, 0.25)', description: 'Slider handle of scroll bars.', example: 'Scroll slider thumb', isRgba: true },
  { name: '--effect-scrollbar-thumb-hover', label: 'Scrollbar Slider Hover (Light)', defaultVal: 'rgba(99, 102, 241, 0.45)', description: 'Scrollbar slider handle on hover.', example: 'Scroll thumb on hover', isRgba: true },
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
    <div className="min-h-screen bg-[var(--layout-backdrop-bg)] text-[var(--layout-backdrop-fg)] overflow-y-auto">
      {/* Header Banner */}
      <div className="sticky top-0 z-40 bg-[var(--layout-surface-panel-bg)]/95 backdrop-blur-md border-b border-white/5 px-6 py-4 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
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
                <span>Interactive Action Accents</span>
              </a>
              <a href="#dark-vars" className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-white/5 text-zinc-300 hover:text-white transition-all flex items-center gap-2">
                <Moon className="w-4 h-4 text-purple-400" />
                <span>Dark Theme Canvas & Layout</span>
              </a>
              <a href="#light-vars" className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-white/5 text-zinc-300 hover:text-white transition-all flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Theme Canvas & Layout</span>
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
              <h2 className="text-lg font-bold text-white font-sans">Universal Interactive Accents</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEFAULTS_SHARED.map((v) => renderEditorCard(v, colorsShared[v.name] || v.defaultVal, 'shared'))}
            </div>
          </section>

          {/* Dark Theme Colors */}
          <section id="dark-vars">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6">
              <Moon className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white font-sans">Dark Theme Semantic Configuration</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEFAULTS_DARK.map((v) => renderEditorCard(v, colorsDark[v.name] || v.defaultVal, 'dark'))}
            </div>
          </section>

          {/* Light Theme Colors */}
          <section id="light-vars">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-6">
              <Sun className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white font-sans">Light Theme Semantic Configuration</h2>
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
