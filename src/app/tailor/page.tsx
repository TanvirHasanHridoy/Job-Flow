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

const getTemplateStyles = (template: 'CLASSIC_CORPORATE' | 'MODERN_MINIMALIST' | 'TECH_CREATIVE') => {
  switch (template) {
    case 'MODERN_MINIMALIST':
      return {
        fontFamily: 'Outfit, Inter, sans-serif',
        padding: '24mm',
        headerBorderBottom: '1px solid #e4e4e7',
        headingTextTransform: 'lowercase' as const,
        headingLetterSpacing: '0.025em',
        sectionSpacing: '28px',
        accentColor: '#18181b',
        titleFont: 'Outfit, Inter, sans-serif',
        titleColor: '#09090b',
        textColor: '#27272a',
        borderColor: '#e4e4e7'
      };
    case 'TECH_CREATIVE':
      return {
        fontFamily: 'Inter, monospace, sans-serif',
        padding: '18mm',
        headerBorderBottom: '3px solid #6366f1',
        headingTextTransform: 'uppercase' as const,
        headingLetterSpacing: '0.05em',
        sectionSpacing: '24px',
        accentColor: '#6366f1',
        titleFont: 'Outfit, monospace',
        titleColor: '#312e81',
        textColor: '#1f2937',
        borderColor: '#818cf8'
      };
    case 'CLASSIC_CORPORATE':
    default:
      return {
        fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
        padding: '20mm',
        headerBorderBottom: '2px solid #27272a',
        headingTextTransform: 'uppercase' as const,
        headingLetterSpacing: '0.05em',
        sectionSpacing: '24px',
        accentColor: '#18181b',
        titleFont: 'Georgia, serif',
        titleColor: '#18181b',
        textColor: '#27272a',
        borderColor: '#d4d4d8'
      };
  }
};

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

  // Strategy & Style States
  const [matchStrategy, setMatchStrategy] = useState<'TACTICAL_PIVOT' | 'AGGRESIVE_BRIDGING'>('TACTICAL_PIVOT');
  const [styleTemplate, setStyleTemplate] = useState<'CLASSIC_CORPORATE' | 'MODERN_MINIMALIST' | 'TECH_CREATIVE'>('CLASSIC_CORPORATE');
  const [editingAppId, setEditingAppId] = useState<string | null>(null);

  // App state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TailorResponse | null>(null);
  const [previewTab, setPreviewTab] = useState<'cv' | 'coverLetter'>('cv');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  // Refs for PDF download
  const cvPreviewRef = useRef<HTMLDivElement>(null);
  const clPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfile();
    
    // Check for appId query parameter in raw location string
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const appId = urlParams.get('appId');
      if (appId) {
        setEditingAppId(appId);
        fetchApplicationForEditing(appId);
      }
    }
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
          if (data.address && !signingLocation) {
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

  const fetchApplicationForEditing = async (appId: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}`);
      if (res.ok) {
        const app = await res.json();
        setCompanyName(app.company);
        setRoleName(app.role);
        setJobDescription(app.rawJobDescription);
        setTargetLanguage(app.targetLanguage as 'EN' | 'DE');
        setSalaryExpectation(app.salaryExpectation || '');
        setNoticePeriod(app.noticePeriod || '');
        setSigningLocation(app.signingLocation || '');
        setCustomNotes(app.customNotes || '');
        
        // Locate matching documents
        const cvDoc = app.documents.find((d: any) => d.type === 'CV');
        const clDoc = app.documents.find((d: any) => d.type === 'COVER_LETTER');
        
        if (cvDoc && clDoc) {
          setResult({
            matchScore: app.matchScore,
            gapAnalysis: app.gapAnalysis,
            tailoredCv: JSON.parse(cvDoc.content),
            tailoredCoverLetter: JSON.parse(clDoc.content)
          });
        }
      }
    } catch (err) {
      console.error('Error loading application details:', err);
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
          profile,
          matchStrategy,
          applicationId: editingAppId
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
      const opt = {
        margin:       10,
        filename:     `${type === 'cv' ? 'Resume' : 'Cover_Letter'}_${companyName.replace(/\s+/g, '_')}_${roleName.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      // 1. Temporarily sanitize stylesheets containing oklch/lab colors to prevent html2canvas crash
      const originalStyleStates: { ownerNode: HTMLElement; disabled: boolean }[] = [];
      const tempStyleElements: HTMLStyleElement[] = [];

      // Create a static array of stylesheets to prevent processing newly added ones
      const sheets = Array.from(document.styleSheets);

      for (const sheet of sheets) {
        try {
          const ownerNode = sheet.ownerNode as HTMLElement;
          if (!ownerNode) continue;

          let cssText = '';
          if (ownerNode.tagName === 'STYLE') {
            cssText = ownerNode.innerHTML;
          } else if (sheet.href) {
            // For link tags, fetch the cached content to avoid slow cssRules serialization
            try {
              const res = await fetch(sheet.href);
              if (res.ok) {
                cssText = await res.text();
              }
            } catch (err) {
              console.warn('Could not fetch external stylesheet:', sheet.href, err);
            }
          }

          if (
            cssText && (
              cssText.includes('oklch') ||
              cssText.includes('oklab') ||
              cssText.includes('lab(') ||
              cssText.includes('lch(')
            )
          ) {
            // Disable original stylesheet
            originalStyleStates.push({
              ownerNode,
              disabled: (ownerNode as any).disabled
            });
            (ownerNode as any).disabled = true;

            // Clean the CSS of modern colors
            const cleanedText = cssText
              .replace(/oklch\([^)]+\)/g, 'rgb(120, 120, 120)')
              .replace(/oklab\([^)]+\)/g, 'rgb(120, 120, 120)')
              .replace(/lab\([^)]+\)/g, 'rgb(120, 120, 120)')
              .replace(/lch\([^)]+\)/g, 'rgb(120, 120, 120)');

            // Create temporary clean style element
            const tempStyle = document.createElement('style');
            tempStyle.setAttribute('data-temp-clean-css', 'true');
            tempStyle.innerHTML = cleanedText;
            document.head.appendChild(tempStyle);
            tempStyleElements.push(tempStyle);
          }
        } catch (e) {
          console.warn('Error sanitizing stylesheet:', e);
        }
      }

      // 2. Export to PDF
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf().from(element).set(opt).save();

      // 3. Restore all disabled stylesheets
      originalStyleStates.forEach(({ ownerNode, disabled }) => {
        (ownerNode as any).disabled = disabled;
      });
      tempStyleElements.forEach(el => el.remove());
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Trying default browser print options.');
      window.print();
    }
  };

  const handleExportWord = () => {
    const type = previewTab === 'cv' ? 'cv' : 'cl';
    const element = type === 'cv' ? cvPreviewRef.current : clPreviewRef.current;
    if (!element) return;

    // Get the HTML content of the sheet
    const htmlContent = element.innerHTML;

    // Add XML wrappers and simple formatting styles for Word Document
    const header = `<html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <meta charset="utf-8">
            <title>JobFlow Document</title>
            <!--[if gte mso 9]>
            <xml>
              <w:WordDocument>
                <w:View>Print</w:View>
                <w:Zoom>100</w:Zoom>
              </w:WordDocument>
            </xml>
            <![endif]-->
            <style>
              body {
                font-family: Georgia, serif;
                font-size: 11pt;
                line-height: 1.5;
                color: #000000;
              }
              pre {
                font-family: Arial, sans-serif;
                white-space: pre-wrap;
              }
              h1, h2, h3, h4 {
                font-family: Arial, sans-serif;
                color: #111111;
                margin-top: 12pt;
                margin-bottom: 6pt;
              }
            </style>
          </head>
          <body>`;
    
    const footer = `</body></html>`;
    const docContent = header + htmlContent + footer;

    // Create a Blob and trigger download
    const blob = new Blob(['\ufeff' + docContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type === 'cv' ? 'Resume' : 'Cover_Letter'}_${companyName.replace(/\s+/g, '_')}_${roleName.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportText = () => {
    if (!result) return;
    const type = previewTab === 'cv' ? 'cv' : 'cl';
    
    let textContent = '';

    if (type === 'cv') {
      const cv = result.tailoredCv;
      textContent += `==================================================\n`;
      textContent += `   ${cv.personalDetails.fullName.toUpperCase()}\n`;
      textContent += `==================================================\n\n`;
      textContent += `Email: ${cv.personalDetails.email}\n`;
      textContent += `Phone: ${cv.personalDetails.phone}\n`;
      if (cv.personalDetails.address) textContent += `Address: ${cv.personalDetails.address}\n`;
      if (cv.personalDetails.website) textContent += `Web: ${cv.personalDetails.website}\n`;
      if (cv.personalDetails.linkedin) textContent += `LinkedIn: ${cv.personalDetails.linkedin}\n`;
      if (cv.personalDetails.github) textContent += `GitHub: ${cv.personalDetails.github}\n\n`;

      if (targetLanguage === 'DE') {
        if (cv.personalDetails.dateOfBirth) textContent += `Geburtsdatum: ${cv.personalDetails.dateOfBirth}\n`;
        if (cv.personalDetails.birthplace) textContent += `Geburtsort: ${cv.personalDetails.birthplace}\n`;
        if (cv.personalDetails.nationality) textContent += `Staatsangehörigkeit: ${cv.personalDetails.nationality}\n\n`;
      }

      if (cv.summary) {
        textContent += `PROFESSIONAL SUMMARY\n`;
        textContent += `--------------------------------------------------\n`;
        textContent += `${cv.summary}\n\n`;
      }

      textContent += `WORK EXPERIENCE\n`;
      textContent += `--------------------------------------------------\n`;
      cv.workExperience.forEach((exp) => {
        textContent += `${exp.role} | ${exp.company} - ${exp.location}\n`;
        textContent += `Period: ${exp.period}\n`;
        exp.bullets.forEach((bullet) => {
          const cleanBullet = bullet.replace(/<[^>]*>/g, '');
          textContent += `- ${cleanBullet}\n`;
        });
        textContent += `\n`;
      });

      textContent += `EDUCATION\n`;
      textContent += `--------------------------------------------------\n`;
      cv.education.forEach((edu) => {
        textContent += `${edu.degree} | ${edu.institution} - ${edu.location}\n`;
        textContent += `Period: ${edu.period}\n\n`;
      });

      textContent += `SKILLS\n`;
      textContent += `--------------------------------------------------\n`;
      textContent += `${cv.skills.join(', ')}\n\n`;

      textContent += `LANGUAGES\n`;
      textContent += `--------------------------------------------------\n`;
      cv.languages.forEach((lang) => {
        textContent += `${lang.language}: ${lang.level}\n`;
      });

      if (cv.signingLine) {
        textContent += `\n\n${cv.signingLine}\n`;
      }
    } else {
      const cl = result.tailoredCoverLetter;
      textContent += `SENDER:\n${cl.senderAddress}\n\n`;
      textContent += `RECIPIENT:\n${cl.recipientAddress}\n\n`;
      textContent += `DATE: ${cl.dateLine}\n\n`;
      textContent += `SUBJECT: ${cl.subjectLine}\n\n`;
      textContent += `${cl.salutation}\n\n`;
      cl.paragraphs.forEach((p) => {
        const cleanPara = p.replace(/<[^>]*>/g, '');
        textContent += `${cleanPara}\n\n`;
      });
      textContent += `${cl.closing}\n\n`;
      textContent += `${cl.signatureName}\n`;
    }

    // Strip out remaining HTML tags that could be in text from editing
    textContent = textContent.replace(/<[^>]*>/g, '');

    // Download file
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type === 'cv' ? 'Resume' : 'Cover_Letter'}_${companyName.replace(/\s+/g, '_')}_${roleName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const saveToApplicationsTracker = async () => {
    if (!result) return;
    setIsSaving(true);
    setSaveSuccess(false);

    const payload = {
      company: companyName,
      role: roleName,
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
    };

    try {
      const url = editingAppId ? `/api/applications/${editingAppId}` : '/api/applications';
      const method = editingAppId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

  const handleWorkExperienceChange = (expIdx: number, key: 'period' | 'role' | 'company' | 'location', value: string) => {
    if (!result) return;
    const newWorkExp = [...result.tailoredCv.workExperience];
    newWorkExp[expIdx] = {
      ...newWorkExp[expIdx],
      [key]: value
    };
    setResult({
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        workExperience: newWorkExp
      }
    });
  };

  const handleWorkExperienceBulletChange = (expIdx: number, bulletIdx: number, value: string) => {
    if (!result) return;
    const newWorkExp = [...result.tailoredCv.workExperience];
    const newBullets = [...newWorkExp[expIdx].bullets];
    newBullets[bulletIdx] = value;
    newWorkExp[expIdx] = {
      ...newWorkExp[expIdx],
      bullets: newBullets
    };
    setResult({
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        workExperience: newWorkExp
      }
    });
  };

  const handleEducationChange = (eduIdx: number, key: 'period' | 'degree' | 'institution' | 'location', value: string) => {
    if (!result) return;
    const newEdu = [...result.tailoredCv.education];
    newEdu[eduIdx] = {
      ...newEdu[eduIdx],
      [key]: value
    };
    setResult({
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        education: newEdu
      }
    });
  };

  const handleSkillsChange = (value: string) => {
    if (!result) return;
    const newSkills = value.split(',').map(s => s.trim()).filter(Boolean);
    setResult({
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        skills: newSkills
      }
    });
  };

  const handleLanguagesChange = (idx: number, key: 'language' | 'level', value: string) => {
    if (!result) return;
    const newLanguages = [...result.tailoredCv.languages];
    newLanguages[idx] = {
      ...newLanguages[idx],
      [key]: value
    };
    setResult({
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        languages: newLanguages
      }
    });
  };

  const handleSigningLineChange = (value: string) => {
    if (!result) return;
    setResult({
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        signingLine: value
      }
    });
  };

  const handleClChange = (key: keyof TailoredCoverLetter, value: string) => {
    if (!result) return;
    setResult({
      ...result,
      tailoredCoverLetter: {
        ...result.tailoredCoverLetter,
        [key]: value
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

  const s = getTemplateStyles(styleTemplate);

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

          {/* Match Strategy Selection */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Match Strategy</label>
              <span className="text-[9px] text-zinc-500 font-medium">Selects AI prompt logic</span>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setMatchStrategy('TACTICAL_PIVOT')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  matchStrategy === 'TACTICAL_PIVOT' 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Explain skill gaps constructively in the cover letter"
              >
                Tactical Pivot
              </button>
              <button
                type="button"
                onClick={() => setMatchStrategy('AGGRESIVE_BRIDGING')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  matchStrategy === 'AGGRESIVE_BRIDGING' 
                    ? 'bg-indigo-600 text-white shadow' 
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Optimize terminology aggressively to align with ATS filters"
              >
                Aggressive Bridging
              </button>
            </div>
          </div>

          {/* Style Template Selection */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Visual Layout Style</label>
              <span className="text-[9px] text-zinc-500 font-medium">Selects document design theme</span>
            </div>
            <select
              value={styleTemplate}
              onChange={e => setStyleTemplate(e.target.value as any)}
              className="glass-input px-3.5 py-2.5 text-xs w-full cursor-pointer bg-zinc-900 border border-white/10"
            >
              <option value="CLASSIC_CORPORATE">Classic Corporate (Serif, formal, standard)</option>
              <option value="MODERN_MINIMALIST">Modern Minimalist (Sans-serif, lowercase, generous margins)</option>
              <option value="TECH_CREATIVE">Tech Creative (Sleek accent line, bold title, compact details)</option>
            </select>
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
                    {editingAppId ? 'Updating...' : 'Saving...'}
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    {editingAppId ? 'Updated in Tracker!' : 'Saved to Tracker!'}
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    {editingAppId ? 'Update Tracked Application' : 'Save Application Tracker'}
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

          {result && (
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5 text-zinc-400 no-print font-sans">
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  document.execCommand('bold', false);
                }}
                className="p-1 hover:text-white rounded hover:bg-white/5 font-bold text-xs w-6 h-6 flex items-center justify-center cursor-pointer"
                title="Bold"
              >
                B
              </button>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  document.execCommand('italic', false);
                }}
                className="p-1 hover:text-white rounded hover:bg-white/5 italic text-xs w-6 h-6 flex items-center justify-center cursor-pointer"
                title="Italic"
              >
                I
              </button>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  document.execCommand('underline', false);
                }}
                className="p-1 hover:text-white rounded hover:bg-white/5 underline text-xs w-6 h-6 flex items-center justify-center cursor-pointer"
                title="Underline"
              >
                U
              </button>
              <div className="w-px h-3.5 bg-white/10 mx-1"></div>
              <select
                onChange={(e) => {
                  document.execCommand('fontSize', false, e.target.value);
                }}
                defaultValue="3"
                className="bg-transparent border-none text-[10px] text-zinc-400 hover:text-white cursor-pointer focus:outline-none"
                title="Text Size"
              >
                <option value="2" className="bg-zinc-900 text-zinc-300">Small</option>
                <option value="3" className="bg-zinc-900 text-zinc-300">Normal</option>
                <option value="4" className="bg-zinc-900 text-zinc-300">Large</option>
                <option value="5" className="bg-zinc-900 text-zinc-300">Extra Large</option>
              </select>
            </div>
          )}

          {result && (
            <div className="relative no-print font-sans">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Format
              </button>
              
              {exportDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setExportDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-52 bg-[#0a061b] border border-white/10 rounded-xl shadow-xl z-30 py-1.5 text-xs text-zinc-300">
                    <button
                      onClick={() => {
                        setExportDropdownOpen(false);
                        handleExportPdf(previewTab === 'cv' ? 'cv' : 'cl');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                    >
                      Download PDF Document (.pdf)
                    </button>
                    <button
                      onClick={() => {
                        setExportDropdownOpen(false);
                        handleExportWord();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                    >
                      Download MS Word Document (.doc)
                    </button>
                    <button
                      onClick={() => {
                        setExportDropdownOpen(false);
                        handleExportText();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                    >
                      Download Plain Text (.txt)
                    </button>
                  </div>
                </>
              )}
            </div>
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
                  className="w-[210mm] min-h-[297mm] relative flex flex-col justify-between"
                  style={{ 
                    pageBreakInside: 'avoid', 
                    backgroundColor: '#ffffff', 
                    color: s.textColor,
                    fontFamily: s.fontFamily,
                    padding: s.padding
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ borderBottom: s.headerBorderBottom, paddingBottom: '16px', marginBottom: s.sectionSpacing }}>
                      <h1 
                        contentEditable={true} 
                        suppressContentEditableWarning={true}
                        onBlur={(e) => handleCvDetailsChange('fullName', e.target.innerText)}
                        style={{ fontSize: '1.875rem', fontWeight: 'bold', letterSpacing: '-0.025em', color: s.titleColor, fontFamily: s.titleFont, marginBottom: '4px' }}
                      >
                        {result.tailoredCv.personalDetails.fullName}
                      </h1>
                      <div 
                        className="flex flex-wrap gap-x-4 gap-y-1 mt-1 font-sans text-xs" 
                        style={{ color: '#52525b' }}
                      >
                        <span>Email: <span contentEditable suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('email', e.target.innerText)}>{result.tailoredCv.personalDetails.email}</span></span>
                        <span>Phone: <span contentEditable suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('phone', e.target.innerText)}>{result.tailoredCv.personalDetails.phone}</span></span>
                        {result.tailoredCv.personalDetails.address && (
                          <span>Address: <span contentEditable suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('address', e.target.innerText)}>{result.tailoredCv.personalDetails.address}</span></span>
                        )}
                        {result.tailoredCv.personalDetails.website && (
                          <span>Web: <span contentEditable suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('website', e.target.innerText)}>{result.tailoredCv.personalDetails.website}</span></span>
                        )}
                        {result.tailoredCv.personalDetails.linkedin && (
                          <span>LinkedIn: <span contentEditable suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('linkedin', e.target.innerText)}>{result.tailoredCv.personalDetails.linkedin}</span></span>
                        )}
                        {result.tailoredCv.personalDetails.github && (
                          <span>GitHub: <span contentEditable suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('github', e.target.innerText)}>{result.tailoredCv.personalDetails.github}</span></span>
                        )}
                      </div>

                      {/* DACH Meta Fields, Conditionally display ONLY in German */}
                      {targetLanguage === 'DE' && (
                        <div 
                          className="grid grid-cols-3 font-sans"
                          style={{ fontSize: '11px', color: '#3f3f46', borderTop: '1px solid #f4f4f5', paddingTop: '8px', marginTop: '8px' }}
                        >
                          {result.tailoredCv.personalDetails.dateOfBirth && (
                            <span>Geburtsdatum: <span contentEditable suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('dateOfBirth', e.target.innerText)}>{result.tailoredCv.personalDetails.dateOfBirth}</span></span>
                          )}
                          {result.tailoredCv.personalDetails.birthplace && (
                            <span>Geburtsort: <span contentEditable suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('birthplace', e.target.innerText)}>{result.tailoredCv.personalDetails.birthplace}</span></span>
                          )}
                          {result.tailoredCv.personalDetails.nationality && (
                            <span>Staatsangehörigkeit: <span contentEditable suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('nationality', e.target.innerText)}>{result.tailoredCv.personalDetails.nationality}</span></span>
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
                          onBlur={(e) => handleCvSummaryChange(e.target.innerHTML)}
                          style={{ fontSize: '0.75rem', fontStyle: 'italic', lineHeight: '1.625', color: s.textColor }}
                          dangerouslySetInnerHTML={{ __html: result.tailoredCv.summary }}
                        />
                      </div>
                    )}

                    {/* Tabular Style for German, Top-Down for English */}
                    {targetLanguage === 'DE' ? (
                      // Tabellarischer Lebenslauf (DACH Standard)
                      <div className="space-y-6">
                        {/* Work Experience */}
                        <div>
                          <h3 
                            style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: 'bold', 
                              textTransform: s.headingTextTransform, 
                              letterSpacing: s.headingLetterSpacing, 
                              color: s.titleColor, 
                              borderBottom: `1px solid ${s.borderColor}`, 
                              paddingBottom: '4px', 
                              marginBottom: '12px',
                              fontFamily: s.titleFont 
                            }}
                          >
                            Beruflicher Werdegang
                          </h3>
                          <div className="space-y-4">
                            {result.tailoredCv.workExperience.map((exp, idx) => (
                              <div key={idx} className="grid grid-cols-12 gap-4 text-xs">
                                <div 
                                  contentEditable={true} 
                                  suppressContentEditableWarning={true} 
                                  onBlur={(e) => handleWorkExperienceChange(idx, 'period', e.target.innerText)}
                                  className="col-span-3 font-sans" 
                                  style={{ color: '#71717a' }}
                                >
                                  {exp.period}
                                </div>
                                <div className="col-span-9">
                                  <h4 
                                    contentEditable={true} 
                                    suppressContentEditableWarning={true} 
                                    onBlur={(e) => handleWorkExperienceChange(idx, 'role', e.target.innerText)}
                                    style={{ fontWeight: 'bold', color: s.titleColor }}
                                  >
                                    {exp.role}
                                  </h4>
                                  <div className="italic font-sans mb-1.5" style={{ color: '#52525b' }}>
                                    <span contentEditable suppressContentEditableWarning onBlur={(e) => handleWorkExperienceChange(idx, 'company', e.target.innerText)}>{exp.company}</span>
                                    <span>, </span>
                                    <span contentEditable suppressContentEditableWarning onBlur={(e) => handleWorkExperienceChange(idx, 'location', e.target.innerText)}>{exp.location}</span>
                                  </div>
                                  <ul className="list-disc list-outside ml-4 space-y-1" style={{ color: s.textColor }}>
                                    {exp.bullets.map((b, bIdx) => (
                                      <li 
                                        key={bIdx} 
                                        contentEditable={true} 
                                        suppressContentEditableWarning={true} 
                                        onBlur={(e) => handleWorkExperienceBulletChange(idx, bIdx, e.target.innerHTML)}
                                        className="leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: b }}
                                      />
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
                            style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: 'bold', 
                              textTransform: s.headingTextTransform, 
                              letterSpacing: s.headingLetterSpacing, 
                              color: s.titleColor, 
                              borderBottom: `1px solid ${s.borderColor}`, 
                              paddingBottom: '4px', 
                              marginBottom: '12px',
                              fontFamily: s.titleFont 
                            }}
                          >
                            Ausbildung
                          </h3>
                          <div className="space-y-3">
                            {result.tailoredCv.education.map((edu, idx) => (
                              <div key={idx} className="grid grid-cols-12 gap-4 text-xs">
                                <div 
                                  contentEditable={true} 
                                  suppressContentEditableWarning={true} 
                                  onBlur={(e) => handleEducationChange(idx, 'period', e.target.innerText)}
                                  className="col-span-3 font-sans" 
                                  style={{ color: '#71717a' }}
                                >
                                  {edu.period}
                                </div>
                                <div className="col-span-9">
                                  <h4 
                                    contentEditable={true} 
                                    suppressContentEditableWarning={true} 
                                    onBlur={(e) => handleEducationChange(idx, 'degree', e.target.innerText)}
                                    style={{ fontWeight: 'bold', color: s.titleColor }}
                                  >
                                    {edu.degree}
                                  </h4>
                                  <div className="font-sans" style={{ color: '#52525b' }}>
                                    <span contentEditable suppressContentEditableWarning onBlur={(e) => handleEducationChange(idx, 'institution', e.target.innerText)}>{edu.institution}</span>
                                    <span>, </span>
                                    <span contentEditable suppressContentEditableWarning onBlur={(e) => handleEducationChange(idx, 'location', e.target.innerText)}>{edu.location}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Skills & Languages */}
                        <div className="grid grid-cols-2 gap-8 text-xs pt-2">
                          <div>
                            <h3 
                              style={{ 
                                fontWeight: 'bold', 
                                textTransform: s.headingTextTransform, 
                                color: s.titleColor, 
                                borderBottom: `1px solid ${s.borderColor}`, 
                                paddingBottom: '4px', 
                                marginBottom: '8px',
                                fontFamily: s.titleFont 
                              }}
                            >
                              Kenntnisse
                            </h3>
                            <div 
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => handleSkillsChange(e.target.innerText)}
                              className="flex flex-wrap gap-1.5 font-sans leading-relaxed" 
                              style={{ color: s.textColor }}
                            >
                              {result.tailoredCv.skills.join(', ')}
                            </div>
                          </div>
                          <div>
                            <h3 
                              style={{ 
                                fontWeight: 'bold', 
                                textTransform: s.headingTextTransform, 
                                color: s.titleColor, 
                                borderBottom: `1px solid ${s.borderColor}`, 
                                paddingBottom: '4px', 
                                marginBottom: '8px',
                                fontFamily: s.titleFont 
                              }}
                            >
                              Sprachen
                            </h3>
                            <div className="space-y-0.5 font-sans" style={{ color: s.textColor }}>
                              {result.tailoredCv.languages.map((l, i) => (
                                <div key={i} className="flex gap-1">
                                  <span contentEditable suppressContentEditableWarning onBlur={(e) => handleLanguagesChange(i, 'language', e.target.innerText)}>{l.language}</span>
                                  <span>: </span>
                                  <span contentEditable suppressContentEditableWarning onBlur={(e) => handleLanguagesChange(i, 'level', e.target.innerText)}>{l.level}</span>
                                </div>
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
                            style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: 'bold', 
                              textTransform: s.headingTextTransform, 
                              letterSpacing: s.headingLetterSpacing, 
                              color: s.titleColor, 
                              borderBottom: `1px solid ${s.borderColor}`, 
                              paddingBottom: '4px', 
                              marginBottom: '12px',
                              fontFamily: s.titleFont 
                            }}
                          >
                            Work Experience
                          </h3>
                          <div className="space-y-4">
                            {result.tailoredCv.workExperience.map((exp, idx) => (
                              <div key={idx} className="text-xs">
                                <div className="flex justify-between items-baseline mb-1">
                                  <h4 
                                    contentEditable={true} 
                                    suppressContentEditableWarning={true} 
                                    onBlur={(e) => handleWorkExperienceChange(idx, 'role', e.target.innerText)}
                                    style={{ fontWeight: 'bold', color: s.titleColor, fontSize: '0.875rem' }}
                                  >
                                    {exp.role}
                                  </h4>
                                  <span 
                                    contentEditable={true} 
                                    suppressContentEditableWarning={true} 
                                    onBlur={(e) => handleWorkExperienceChange(idx, 'period', e.target.innerText)}
                                    className="font-sans" 
                                    style={{ color: '#71717a' }}
                                  >
                                    {exp.period}
                                  </span>
                                </div>
                                <div className="flex justify-between items-baseline italic font-sans mb-1.5" style={{ color: '#52525b' }}>
                                  <span>
                                    <span contentEditable suppressContentEditableWarning onBlur={(e) => handleWorkExperienceChange(idx, 'company', e.target.innerText)}>{exp.company}</span>
                                    <span>, </span>
                                    <span contentEditable suppressContentEditableWarning onBlur={(e) => handleWorkExperienceChange(idx, 'location', e.target.innerText)}>{exp.location}</span>
                                  </span>
                                </div>
                                <ul className="list-disc list-outside ml-4 space-y-1" style={{ color: s.textColor }}>
                                  {exp.bullets.map((b, bIdx) => (
                                    <li 
                                      key={bIdx} 
                                      contentEditable={true} 
                                      suppressContentEditableWarning={true} 
                                      onBlur={(e) => handleWorkExperienceBulletChange(idx, bIdx, e.target.innerHTML)}
                                      className="leading-relaxed"
                                      dangerouslySetInnerHTML={{ __html: b }}
                                    />
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Education */}
                        <div>
                          <h3 
                            style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: 'bold', 
                              textTransform: s.headingTextTransform, 
                              letterSpacing: s.headingLetterSpacing, 
                              color: s.titleColor, 
                              borderBottom: `1px solid ${s.borderColor}`, 
                              paddingBottom: '4px', 
                              marginBottom: '12px',
                              fontFamily: s.titleFont 
                            }}
                          >
                            Education
                          </h3>
                          <div className="space-y-3">
                            {result.tailoredCv.education.map((edu, idx) => (
                              <div key={idx} className="text-xs">
                                <div className="flex justify-between items-baseline">
                                  <h4 
                                    contentEditable={true} 
                                    suppressContentEditableWarning={true} 
                                    onBlur={(e) => handleEducationChange(idx, 'degree', e.target.innerText)}
                                    style={{ fontWeight: 'bold', color: s.titleColor }}
                                  >
                                    {edu.degree}
                                  </h4>
                                  <span 
                                    contentEditable={true} 
                                    suppressContentEditableWarning={true} 
                                    onBlur={(e) => handleEducationChange(idx, 'period', e.target.innerText)}
                                    className="font-sans" 
                                    style={{ color: '#71717a' }}
                                  >
                                    {edu.period}
                                  </span>
                                </div>
                                <div className="font-sans" style={{ color: '#52525b' }}>
                                  <span contentEditable suppressContentEditableWarning onBlur={(e) => handleEducationChange(idx, 'institution', e.target.innerText)}>{edu.institution}</span>
                                  <span>, </span>
                                  <span contentEditable suppressContentEditableWarning onBlur={(e) => handleEducationChange(idx, 'location', e.target.innerText)}>{edu.location}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Skills & Languages */}
                        <div className="grid grid-cols-2 gap-8 text-xs pt-2">
                          <div>
                            <h3 
                              style={{ 
                                fontWeight: 'bold', 
                                textTransform: s.headingTextTransform, 
                                color: s.titleColor, 
                                borderBottom: `1px solid ${s.borderColor}`, 
                                paddingBottom: '4px', 
                                marginBottom: '8px',
                                fontFamily: s.titleFont 
                              }}
                            >
                              Technical Skills
                            </h3>
                            <div 
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => handleSkillsChange(e.target.innerText)}
                              className="flex flex-wrap gap-1 font-sans leading-relaxed" 
                              style={{ color: s.textColor }}
                            >
                              {result.tailoredCv.skills.join(', ')}
                            </div>
                          </div>
                          <div>
                            <h3 
                              style={{ 
                                fontWeight: 'bold', 
                                textTransform: s.headingTextTransform, 
                                color: s.titleColor, 
                                borderBottom: `1px solid ${s.borderColor}`, 
                                paddingBottom: '4px', 
                                marginBottom: '8px',
                                fontFamily: s.titleFont 
                              }}
                            >
                              Languages
                            </h3>
                            <div className="space-y-0.5 font-sans" style={{ color: s.textColor }}>
                              {result.tailoredCv.languages.map((l, i) => (
                                <div key={i} className="flex gap-1">
                                  <span contentEditable suppressContentEditableWarning onBlur={(e) => handleLanguagesChange(i, 'language', e.target.innerText)}>{l.language}</span>
                                  <span>: </span>
                                  <span contentEditable suppressContentEditableWarning onBlur={(e) => handleLanguagesChange(i, 'level', e.target.innerText)}>{l.level}</span>
                                </div>
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
                        <p 
                          contentEditable={true} 
                          suppressContentEditableWarning={true} 
                          onBlur={(e) => handleSigningLineChange(e.target.innerText)}
                          className="mb-8"
                        >
                          {result.tailoredCv.signingLine}
                        </p>
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
                  className="w-[210mm] min-h-[297mm] relative flex flex-col justify-between"
                  style={{ 
                    pageBreakInside: 'avoid', 
                    backgroundColor: '#ffffff', 
                    color: s.textColor,
                    fontFamily: s.fontFamily,
                    padding: s.padding
                  }}
                >
                  <div className="text-xs">
                    {/* DIN 5008 Layout Alignment */}
                    <div className="grid grid-cols-12 gap-4 mb-10 font-sans">
                      {/* Sender block */}
                      <div className="col-span-6" style={{ color: '#52525b' }}>
                        <pre 
                          contentEditable={true}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => handleClChange('senderAddress', e.target.innerText)}
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
                          onBlur={(e) => handleClChange('recipientAddress', e.target.innerText)}
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
                      onBlur={(e) => handleClChange('dateLine', e.target.innerText)}
                      className="text-right font-sans mb-10" 
                      style={{ color: '#52525b' }}
                    >
                      {result.tailoredCoverLetter.dateLine}
                    </div>

                    {/* Subject Line */}
                    <div 
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => handleClChange('subjectLine', e.target.innerText)}
                      style={{ fontWeight: 'bold', fontSize: '0.875rem', color: s.titleColor, marginBottom: '24px', lineHeight: '1.25', fontFamily: s.titleFont }}
                    >
                      {result.tailoredCoverLetter.subjectLine}
                    </div>

                    {/* Salutation */}
                    <div 
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => handleClChange('salutation', e.target.innerText)}
                      className="mb-4 font-sans" 
                      style={{ color: '#18181b' }}
                    >
                      {result.tailoredCoverLetter.salutation}
                    </div>

                    {/* Body Paragraphs */}
                    <div className="space-y-4 leading-relaxed" style={{ color: '#27272a', fontSize: '12px' }}>
                      {result.tailoredCoverLetter.paragraphs.map((p, i) => (
                        <p 
                          key={i}
                          contentEditable={true}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => handleClParagraphChange(i, e.target.innerHTML)}
                          dangerouslySetInnerHTML={{ __html: p }}
                        />
                      ))}
                    </div>

                    {/* Closing Block */}
                    <div className="mt-8 font-sans" style={{ color: '#18181b' }}>
                      <p contentEditable={true} suppressContentEditableWarning={true} onBlur={(e) => handleClChange('closing', e.target.innerText)} className="mb-8">{result.tailoredCoverLetter.closing}</p>
                      <p contentEditable={true} suppressContentEditableWarning={true} onBlur={(e) => handleClChange('signatureName', e.target.innerText)} className="font-bold">{result.tailoredCoverLetter.signatureName}</p>
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
