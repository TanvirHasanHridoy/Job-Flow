'use client';

import Link from 'next/link';
import { Sparkles, Shield, Globe2, Zap, ChevronRight, FileText, Target, BarChart3 } from 'lucide-react';

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
        <Link
          href="/login"
          className="px-5 py-2.5 text-sm font-semibold rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-300"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by DeepSeek AI
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 max-w-4xl">
          <span className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            Land Your Dream Job with
          </span>
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            AI-Tailored Applications
          </span>
        </h1>

        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Generate culturally perfect CVs and cover letters for German & international markets. 
          ATS-optimized. DIN 5008 compliant. One click.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/login"
            className="group px-8 py-4 text-base font-bold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-300 flex items-center gap-2"
          >
            Get Started Free
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
          <span className="text-zinc-500 text-sm">No credit card required</span>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 md:px-12 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent mb-4">
              Everything You Need to Stand Out
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              From profile import to tailored application — all in one workspace
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Target className="w-6 h-6" />,
                title: 'ATS-Optimized Tailoring',
                description: 'AI analyzes job descriptions and rewrites your CV with exact keyword matches to beat Applicant Tracking Systems.',
                gradient: 'from-indigo-500 to-blue-500'
              },
              {
                icon: <Globe2 className="w-6 h-6" />,
                title: 'DACH Market Ready',
                description: 'Generate DIN 5008-compliant German Lebenslauf or international resumes with proper cultural formatting.',
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                icon: <FileText className="w-6 h-6" />,
                title: 'Smart Cover Letters',
                description: 'AI-generated cover letters that address skill gaps honestly and highlight your transferable experience.',
                gradient: 'from-cyan-500 to-teal-500'
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: 'Gap Analysis & Match Score',
                description: 'See your skill alignment score, missing keywords, and actionable recommendations before you apply.',
                gradient: 'from-orange-500 to-amber-500'
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'One-Click Import',
                description: 'Import your profile from LinkedIn text or GitHub repositories. AI extracts skills, experience, and education.',
                gradient: 'from-emerald-500 to-green-500'
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: 'Application Tracker',
                description: 'Kanban board to track every application from tailored → applied → interviewing → offer.',
                gradient: 'from-rose-500 to-red-500'
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.06] transition-all duration-500 hover:shadow-xl hover:shadow-black/10"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-10 rounded-3xl backdrop-blur-xl bg-gradient-to-b from-indigo-500/10 to-purple-500/5 border border-indigo-500/20">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Transform Your Job Search?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
              Join professionals who use AI to craft perfect applications in minutes, not hours.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 md:px-12 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-xs">
              J
            </div>
            <span className="text-sm text-zinc-500">JobFlow AI</span>
          </div>
          <p className="text-zinc-600 text-xs">
            © {new Date().getFullYear()} JobFlow AI. Built with Next.js & DeepSeek.
          </p>
        </div>
      </footer>
    </div>
  );
}
