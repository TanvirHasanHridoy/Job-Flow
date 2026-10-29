import React, { useState } from 'react';
import { ExternalLink, Copy, Check, FileDown, RotateCcw, Award, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { TailorResponseData } from '../services/api';

interface ResultSuccessCardProps {
  result: TailorResponseData;
  apiBaseUrl: string;
  onReset: () => void;
}

export const ResultSuccessCard: React.FC<ResultSuccessCardProps> = ({
  result,
  apiBaseUrl,
  onReset
}) => {
  const [copiedCl, setCopiedCl] = useState(false);
  const [copiedCv, setCopiedCv] = useState(false);

  const score = result.matchScore || 85;
  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400';
  const scoreBg = score >= 80 ? 'border-emerald-500/30 bg-emerald-950/20' : score >= 60 ? 'border-amber-500/30 bg-amber-950/20' : 'border-rose-500/30 bg-rose-950/20';

  const handleOpenCanvas = () => {
    const url = result.applicationId
      ? `${apiBaseUrl}/tailor?appId=${result.applicationId}`
      : `${apiBaseUrl}/tailor`;

    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  };

  const getCoverLetterText = (): string => {
    const cl = result.tailoredCoverLetter;
    if (!cl) return '';
    const paragraphs = Array.isArray(cl.paragraphs)
      ? cl.paragraphs.join('\n\n')
      : typeof cl.paragraphs === 'object'
      ? (cl.paragraphs.short || cl.paragraphs.detailed || []).join('\n\n')
      : '';

    return [
      cl.senderAddress,
      cl.recipientAddress,
      cl.dateLine,
      cl.subjectLine,
      cl.salutation,
      paragraphs,
      cl.closing,
      cl.signatureName
    ].filter(Boolean).join('\n\n');
  };

  const handleCopyCl = async () => {
    const text = getCoverLetterText();
    if (text) {
      await navigator.clipboard.writeText(text);
      setCopiedCl(true);
      setTimeout(() => setCopiedCl(false), 2000);
    }
  };

  const handleDownloadPlaintext = () => {
    const cv = result.tailoredCv;
    if (!cv) return;

    let text = `${cv.personalDetails?.fullName || 'Candidate'}\n`;
    text += `${cv.personalDetails?.email || ''} | ${cv.personalDetails?.phone || ''} | ${cv.personalDetails?.linkedin || ''}\n\n`;
    text += `SUMMARY\n${cv.summary || ''}\n\n`;
    text += `EXPERIENCE\n`;
    (cv.workExperience || []).forEach((w: any) => {
      text += `${w.role} - ${w.company} (${w.period || ''})\n`;
      const bullets = Array.isArray(w.bullets)
        ? w.bullets
        : w.bullets?.star || w.bullets?.punchy || w.bullets?.standard || [];
      bullets.forEach((b: string) => {
        text += `• ${b}\n`;
      });
      text += `\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tailored_CV_${(cv.personalDetails?.fullName || 'Candidate').replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const keywords = result.gapAnalysis?.matchingKeywords || [];
  const missing = result.gapAnalysis?.missingSkills || [];

  return (
    <div className="space-y-3.5">
      {/* Match Score Hero Card */}
      <div className={`border rounded-xl p-4 text-center ${scoreBg}`}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Award className={`w-5 h-5 ${scoreColor}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">ATS Match Rating</span>
        </div>
        <div className={`text-4xl font-extrabold tracking-tight ${scoreColor} mb-1`}>
          {score}%
        </div>
        <p className="text-[11px] text-slate-300">
          {score >= 80 ? '🎯 Exceptional Match for this Posting' : score >= 60 ? '⚡ Strong Strategic Match' : '🔍 Tailored with Strategic Bridging'}
        </p>
      </div>

      {/* Primary Action: Open in JobFlow Canvas */}
      <button
        type="button"
        onClick={handleOpenCanvas}
        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
      >
        <span>Open in JobFlow Interactive Canvas</span>
        <ExternalLink className="w-4 h-4" />
      </button>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleCopyCl}
          className="py-2 px-3 bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-[11px] font-medium rounded-lg border border-slate-700/60 flex items-center justify-center gap-1.5 transition-all"
        >
          {copiedCl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
          <span>{copiedCl ? 'Copied Cover Letter!' : 'Copy Cover Letter'}</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadPlaintext}
          className="py-2 px-3 bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-[11px] font-medium rounded-lg border border-slate-700/60 flex items-center justify-center gap-1.5 transition-all"
        >
          <FileDown className="w-3.5 h-3.5 text-indigo-400" />
          <span>Download Plaintext</span>
        </button>
      </div>

      {/* ATS Keyword Insights */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 space-y-2.5 text-left">
        {keywords.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">
              <CheckCircle2 className="w-3 h-3" />
              <span>Matched Keywords ({keywords.length})</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {keywords.slice(0, 8).map((kw, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-500/20 text-emerald-300 rounded text-[10px]">
                  {kw}
                </span>
              ))}
              {keywords.length > 8 && (
                <span className="text-[10px] text-slate-500 self-center">+{keywords.length - 8} more</span>
              )}
            </div>
          </div>
        )}

        {missing.length > 0 && (
          <div className="pt-1 border-t border-slate-700/40">
            <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
              <AlertTriangle className="w-3 h-3" />
              <span>Skill Gaps Addressed ({missing.length})</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {missing.slice(0, 6).map((m, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-amber-950/60 border border-amber-500/20 text-amber-300 rounded text-[10px]">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reset button to tailor another job */}
      <button
        type="button"
        onClick={onReset}
        className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center gap-1.5 transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Tailor another job posting</span>
      </button>
    </div>
  );
};
