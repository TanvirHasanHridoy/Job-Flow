import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react';

export const GeneratingState: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Analyzing job requirements & tech stack...',
    'Performing ATS keyword gap analysis...',
    'Generating tailored Bullet Matrix CV & STAR achievements...',
    'Drafting personalized Cover Letter & final validation...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 4000);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[420px] bg-slate-800/40 border border-slate-700/60 rounded-xl">
      {/* Animated Orb / Rings */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 via-blue-500 to-indigo-400 p-1 animate-spin-slow">
          <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 animate-ping" />
      </div>

      <h3 className="text-base font-bold text-white mb-1">
        Tailoring with JobFlow AI
      </h3>
      <p className="text-xs text-slate-400 mb-6 max-w-xs">
        Crafting an ATS-optimized, high-impact application matched specifically to this posting.
      </p>

      {/* Steps Indicator */}
      <div className="w-full max-w-xs space-y-2.5 text-left">
        {steps.map((step, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={idx}
              className={`flex items-center gap-2.5 text-xs p-2 rounded-lg border transition-all ${
                isCurrent
                  ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-200'
                  : isDone
                  ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                  : 'border-transparent text-slate-600'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
              )}
              <span className={isCurrent ? 'font-medium' : ''}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
