export interface TailorSettings {
  cvLanguage: 'EN' | 'DE';
  clLanguage: 'EN' | 'DE';
  cvFormat: 'bullet-matrix' | 'visual' | 'ats';
  selectedPersonaId: string;
  tone: string;
  bulletStyle: string;
  clLength: string;
  matchStrategy: 'TACTICAL_PIVOT' | 'AGGRESIVE_BRIDGING';
  customNotes: string;
  apiBaseUrl: string;
}

export const DEFAULT_SETTINGS: TailorSettings = {
  cvLanguage: 'EN',
  clLanguage: 'EN',
  cvFormat: 'bullet-matrix',
  selectedPersonaId: 'default',
  tone: 'Bold & Action-oriented',
  bulletStyle: 'STAR Method',
  clLength: 'Short & Punchy (under 300 words)',
  matchStrategy: 'TACTICAL_PIVOT',
  customNotes: '',
  apiBaseUrl: 'http://localhost:3000'
};

export async function getStoredSettings(): Promise<TailorSettings> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['tailorSettings'], (result) => {
        resolve({ ...DEFAULT_SETTINGS, ...(result.tailorSettings || {}) });
      });
    } else {
      resolve(DEFAULT_SETTINGS);
    }
  });
}

export async function saveStoredSettings(settings: Partial<TailorSettings>): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['tailorSettings'], (result) => {
        const updated = { ...(result.tailorSettings || DEFAULT_SETTINGS), ...settings };
        chrome.storage.local.set({ tailorSettings: updated }, () => resolve());
      });
    } else {
      resolve();
    }
  });
}
