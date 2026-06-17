import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
  display: 'swap',
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "JobFlow AI - International CV & Resume Tailor",
  description: "Generate culturally tailored, high-impact German Lebenslauf (DIN 5008) and English Resumes natively with DeepSeek AI.",
  keywords: ["Resume", "Lebenslauf", "ATS Optimization", "Job Application", "DIN 5008", "AI Resume Writer", "German CV"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable} h-full scroll-smooth`}>
      <body className="font-sans antialiased text-zinc-100 min-h-screen flex flex-col bg-[#030014]">
        {/* Navigation Bar */}
        <header className="no-print sticky top-0 z-50 glass-panel border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                J
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-zinc-200 to-indigo-300 bg-clip-text text-transparent">
                JobFlow <span className="text-indigo-400 font-extrabold text-xs tracking-wider uppercase ml-1 px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">AI</span>
              </span>
            </Link>
          </div>
          
          <nav className="flex items-center gap-6">
            <Link 
              href="/" 
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200"
            >
              Dashboard
            </Link>
            <Link 
              href="/profile" 
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200"
            >
              Master Profile Vault
            </Link>
            <Link 
              href="/tailor" 
              className="px-4 py-2 text-xs font-semibold rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-300 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Tailor Workspace
            </Link>
          </nav>
        </header>

        {/* Content Shell */}
        <main className="flex-1 flex flex-col relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
