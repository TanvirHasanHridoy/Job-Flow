import EuropassClassic from '@/app/components/cv-templates/EuropassClassic';
import VerificationTest from '@/app/components/cv-templates/verification-test';
import CoverLetterClassic from '@/app/components/cv-templates/CoverLetterClassic';
import CoverLetterVerification from '@/app/components/cv-templates/CoverLetterVerification';

export default function CvPreviewPage() {
  return (
    <div className="min-h-screen bg-zinc-800 py-12 space-y-16 flex flex-col items-center">
      <h1 className="text-white text-2xl font-bold">Template Previews</h1>

      <div className="border-t border-zinc-700 w-full max-w-5xl my-4" />

      <div>
        <h2 className="text-zinc-400 text-sm font-semibold mb-4 text-center uppercase tracking-wider">
          CV Original — EuropassClassic.tsx
        </h2>
        <EuropassClassic />
      </div>

      <div>
        <h2 className="text-zinc-400 text-sm font-semibold mb-4 text-center uppercase tracking-wider">
          CV Verification Twin — verification-test.tsx
        </h2>
        <VerificationTest />
      </div>

      <div className="border-t border-zinc-700 w-full max-w-5xl my-4" />

      <div>
        <h2 className="text-zinc-400 text-sm font-semibold mb-4 text-center uppercase tracking-wider">
          Cover Letter Original — CoverLetterClassic.tsx
        </h2>
        <CoverLetterClassic />
      </div>

      <div>
        <h2 className="text-zinc-400 text-sm font-semibold mb-4 text-center uppercase tracking-wider">
          Cover Letter Verification Twin — CoverLetterVerification.tsx
        </h2>
        <CoverLetterVerification />
      </div>
    </div>
  );
}
