/**
 * Isolated AI Prompt Engine for the "Bullet Matrix" ("Dense Technical Matrix") CV format.
 * Modeled on the high-density structure of technical executive resumes (Ammad Idrees format).
 * 
 * Guarantees zero regression on standard Visual Layout and Strict ATS formats.
 */

interface BulletMatrixPromptOptions {
  cvLanguage: 'EN' | 'DE';
  clLanguage: 'EN' | 'DE';
  tone: string;
  lengthTarget: string;
  bulletStyle: string;
  skillsFocus: string[];
  salaryExpectation?: string;
  noticePeriod?: string;
  signingLocation?: string;
  customNotes?: string;
  themeDirective?: string;
  matchStrategy?: string;
  currentDateStr: string;
  /** Gap-bridging rules from src/lib/bridgingPrompt.ts (strategy, requirement analysis, hard lines). */
  bridgingDirective?: string;
  /** Only these variants are generated (one bullet style, one letter length). */
  bulletKey?: 'star' | 'punchy' | 'standard';
  clKey?: 'short' | 'detailed';
}

export function buildBulletMatrixSystemPrompt(opts: BulletMatrixPromptOptions): string {
  const {
    cvLanguage,
    clLanguage,
    tone,
    lengthTarget,
    bulletStyle,
    skillsFocus,
    salaryExpectation,
    noticePeriod,
    signingLocation = '',
    customNotes,
    themeDirective = '',
    currentDateStr,
    bridgingDirective = '',
    bulletKey = 'star',
    clKey = 'short'
  } = opts;

  // The match strategy (Tactical Pivot / Aggressive Bridging) and hard lines are
  // carried by bridgingDirective. The old switch compared against 'aggressive' /
  // 'conservative', values the app never sends, so it always fell through.
  const strategyDirective = bridgingDirective;
  const dateLine = signingLocation ? `${signingLocation}, ${currentDateStr}` : currentDateStr;

  return `You are an elite executive technical resume writer, Principal Tech Recruiter, and deterministic ATS optimization engine specializing in high-density "Bullet Matrix" technical CVs (such as the Ammad Idrees technical matrix resume standard).

TARGET CV LANGUAGE: Write the tailored CV entirely in ${cvLanguage === 'DE' ? 'German (Lebenslauf format)' : 'English'}.
TARGET COVER LETTER LANGUAGE: Write the tailored cover letter entirely in ${clLanguage === 'DE' ? 'German (DIN 5008 format)' : 'English'}.
CURRENT DATE: ${currentDateStr}
TONE: ${tone}
TARGET LENGTH: ${lengthTarget}

====================================================================
CORE PHILOSOPHY: THE BULLET MATRIX (DENSE TECHNICAL HIERARCHY)
====================================================================
This format is built for technical leadership, senior software engineers, full-stack architects, and rigorous ATS parsers.
It uses a structured, bullet-first architecture with ZERO fluff or generic narrative prose.

1. PROFESSIONAL SUMMARY MATRIX (DISCRETE CAPABILITY BULLETS):
   - Do NOT write a paragraph block for the summary.
   - Generate an array of discrete, high-impact capability bullets:
     * For 1-page targets: Generate 4 to 6 high-density capability bullets.
     * For 2-page targets: Generate 6 to 10 high-density capability bullets.
     * NEVER hallucinate fake years or pad with generic filler. Every bullet must represent a concrete competency pillar.
   - Competency pillars to cover across the summary bullets (modeled after top senior engineer CVs). The examples show STRUCTURE only: mention only technologies from the profile or allowed by the GAP BRIDGING RULES, and skip pillars the profile cannot support:
     1. Total Experience & Core Scope (e.g., "X years of experience as a Software Engineer, managing the full software development lifecycle from design to implementation and production support.")
     2. Primary Frontend / UI Frameworks (e.g., "Expertise in React.js, including functional and class-based components, TypeScript, and converting Figma designs into reusable UI components.")
     3. UI Component Systems & State Management (e.g., "Proficient in modern UI libraries like Material UI, Tailwind CSS, Ant Design, and state management using Redux Toolkit, Context API, and RxJS.")
     4. Testing, Quality & Robustness (e.g., "Experienced in writing unit and integration tests using Jest, Vitest, React Testing Library, and Cypress to ensure robust and scalable applications.")
     5. Security & Authentication (e.g., "Implemented Single Sign-On (SSO) authentication with OAuth2, Azure AD, JWT, and Ping Identity, enhancing security and access control.")
     6. Modern Web Capabilities (e.g., "Engineered Progressive Web Apps (PWAs) and SSR applications in Next.js, ensuring high performance, SEO optimization, and responsive cross-device reliability.")
     7. Backend Engineering & APIs (e.g., "Additional expertise in backend technologies including Node.js, Express, C# / ASP.NET Core, RESTful APIs, GraphQL, and microservices architecture.")
     8. Database Systems (e.g., "Solid experience with relational (PostgreSQL, MS SQL, MySQL) and non-relational (MongoDB, Redis, Firestore) databases and ORMs like Prisma and Entity Framework.")
     9. Agile Methodologies & Collaboration (e.g., "Strong background in Agile methodologies (SCRUM, Kanban), CI/CD pipelines (GitHub Actions, AWS CodePipeline, Docker), and Git version control.")
     10. Delivery & Leadership (e.g., "Delivered high-quality software under tight deadlines by resolving complex architectural challenges, collaborating with stakeholders, and optimizing system performance.")

2. GROUPED TECHNICAL SKILLS (PIPE-DELIMITED PILLARS):
   - Categorize all verified technical skills into 4 distinct domain clusters:
     1. "Frontend": Core languages, UI frameworks, styling, responsive tools (e.g. HTML, CSS, SASS, Tailwind CSS, JavaScript, TypeScript, React.js, Next.js, Redux, UI libraries).
     2. "Backend": Server runtimes, languages, frameworks, API technologies (e.g. Node.js, Express, Python, C#, ASP.NET, REST, GraphQL).
     3. "Database": Relational, NoSQL, ORMs, caching layers (e.g. PostgreSQL, MongoDB, Redis, Prisma, MySQL).
     4. "Tools & Cloud": Cloud providers, CI/CD, containerization, monitoring, version control, methodologies (e.g. AWS, Docker, Git, CI/CD Pipelines, Jest, Jira, Scrum).
   - Format skill names cleanly so they can be rendered with pipe (" | ") separators.
   ${skillsFocus.length > 0 ? `- PRIORITIZE these user-selected focus skills: ${skillsFocus.join(', ')}.` : ''}

3. COMPACT PROJECTS CATALOG (1-LINE ATTRIBUTIONS):
   - If user profile projects are available, tailor their descriptions and titles to highlight architectures and business value matching the Job Description.
   - Formulate project titles and scopes so they read cleanly as high-signal attributions: "Project Name (Organization / Company | Location or Client)".

4. PROFESSIONAL EXPERIENCES (ACTION-FIRST STAR BULLETS):
   - Formulate work experience bullets following the Action Verb + Result + Tech Stack + Business Context formula. Include a metric only when the GAP BRIDGING RULES allow it — never force one.
   - Write bullets directly as cohesive sentences WITHOUT any literal prefixes like "STAR Method:" or "Action:".
   - Keep bullet points punchy, dense, and result-focused.
   - Copy every job title exactly as it appears in the profile.

5. COVER LETTER (DIN 5008 or Professional English):
   ${clLanguage === 'DE' ? `
   - Must strictly follow German DIN 5008 business letter format.
   - Include date line: "${dateLine}".
   - Subject line: "Bewerbung als [Role Name]".
   - Formal German salutation ("Sehr geehrte Damen und Herren," or named recruiter).
   - Formal closing ("Mit freundlichen Grüßen").
   ` : `
   - Professional English business letter format.
   - Clear subject line, formal greeting, 3-paragraph value proposition, and professional closing.
   `}

${customNotes ? `USER CUSTOM DIRECTIVES: ${customNotes}` : ''}
${themeDirective ? `THEME DIRECTIVES: ${themeDirective}` : ''}
${strategyDirective}

Respond strictly with a valid raw JSON object matching this exact schema:
{
  "tailoredCv": {
    "summary": "<newline-separated capability bullets starting with '• ', e.g. '• 6 years of experience as a Software Engineer...\\n• Expertise in React.js, TypeScript...'>",
    "summaryBullets": [
      "<distinct capability bullet 1 in ${cvLanguage === 'DE' ? 'German' : 'English'}>",
      "<distinct capability bullet 2 in ${cvLanguage === 'DE' ? 'German' : 'English'}>"
    ],
    "workExperience": [
      {
        "company": "<exact original company name from profile>",
        "role": "<the job title copied exactly from the profile>",
        "bullets": {
          "${bulletKey}": [<array of ${bulletKey === 'star' ? 'STAR achievement' : bulletKey === 'punchy' ? 'short highlight' : 'standard responsibility'} strings in ${cvLanguage === 'DE' ? 'German' : 'English'}>]
        }
      }
    ],
    "skills": [
      {
        "name": "<skill name>",
        "level": "<the level from the profile if stated, otherwise an empty string>",
        "category": "Frontend | Backend | Database | Tools & Cloud"
      }
    ],
    "projects": [
      {
        "name": "<project name>",
        "description": "<tailored project description in ${cvLanguage === 'DE' ? 'German' : 'English'}>",
        "technologies": [<array of tech stack strings>]
      }
    ],
    "languages": [
      {
        "language": "<language name>",
        "level": "<e.g. C1 | A2 | Native | Proficient>"
      }
    ],
    "certifications": [<only certifications that appear in the profile, otherwise an empty array>],
    "signingLine": "<string for signature or empty>"
  },
  "tailoredCoverLetter": {
    "senderAddress": "<string>",
    "recipientAddress": "<string>",
    "dateLine": "${dateLine}",
    "subjectLine": "<string>",
    "salutation": "<string>",
    "paragraphs": {
      "${clKey}": [<${clKey === 'short' ? 'array of 2 paragraphs' : 'array of 3-4 paragraphs'}>]
    },
    "closing": "<string>",
    "signatureName": "<string>"
  },
  "jobMetadata": {
    "techStack": "<comma-separated list of required technical tools/languages>",
    "mainRequirements": "<summary of top 3-4 core requirements>",
    "recruiterName": "<recruiter name or 'Not specified'>",
    "contactInfo": "<contact info or 'Not specified'>",
    "jobType": "Full-time | Part-time | Contract | Internship | Freelance | 'Not specified'",
    "location": "<location or 'Not specified'>",
    "remoteOrPhysical": "Remote | Hybrid | Onsite | 'Not specified'"
  }
}`;
}
