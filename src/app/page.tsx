'use client';

import Link from 'next/link';
import {
  Sparkles, Shield, Globe2, Zap, ChevronRight, FileText, Target, BarChart3,
  Layers, MessageSquare, HelpCircle, Download, CheckCircle2, ArrowRight,
  Palette, Clock, Briefcase, Award, Send
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--layout-backdrop-bg)] text-zinc-100 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-indigo-600/10 blur-[140px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[140px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-600/8 blur-[120px] animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Grid overlay */}
      <div className="fixed inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
        backgroundSize: '80px 80px'
      }} />

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            J
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white via-zinc-200 to-indigo-300 bg-clip-text text-transparent">
            JobFlow <span className="text-indigo-400 font-extrabold text-xs tracking-wider uppercase ml-1 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="#how-it-works"
            className="text-xs md:text-sm font-semibold text-zinc-400 hover:text-white transition-colors hidden sm:inline"
          >
            How It Works
          </a>
          <a
            href="#features"
            className="text-xs md:text-sm font-semibold text-zinc-400 hover:text-white transition-colors hidden sm:inline"
          >
            Features
          </a>
          <Link
            href="/login"
            className="px-5 py-2.5 text-sm font-semibold rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-300"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8 backdrop-blur-sm shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Next-Gen Google Gemini AI Engine
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 max-w-4xl tracking-tight">
          <span className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            Master Every Application with
          </span>
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Precision AI Tailoring
          </span>
        </h1>

        <p className="text-zinc-400 text-base md:text-xl max-w-2xl mb-10 leading-relaxed">
          From multi-persona career profiles and ATS keyword optimization to German DIN 5008 standards, vector PDF/Word exports, recruiter outreach, and interview prep.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
          <Link
            href="/login"
            className="group px-8 py-4 text-base font-bold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-300 flex items-center gap-2 cursor-pointer"
          >
            Launch Your Career Suite
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
          <a
            href="#how-it-works"
            className="px-6 py-4 text-sm font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-all duration-300"
          >
            Explore 4-Step Guide
          </a>
        </div>
        <span className="text-zinc-500 text-xs font-medium">Free Tier Available • No Credit Card Required</span>
      </section>

      {/* 4-Step Interactive Guide: "How It Works" */}
      <section id="how-it-works" className="relative z-10 px-6 md:px-12 py-20 border-t border-white/5 bg-zinc-950/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Workflow Guide
            </span>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-white to-zinc-300 bg-clip-text text-transparent mt-3 mb-4">
              How JobFlow Powers Your Job Search
            </h2>
            <p className="text-zinc-400 text-base max-w-2xl mx-auto">
              Follow our proven 4-step workflow to turn any job description into an interview invitation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] hover:border-indigo-500/30 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-black text-indigo-400/50 group-hover:text-indigo-400 transition-colors">01</span>
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mb-2">Build Persona Vault</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Import your LinkedIn or GitHub profile and create specialized personas (e.g., <em>Frontend Specialist</em>, <em>Full-Stack Lead</em>, <em>Engineering Manager</em>).
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-indigo-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Multi-Persona Ready</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] hover:border-purple-500/30 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-black text-purple-400/50 group-hover:text-purple-400 transition-colors">02</span>
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Target className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mb-2">Target & Tailor</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Paste the job posting text, URL, or upload a PDF. Choose strict 1-page limits, tone, STAR bullet styles, and German DIN 5008 or International formats.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-purple-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>ATS Gap Alignment</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] hover:border-cyan-500/30 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-black text-cyan-400/50 group-hover:text-cyan-400 transition-colors">03</span>
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Palette className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mb-2">Polish & Style Live</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Refine bullets with 1-click STAR/Punchy variations, select curated color palettes (Emerald, Oxford, Slate), adjust typography, and reorder skills via side panel.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-cyan-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Live WYSIWYG Styling</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl backdrop-blur-xl bg-white/[0.02] border border-white/[0.08] hover:border-emerald-500/30 transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-black text-emerald-400/50 group-hover:text-emerald-400 transition-colors">04</span>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Send className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-white mb-2">Export, Outreach & Track</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Download crisp Vector PDF or editable Word (.docx). Generate LinkedIn InMails & Interview STAR prep, and track stages on Kanban with automated aging reminders.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] text-emerald-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Follow-Up Automation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8-Card Modern Features Grid */}
      <section id="features" className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
              Platform Capabilities
            </span>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-white to-zinc-300 bg-clip-text text-transparent mt-3 mb-4">
              Everything You Need to Land Elite Offers
            </h2>
            <p className="text-zinc-400 text-base max-w-xl mx-auto">
              A unified end-to-end career suite designed for modern tech professionals and executives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Target className="w-5 h-5" />,
                title: 'ATS-Optimized Tailoring & Gap Matrix',
                description: 'Real-time keyword matching, skill gap matrix, and deterministic alignment scores that beat Applicant Tracking Systems.',
                badge: 'ATS Matrix',
                gradient: 'from-indigo-500 to-blue-500'
              },
              {
                icon: <Layers className="w-5 h-5" />,
                title: 'Multi-Persona Profile Vault',
                description: 'Maintain specialized career personas (Frontend, Full-Stack, Engineering Manager) and switch profiles in 1 click.',
                badge: 'Persona Vault',
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                icon: <MessageSquare className="w-5 h-5" />,
                title: 'AI Recruiter Outreach & InMail',
                description: 'Generate high-conversion LinkedIn InMails, hiring manager cold emails, and warm referral coffee chat messages on demand.',
                badge: 'InMail Engine',
                gradient: 'from-cyan-500 to-teal-500'
              },
              {
                icon: <HelpCircle className="w-5 h-5" />,
                title: 'AI Interview Prep Copilot',
                description: 'Tailored 30s elevator pitch, top 5 STAR predicted interview questions, reverse panel questions, and red-flag evasions.',
                badge: 'STAR Copilot',
                gradient: 'from-amber-500 to-orange-500'
              },
              {
                icon: <Palette className="w-5 h-5" />,
                title: 'Executive Layouts & Curated Palettes',
                description: '4 modern layout templates (Swiss Minimalist, Monospace Tech, Executive Leadership) with 5 curated color palettes.',
                badge: 'Visual Engine',
                gradient: 'from-emerald-500 to-teal-500'
              },
              {
                icon: <Download className="w-5 h-5" />,
                title: 'Vector PDF & DOCX Word Export',
                description: 'Instant pixel-perfect vector PDF download and editable Microsoft Word (.docx) export alongside ATS plain-text copy.',
                badge: 'Export Hub',
                gradient: 'from-blue-500 to-indigo-600'
              },
              {
                icon: <Globe2 className="w-5 h-5" />,
                title: 'DACH & International Standards',
                description: 'DIN 5008-compliant German Lebenslauf with Anschreiben & signature controls, or modern international 1-page resumes.',
                badge: 'DIN 5008 Ready',
                gradient: 'from-rose-500 to-red-500'
              },
              {
                icon: <Clock className="w-5 h-5" />,
                title: 'Kanban Tracker with Aging Reminders',
                description: 'Visual stages (Saved, Applied, Interviewing, Offer) with automated aging pulses and 1-click follow-up email drafts.',
                badge: 'Automation',
                gradient: 'from-fuchsia-500 to-purple-600'
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-5 rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.06] transition-all duration-300 hover:shadow-xl hover:shadow-black/20 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 uppercase tracking-wider">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2 leading-snug">{feature.title}</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-10 md:p-14 rounded-3xl backdrop-blur-xl bg-gradient-to-b from-indigo-500/15 via-purple-500/10 to-transparent border border-indigo-500/20 shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Accelerate Your Career?
            </h2>
            <p className="text-zinc-400 text-sm md:text-base mb-8 max-w-xl mx-auto">
              Join candidates landing interviews at top European and global tech firms with precision-tailored applications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 text-sm md:text-base font-bold rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 md:px-12 py-8 bg-zinc-950/80">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-xs">
              J
            </div>
            <span className="text-sm font-semibold text-zinc-400">JobFlow AI Career Suite</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <a href="#how-it-works" className="hover:text-zinc-300 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-zinc-300 transition-colors">Features</a>
            <Link href="/login" className="hover:text-zinc-300 transition-colors">Sign In</Link>
          </div>
          <p className="text-zinc-600 text-xs">
            © {new Date().getFullYear()} JobFlow AI. Precision Career Engineering.
          </p>
        </div>
      </footer>
    </div>
  );
}
