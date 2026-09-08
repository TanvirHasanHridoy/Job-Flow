import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles, Coins, LogOut, ExternalLink } from 'lucide-react';
import { checkSession, fetchProfile, fetchTokens, submitTailor, SessionInfo, TailorResponseData } from './services/api';
import { getStoredSettings, saveStoredSettings, TailorSettings, DEFAULT_SETTINGS } from './services/storage';
import { ParsedJobData } from '../content/parsers/types';
import { AuthGate } from './components/AuthGate';
import { JobPreviewCard } from './components/JobPreviewCard';
import { TailorOptionsCard } from './components/TailorOptionsCard';
import { GeneratingState } from './components/GeneratingState';
import { ResultSuccessCard } from './components/ResultSuccessCard';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<TailorSettings>(DEFAULT_SETTINGS);
  const [session, setSession] = useState<SessionInfo>({ authenticated: false });
  const [checkingSession, setCheckingSession] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [userTokens, setUserTokens] = useState(0);

  const [currentJob, setCurrentJob] = useState<ParsedJobData | null>(null);
  const [rescanning, setRescanning] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [tailorResult, setTailorResult] = useState<TailorResponseData | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Load initial settings from chrome.storage.local
  useEffect(() => {
    getStoredSettings().then(setSettings);
  }, []);

  // Check auth session
  const verifySession = useCallback(async (baseUrl: string) => {
    setCheckingSession(true);
    try {
      const sess = await checkSession(baseUrl);
      setSession(sess);
      if (sess.authenticated) {
        setUserTokens(sess.tokens ?? 200);
        const prof = await fetchProfile(baseUrl);
        if (prof) {
          setProfile(prof);
        }
      }
    } catch (err) {
      console.warn('[JobFlow] Session verify error:', err);
    } finally {
      setCheckingSession(false);
    }
  }, []);

  useEffect(() => {
    verifySession(settings.apiBaseUrl);
  }, [settings.apiBaseUrl, verifySession]);

  // Read job from storage or query active tab
  const scanActiveTab = useCallback(async () => {
    setRescanning(true);
    // 1. Check storage first
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['currentJob'], (res) => {
        if (res.currentJob) {
          setCurrentJob(res.currentJob);
        }
      });
    }

    // 2. Query active tab content script
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'REQUEST_PARSE' }, (res) => {
            if (res?.data) {
              setCurrentJob(res.data);
            }
            setRescanning(false);
          });
        } else {
          setRescanning(false);
        }
      });
    } else {
      setRescanning(false);
    }
  }, []);

  useEffect(() => {
    scanActiveTab();

    // Listen for storage changes if content script updates currentJob
    const handleStorageChange = (changes: any) => {
      if (changes.currentJob?.newValue) {
        setCurrentJob(changes.currentJob.newValue);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => chrome.storage.onChanged.removeListener(handleStorageChange);
    }
  }, [scanActiveTab]);

  const handleUpdateSettings = (updated: Partial<TailorSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updated };
      saveStoredSettings(next);
      return next;
    });
  };

  const handleUpdateJob = (updated: Partial<ParsedJobData>) => {
    setCurrentJob((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ currentJob: next });
      }
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!currentJob || !currentJob.description) return;

    setIsGenerating(true);
    setGenerationError(null);
    setTailorResult(null);

    try {
      const payload = {
        jobDescription: currentJob.description,
        cvLanguage: settings.cvLanguage,
        clLanguage: settings.clLanguage,
        cvFormat: settings.cvFormat,
        tone: settings.tone,
        lengthTarget: 'Strict 1-Page (concise)',
        bulletStyle: settings.bulletStyle,
        clLength: settings.clLength,
        skillsFocus: 'Tech-Heavy Focus',
        customNotes: settings.customNotes,
        profile,
        matchStrategy: settings.matchStrategy,
        roleName: currentJob.title || 'Target Role',
        companyName: currentJob.company || 'Target Company',
        isNudgeEnabled: true
      };

      const result = await submitTailor(settings.apiBaseUrl, payload);
      setTailorResult(result);

      // Refresh remaining tokens
      const updatedTokens = await fetchTokens(settings.apiBaseUrl);
      setUserTokens(updatedTokens);
    } catch (err: any) {
      console.error('[JobFlow] Tailor error:', err);
      setGenerationError(err.message || 'An error occurred during tailoring.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500/30">
      {/* Extension Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-xs tracking-tight text-white">JobFlow AI</span>
        </div>

        {session.authenticated && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              <Coins className="w-3 h-3" />
              <span>{userTokens}</span>
            </div>
            <a
              href={`${settings.apiBaseUrl}/dashboard`}
              target="_blank"
              rel="noreferrer"
              title="Open JobFlow Web Dashboard"
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3.5 space-y-3">
        {checkingSession ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 min-h-[300px]">
            <Sparkles className="w-6 h-6 text-indigo-400 animate-spin mb-2" />
            <span className="text-xs">Connecting to JobFlow AI...</span>
          </div>
        ) : !session.authenticated ? (
          <AuthGate
            apiBaseUrl={settings.apiBaseUrl}
            onUpdateBaseUrl={(url) => handleUpdateSettings({ apiBaseUrl: url })}
            onRefreshSession={() => verifySession(settings.apiBaseUrl)}
            checking={checkingSession}
          />
        ) : isGenerating ? (
          <GeneratingState />
        ) : tailorResult ? (
          <ResultSuccessCard
            result={tailorResult}
            apiBaseUrl={settings.apiBaseUrl}
            onReset={() => setTailorResult(null)}
          />
        ) : (
          <>
            {generationError && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                <span className="font-bold">Error:</span>
                <span>{generationError}</span>
              </div>
            )}

            <JobPreviewCard
              job={currentJob}
              onUpdateJob={handleUpdateJob}
              onRescanPage={scanActiveTab}
              rescanning={rescanning}
            />

            <TailorOptionsCard
              settings={settings}
              personas={session.personas || [{ id: 'default', name: 'Master Profile', isDefault: true }]}
              userTokens={userTokens}
              onUpdateSettings={handleUpdateSettings}
              onGenerate={handleGenerate}
              canGenerate={Boolean(currentJob?.description && currentJob.description.trim().length > 20)}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="p-2.5 border-t border-slate-900 bg-slate-950 text-center text-[10px] text-slate-500">
        JobFlow AI Extension • v1.0.0
      </footer>
    </div>
  );
};
