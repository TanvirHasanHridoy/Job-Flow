import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import AppHeader from "./components/AppHeader";
import ThemeSync from "./components/ThemeSync";
import { TokenProvider } from "@/context/TokenContext";
import { AlertModalProvider } from "@/context/AlertModalContext";
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
      <head>
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            try {
              const saved = localStorage.getItem('theme');
              if (saved === 'light' || (!saved && window.matchMedia('(prefers-color-scheme: light)').matches)) {
                document.documentElement.classList.add('light');
              } else {
                document.documentElement.classList.remove('light');
              }
            } catch (e) {}
          })();
        `}} />
      </head>
      <body className="font-sans antialiased text-[var(--foreground)] min-h-screen flex flex-col bg-[var(--background)]">
        <TokenProvider>
          <AlertModalProvider>
            <ThemeSync />
            <AppHeader />

            {/* Content Shell */}
            <main className="flex-1 flex flex-col relative z-10 w-full min-w-0">
              {children}
            </main>
          </AlertModalProvider>
        </TokenProvider>
      </body>
    </html>
  );
}

