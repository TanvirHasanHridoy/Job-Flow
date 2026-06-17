'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Sparkles, FileText, Download, Briefcase, Award, CheckCircle2, AlertTriangle, Languages, Save, Check 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WorkExperience {
  company: string;
  role: string;
  location: string;
  period: string;
  bullets: string[];
}

interface Education {
  institution: string;
  degree: string;
  location: string;
  period: string;
}

interface Language {
  language: string;
  level: string;
}

interface TailoredCv {
  personalDetails: {
    fullName: string;
    email: string;
    phone: string;
    website?: string;
    linkedin?: string;
    github?: string;
    address?: string;
    dateOfBirth?: string;
    birthplace?: string;
    nationality?: string;
  };
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  languages: Language[];
  signingLine?: string;
}

interface TailoredCoverLetter {
  senderAddress: string;
  recipientAddress: string;
  dateLine: string;
  subjectLine: string;
  salutation: string;
  paragraphs: string[];
  closing: string;
  signatureName: string;
}

interface TailorResponse {
  matchScore: number;
  gapAnalysis: {
    missingSkills: string[];
    matchingKeywords: string[];
    recommendations: string;
  };
  tailoredCv: TailoredCv;
  tailoredCoverLetter: TailoredCoverLetter;
}

export default function TailorWorkspace() {
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Form states
  const [jobDescription, setJobDescription] = useState('');
  const [targetLanguage, setTargetLanguage] = useState<'EN' | 'DE'>('EN');
  const [companyName, setCompanyName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [salaryExpectation, setSalaryExpectation] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [signingLocation, setSigningLocation] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  // App state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TailorResponse | null>(null);
  const [previewTab, setPreviewTab] = useState<'cv' | 'coverLetter'>('cv');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Refs for PDF download
  const cvPreviewRef = useRef<HTMLDivElement>(null);
  const clPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        // If the profile is completely empty (no fullName), mark as not set
        if (data.fullName) {
          setProfile(data);
          // Set default signing location based on profile address
          if (data.address) {
            const parts = data.address.split(',');
            const city = parts[parts.length - 1] || parts[0];
            setSigningLocation(city.trim().replace(/\d+/g, '').trim());
          }
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleTailor = async () => {
    if (!jobDescription.trim() || !companyName.trim() || !roleName.trim()) {
      alert('Please fill out Company Name, Role Name, and Job Description.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          targetLanguage,
          salaryExpectation,
          noticePeriod,
          signingLocation,
          customNotes,
          profile
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Server error during tailoring');
      }

      const data = (await res.json()) as TailorResponse;
      setResult(data);
      
      // Trigger celebrate confetti if match score is high
      if (data.matchScore >= 70) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      console.error(err);
      alert(`Tailoring Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async (type: 'cv' | 'cl') => {
    const element = type === 'cv' ? cvPreviewRef.current : clPreviewRef.current;
    if (!element) return;

    try {
      // Dynamic import of html2pdf.js client-side
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin:       10,
        filename:     `${type === 'cv' ? 'Resume' : 'Cover_Letter'}_${companyName.replace(/\s+/g, '_')}_${roleName.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      html2pdf().from(element).set(opt).save();
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Trying default browser print options.');
      window.print();
    }
  };

  const saveToApplicationsTracker = async () => {
    if (!result) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: companyName,
          role: roleName,
          status: 'TAILORED',
          salaryExpectation,
          noticePeriod,
          signingLocation,
          customNotes,
          rawJobDescription: jobDescription,
          matchScore: result.matchScore,
          gapAnalysis: result.gapAnalysis,
          targetLanguage,
          documents: [
            { type: 'CV', content: JSON.stringify(result.tailoredCv) },
            { type: 'COVER_LETTER', content: JSON.stringify(result.tailoredCoverLetter) }
          ]
        })
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      alert(`Failed to save: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Inline result editing handlers
  const handleCvDetailsChange = (key: string, value: string) => {
    if (!result) return;
    setResult({
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        personalDetails: {
          ...result.tailoredCv.personalDetails,
          [key]: value
        }
      }
    });
  };

  const handleCvSummaryChange = (val: string) => {
    if (!result) return;
    setResult({
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        summary: val
      }
    });
  };

  const handleClParagraphChange = (index: number, val: string) => {
    if (!result) return;
    const newParagraphs = [...result.tailoredCoverLetter.paragraphs];
    newParagraphs[index] = val;
    setResult({
      ...result,
      tailoredCoverLetter: {
        ...result.tailoredCoverLetter,
        paragraphs: newParagraphs
      }
    });
  };

  if (profileLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin mb-4"></div>
        <p className="text-zinc-400 text-sm animate-pulse">Loading Workspace...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl mb-6">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Master Profile Vault is Empty</h2>
        <p className="text-zinc-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
          Before tailoring a CV or Resume, you need to populate your master details. This serves as the factual basis that the AI uses to structure your applications.
        </p>
        <Link 
          href="/profile" 
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all duration-300"
        >
          Setup Master Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[calc(100vh-73px)]">
      
      {/* Left Input Pane: Col 5 */}
      <div className="lg:col-span-5 border-r border-white/5 bg-zinc-950/40 p-6 md:p-8 overflow-y-auto max-h-[calc(100vh-73px)] space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            AI Tailoring Workspace
          </h1>
          <p className="text-xs text-zinc-400">
            Feed the job post requirements and details. The engine builds hyper-aligned outputs based exclusively on your master details.
          </p>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. BMW Group"
                className="glass-input px-3.5 py-2.5 text-xs"
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Role Name</label>
              <input
                type="text"
                value={roleName}
                onChange={e => setRoleName(e.target.value)}
                placeholder="e.g. Senior Cloud Engineer"
                className="glass-input px-3.5 py-2.5 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Target Language</label>
              <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                <Languages className="w-3 h-3" />
                Selects cultural format rules
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setTargetLanguage('EN')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  targetLanguage === 'EN' 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                English (US/UK Resume Style)
              </button>
              <button
                type="button"
                onClick={() => setTargetLanguage('DE')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  targetLanguage === 'DE' 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                German (DIN 5008 / Tabellarisch)
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Job Description (Raw Text)</label>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the target job description or requirements here..."
              rows={6}
              className="glass-input p-3 text-xs font-mono w-full resize-none"
            />
          </div>

          {/* Context Panel Toggle */}
          <div className="border border-white/5 bg-white/[0.01] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              Additional Details / Overrides
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Salary Expectation</label>
                <input
                  type="text"
                  value={salaryExpectation}
                  onChange={e => setSalaryExpectation(e.target.value)}
                  placeholder="e.g. €85,000 / year"
                  className="glass-input px-3 py-2 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Notice Period / Availability</label>
                <input
                  type="text"
                  value={noticePeriod}
                  onChange={e => setNoticePeriod(e.target.value)}
                  placeholder="e.g. 2 months notice"
                  className="glass-input px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Signing Location</label>
                <input
                  type="text"
                  value={signingLocation}
                  onChange={e => setSigningLocation(e.target.value)}
                  placeholder="e.g. Munich"
                  className="glass-input px-3 py-2 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Custom Focus Notes</label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  placeholder="e.g. Highlight AWS, omit old PHP"
                  className="glass-input px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleTailor}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Analyzing Job & Tailoring Documents...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 animate-pulse" />
                Tailor CV & Cover Letter Now
              </>
            )}
          </button>
        </div>

        {/* Scorecard and Analysis Result */}
        {result && (
          <div className="pt-6 border-t border-white/5 space-y-5">
            <div>
              <h2 className="text-md font-bold text-white mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                AI Match Scorecard & Insights
              </h2>
              <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-4 border-zinc-800">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin-slow"></div>
                  <span className="font-extrabold text-white text-lg">{result.matchScore}%</span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Keyword/Skill Alignment</h4>
                  <p className="text-xs text-zinc-400">Based on factual CV entries parsed against target requirements.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                <h4 className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Matching Keywords
                </h4>
                <div className="flex flex-wrap gap-1">
                  {result.gapAnalysis.matchingKeywords.map((k, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300">{k}</span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                <h4 className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Missing / Skill Gaps
                </h4>
                <div className="flex flex-wrap gap-1">
                  {result.gapAnalysis.missingSkills.length > 0 ? (
                    result.gapAnalysis.missingSkills.map((s, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300">{s}</span>
                    ))
                  ) : (
                    <span className="text-[10px] text-zinc-500">Perfect keyword alignment!</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-xs space-y-1">
              <h4 className="font-bold text-indigo-300">AI Placement Recommendation</h4>
              <p className="text-zinc-300 leading-relaxed">{result.gapAnalysis.recommendations}</p>
            </div>

            {/* Editable Fields Box */}
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Quick Inline Editor</h3>
              <p className="text-[10px] text-zinc-500">Edit details below. The live preview on the right will update in real-time.</p>
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400">Personal Contact Detail Header</label>
                <input
                  type="text"
                  value={result.tailoredCv.personalDetails.fullName}
                  onChange={e => handleCvDetailsChange('fullName', e.target.value)}
                  className="glass-input px-3 py-1.5 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400">CV Professional Summary</label>
                <textarea
                  value={result.tailoredCv.summary}
                  onChange={e => handleCvSummaryChange(e.target.value)}
                  rows={4}
                  className="glass-input p-2 text-xs resize-none"
                />
              </div>

              {previewTab === 'coverLetter' && result.tailoredCoverLetter.paragraphs.map((para, pIdx) => (
                <div key={pIdx} className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-400">Cover Letter Paragraph {pIdx + 1}</label>
                  <textarea
                    value={para}
                    onChange={e => handleClParagraphChange(pIdx, e.target.value)}
                    rows={4}
                    className="glass-input p-2 text-xs resize-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveToApplicationsTracker}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Saved to Tracker!
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save Application Tracker
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Preview Pane: Col 7 */}
      <div className="lg:col-span-7 bg-[#0b081e]/30 flex flex-col overflow-y-auto max-h-[calc(100vh-73px)]">
        {/* Toolbar */}
        <div className="sticky top-0 z-20 no-print flex items-center justify-between px-6 py-3 bg-[#0a061b] border-b border-white/5">
          <div className="flex gap-1.5">
            <button
              onClick={() => setPreviewTab('cv')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                previewTab === 'cv' 
                  ? 'bg-zinc-800 text-white' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Tailored {targetLanguage === 'DE' ? 'Lebenslauf' : 'Resume'}
            </button>
            <button
              onClick={() => setPreviewTab('coverLetter')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                previewTab === 'coverLetter' 
                  ? 'bg-zinc-800 text-white' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Tailored {targetLanguage === 'DE' ? 'Anschreiben' : 'Cover Letter'}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-zinc-500 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
            <span>💡 Tip: Click any text on the page below to edit directly</span>
          </div>

          {result && (
            <button
              onClick={() => handleExportPdf(previewTab === 'cv' ? 'cv' : 'cl')}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold border border-white/5 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF Export
            </button>
          )}
        </div>

        {/* Live A4 Sheet Render */}
        <div className="flex-1 p-6 md:p-8 bg-[#040116] flex items-start justify-center">
          {result ? (
            <div className="w-full max-w-[210mm] overflow-x-auto shadow-2xl rounded-lg border border-white/5">
              
              {/* CV Preview Page */}
              {previewTab === 'cv' && (
                <div 
                  ref={cvPreviewRef} 
                  id="cv-sheet"
                  className="w-[210mm] min-h-[297mm] p-[20mm] font-serif relative flex flex-col justify-between"
                  style={{ pageBreakInside: 'avoid', backgroundColor: '#ffffff', color: '#000000' }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ borderBottom: '2px solid #27272a', paddingBottom: '16px', marginBottom: '24px' }}>
                      <h1 
                        contentEditable={true} 
                        suppressContentEditableWarning={true}
                        style={{ fontSize: '1.875rem', fontWeight: 'bold', letterSpacing: '-0.025em', color: '#18181b', marginBottom: '4px' }}
                      >
                        {result.tailoredCv.personalDetails.fullName}
                      </h1>
                      <div 
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        className="flex flex-wrap gap-x-4 gap-y-1 mt-1 font-sans" 
                        style={{ fontSize: '0.75rem', color: '#52525b' }}
                      >
                        <span>Email: {result.tailoredCv.personalDetails.email}</span>
                        <span>Phone: {result.tailoredCv.personalDetails.phone}</span>
                        {result.tailoredCv.personalDetails.address && (
                          <span>Address: {result.tailoredCv.personalDetails.address}</span>
                        )}
                        {result.tailoredCv.personalDetails.website && (
                          <span>Web: {result.tailoredCv.personalDetails.website}</span>
                        )}
                        {result.tailoredCv.personalDetails.linkedin && (
                          <span>LinkedIn: {result.tailoredCv.personalDetails.linkedin}</span>
                        )}
                        {result.tailoredCv.personalDetails.github && (
                          <span>GitHub: {result.tailoredCv.personalDetails.github}</span>
                        )}
                      </div>

                      {/* DACH Meta Fields, Conditionally display ONLY in German */}
                      {targetLanguage === 'DE' && (
                        <div 
                          contentEditable={true}
                          suppressContentEditableWarning={true}
                          className="grid grid-cols-3 font-sans"
                          style={{ fontSize: '11px', color: '#3f3f46', borderTop: '1px solid #f4f4f5', paddingTop: '8px', marginTop: '8px' }}
                        >
                          {result.tailoredCv.personalDetails.dateOfBirth && (
                            <span>Geburtsdatum: {result.tailoredCv.personalDetails.dateOfBirth}</span>
                          )}
                          {result.tailoredCv.personalDetails.birthplace && (
                            <span>Geburtsort: {result.tailoredCv.personalDetails.birthplace}</span>
                          )}
                          {result.tailoredCv.personalDetails.nationality && (
                            <span>Staatsangehörigkeit: {result.tailoredCv.personalDetails.nationality}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Summary */}
                    {result.tailoredCv.summary && (
                      <div className="mb-6">
                        <p 
                          contentEditable={true}
                          suppressContentEditableWarning={true}
                          style={{ fontSize: '0.75rem', fontStyle: 'italic', lineHeight: '1.625', color: '#27272a' }}
                        >
                          {result.tailoredCv.summary}
                        </p>
                      </div>
                    )}

                    {/* Tabular Style for German, Top-Down for English */}
                    {targetLanguage === 'DE' ? (
                      // Tabellarischer Lebenslauf (DACH Standard)
                      <div className="space-y-6">
                        {/* Work Experience */}
                        <div>
                          <h3 
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            style={{ fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#18181b', borderBottom: '1px solid #d4d4d8', paddingBottom: '4px', marginBottom: '12px' }}
                          >
                            Beruflicher Werdegang
                          </h3>
                          <div className="space-y-4">
                            {result.tailoredCv.workExperience.map((exp, idx) => (
                              <div key={idx} className="grid grid-cols-12 gap-4 text-xs">
                                <div contentEditable={true} suppressContentEditableWarning={true} className="col-span-3 font-sans" style={{ color: '#71717a' }}>{exp.period}</div>
                                <div className="col-span-9">
                                  <h4 contentEditable={true} suppressContentEditableWarning={true} style={{ fontWeight: 'bold', color: '#18181b' }}>{exp.role}</h4>
                                  <div contentEditable={true} suppressContentEditableWarning={true} className="italic font-sans mb-1.5" style={{ color: '#52525b' }}>{exp.company}, {exp.location}</div>
                                  <ul className="list-disc list-outside ml-4 space-y-1" style={{ color: '#27272a' }}>
                                    {exp.bullets.map((b, bIdx) => (
                                      <li key={bIdx} contentEditable={true} suppressContentEditableWarning={true} className="leading-relaxed">{b}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Education */}
                        <div>
                          <h3 
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            style={{ fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#18181b', borderBottom: '1px solid #d4d4d8', paddingBottom: '4px', marginBottom: '12px' }}
                          >
                            Ausbildung
                          </h3>
                          <div className="space-y-3">
                            {result.tailoredCv.education.map((edu, idx) => (
                              <div key={idx} className="grid grid-cols-12 gap-4 text-xs">
                                <div contentEditable={true} suppressContentEditableWarning={true} className="col-span-3 font-sans" style={{ color: '#71717a' }}>{edu.period}</div>
                                <div className="col-span-9">
                                  <h4 contentEditable={true} suppressContentEditableWarning={true} style={{ fontWeight: 'bold', color: '#18181b' }}>{edu.degree}</h4>
                                  <div contentEditable={true} suppressContentEditableWarning={true} className="font-sans" style={{ color: '#52525b' }}>{edu.institution}, {edu.location}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Skills & Languages */}
                        <div className="grid grid-cols-2 gap-8 text-xs pt-2">
                          <div>
                            <h3 
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#18181b', borderBottom: '1px solid #d4d4d8', paddingBottom: '4px', marginBottom: '8px' }}
                            >
                              Kenntnisse
                            </h3>
                            <div 
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              className="flex flex-wrap gap-1.5 font-sans" 
                              style={{ color: '#27272a' }}
                            >
                              {result.tailoredCv.skills.join(', ')}
                            </div>
                          </div>
                          <div>
                            <h3 
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#18181b', borderBottom: '1px solid #d4d4d8', paddingBottom: '4px', marginBottom: '8px' }}
                            >
                              Sprachen
                            </h3>
                            <div 
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              className="space-y-0.5 font-sans" 
                              style={{ color: '#27272a' }}
                            >
                              {result.tailoredCv.languages.map((l, i) => (
                                <div key={i}>{l.language}: {l.level}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // English Resume Layout (US/UK Standard)
                      <div className="space-y-6">
                        {/* Work Experience */}
                        <div>
                          <h3 
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            style={{ fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#18181b', borderBottom: '1px solid #d4d4d8', paddingBottom: '4px', marginBottom: '12px' }}
                          >
                            Work Experience
                          </h3>
                          <div className="space-y-4">
                            {result.tailoredCv.workExperience.map((exp, idx) => (
                              <div key={idx} className="text-xs">
                                <div className="flex justify-between items-baseline mb-1">
                                  <h4 contentEditable={true} suppressContentEditableWarning={true} style={{ fontWeight: 'bold', color: '#18181b', fontSize: '0.875rem' }}>{exp.role}</h4>
                                  <span contentEditable={true} suppressContentEditableWarning={true} className="font-sans" style={{ color: '#71717a' }}>{exp.period}</span>
                                </div>
                                <div className="flex justify-between items-baseline italic font-sans mb-1.5" style={{ color: '#52525b' }}>
                                  <span contentEditable={true} suppressContentEditableWarning={true}>{exp.company}, {exp.location}</span>
                                </div>
                                <ul className="list-disc list-outside ml-4 space-y-1" style={{ color: '#27272a' }}>
                                  {exp.bullets.map((b, bIdx) => (
                                    <li key={bIdx} contentEditable={true} suppressContentEditableWarning={true} className="leading-relaxed">{b}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Education */}
                        <div>
                          <h3 
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            style={{ fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#18181b', borderBottom: '1px solid #d4d4d8', paddingBottom: '4px', marginBottom: '12px' }}
                          >
                            Education
                          </h3>
                          <div className="space-y-3">
                            {result.tailoredCv.education.map((edu, idx) => (
                              <div key={idx} className="text-xs">
                                <div className="flex justify-between items-baseline">
                                  <h4 contentEditable={true} suppressContentEditableWarning={true} style={{ fontWeight: 'bold', color: '#18181b' }}>{edu.degree}</h4>
                                  <span contentEditable={true} suppressContentEditableWarning={true} className="font-sans" style={{ color: '#71717a' }}>{edu.period}</span>
                                </div>
                                <div contentEditable={true} suppressContentEditableWarning={true} className="font-sans" style={{ color: '#52525b' }}>{edu.institution}, {edu.location}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Skills & Languages */}
                        <div className="grid grid-cols-2 gap-8 text-xs pt-2">
                          <div>
                            <h3 
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#18181b', borderBottom: '1px solid #d4d4d8', paddingBottom: '4px', marginBottom: '8px' }}
                            >
                              Technical Skills
                            </h3>
                            <div 
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              className="flex flex-wrap gap-1 font-sans leading-relaxed" 
                              style={{ color: '#27272a' }}
                            >
                              {result.tailoredCv.skills.join(', ')}
                            </div>
                          </div>
                          <div>
                            <h3 
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#18181b', borderBottom: '1px solid #d4d4d8', paddingBottom: '4px', marginBottom: '8px' }}
                            >
                              Languages
                            </h3>
                            <div 
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              className="space-y-0.5 font-sans" 
                              style={{ color: '#27272a' }}
                            >
                              {result.tailoredCv.languages.map((l, i) => (
                                <div key={i}>{l.language} ({l.level})</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* German Signature Place at bottom */}
                  {targetLanguage === 'DE' && result.tailoredCv.signingLine && (
                    <div 
                      className="mt-12 pt-8 font-sans flex justify-between items-end" 
                      style={{ borderTop: '1px solid #f4f4f5', fontSize: '0.75rem', color: '#3f3f46' }}
                    >
                      <div>
                        <p contentEditable={true} suppressContentEditableWarning={true} className="mb-8">{result.tailoredCv.signingLine}</p>
                        <div className="w-48 pt-1" style={{ borderTop: '1px solid #a1a1aa' }}>Unterschrift</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cover Letter Preview Page */}
              {previewTab === 'coverLetter' && (
                <div 
                  ref={clPreviewRef} 
                  id="cl-sheet"
                  className="w-[210mm] min-h-[297mm] p-[20mm] font-serif relative flex flex-col justify-between"
                  style={{ pageBreakInside: 'avoid', backgroundColor: '#ffffff', color: '#000000' }}
                >
                  <div className="text-xs">
                    {/* DIN 5008 Layout Alignment */}
                    <div className="grid grid-cols-12 gap-4 mb-10 font-sans">
                      {/* Sender block */}
                      <div className="col-span-6" style={{ color: '#52525b' }}>
                        <pre 
                          contentEditable={true}
                          suppressContentEditableWarning={true}
                          className="font-sans text-[10px] leading-relaxed whitespace-pre-wrap"
                        >
                          {result.tailoredCoverLetter.senderAddress}
                        </pre>
                      </div>

                      {/* Recipient block */}
                      <div className="col-span-6 p-3 rounded" style={{ color: '#18181b', backgroundColor: '#fafafa', border: '1px solid #f4f4f5' }}>
                        <pre 
                          contentEditable={true}
                          suppressContentEditableWarning={true}
                          className="font-sans text-[10px] leading-relaxed whitespace-pre-wrap font-semibold"
                        >
                          {result.tailoredCoverLetter.recipientAddress}
                        </pre>
                      </div>
                    </div>

                    {/* Date Block */}
                    <div 
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      className="text-right font-sans mb-10" 
                      style={{ color: '#52525b' }}
                    >
                      {result.tailoredCoverLetter.dateLine}
                    </div>

                    {/* Subject Line */}
                    <div 
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      style={{ fontWeight: 'bold', fontSize: '0.875rem', color: '#18181b', marginBottom: '24px', lineHeight: '1.25' }}
                    >
                      {result.tailoredCoverLetter.subjectLine}
                    </div>

                    {/* Salutation */}
                    <div 
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      className="mb-4 font-sans" 
                      style={{ color: '#18181b' }}
                    >
                      {result.tailoredCoverLetter.salutation}
                    </div>

                    {/* Body Paragraphs */}
                    <div className="space-y-4 leading-relaxed font-serif" style={{ color: '#27272a', fontSize: '12px' }}>
                      {result.tailoredCoverLetter.paragraphs.map((p, i) => (
                        <p 
                          key={i}
                          contentEditable={true}
                          suppressContentEditableWarning={true}
                        >
                          {p}
                        </p>
                      ))}
                    </div>

                    {/* Closing Block */}
                    <div className="mt-8 font-sans" style={{ color: '#18181b' }}>
                      <p contentEditable={true} suppressContentEditableWarning={true} className="mb-8">{result.tailoredCoverLetter.closing}</p>
                      <p contentEditable={true} suppressContentEditableWarning={true} className="font-bold">{result.tailoredCoverLetter.signatureName}</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500 border border-dashed border-white/10 rounded-2xl w-full max-w-lg">
              <FileText className="w-12 h-12 mb-3 text-zinc-600" />
              <h3 className="font-bold text-zinc-300 mb-1 text-md">Document Preview Engine</h3>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                Inputs are empty. Provide the job details on the left and trigger tailoring to render high-fidelity, culturally conforming documents here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
