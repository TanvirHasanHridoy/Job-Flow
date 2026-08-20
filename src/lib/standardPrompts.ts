/**
 * Dedicated AI Prompt Engine for Standard "Visual Layout" and "Strict ATS" CV formats.
 * Produces multi-variation JSON schemas (STAR/Punchy/Standard bullets, Short/Detailed cover letter paragraphs).
 */

export interface StandardPromptOptions {
  cvLanguage: 'EN' | 'DE';
  clLanguage: 'EN' | 'DE';
  tone: string;
  lengthTarget: string;
  bulletStyle: string;
  skillsFocus: string;
  salaryExpectation?: string;
  noticePeriod?: string;
  signingLocation?: string;
  customNotes?: string;
  themeDirective?: string;
  matchStrategy?: string;
  roleName?: string;
  isNudgeEnabled?: boolean;
  currentDateStr: string;
}

export function buildStandardCvPrompt(opts: StandardPromptOptions): string {
  const {
    cvLanguage,
    clLanguage,
    tone,
    lengthTarget,
    skillsFocus,
    themeDirective = '',
    matchStrategy = 'TACTICAL_PIVOT',
    isNudgeEnabled = true
  } = opts;

  let strategyDirective = '';
  if (matchStrategy === 'TACTICAL_PIVOT') {
    strategyDirective = `
CRITICAL MATCH STRATEGY - TACTICAL_PIVOT (Honest Justification):
The user has skill gaps for this job. Keep the CV/Resume strictly factual based *only* on their profile. Do NOT invent data, certifications, or employers. In the Cover Letter, explicitly address these gaps using a constructive, professional justification in ${clLanguage === 'DE' ? 'German' : 'English'}. Explain how their adjacent skills, rapid learning curve, and existing core expertise make them the right fit despite the missing keywords.`;
  } else {
    strategyDirective = `
CRITICAL MATCH STRATEGY - AGGRESIVE_BRIDGING (Terminology Optimization):
The user wants maximum keyword alignment. Without fabricating non-existent employers, fake job titles, or fake degrees, aggressively crawl their real history for transferable skills. Rephrase their genuine accomplishments using the exact technical verbs and phrasing found in the job description to pass strict ATS filters, translated into the target language (${cvLanguage === 'DE' ? 'German' : 'English'} for CV, ${clLanguage === 'DE' ? 'German' : 'English'} for Cover Letter).`;
  }

  const lengthDirective = lengthTarget.includes('1-Page')
    ? `CV LENGTH CONSTRAINT: STRICT 1-PAGE TARGET
- The user requires the CV to fit on exactly 1 page (A4 height).
- Keep the tailored professional summary extremely concise (maximum 2-3 sentences, max 50-60 words).
- Tailor a maximum of 3 bullet points per role, focusing only on the most high-impact, metrics-driven achievements.
- Keep the text dense, professional, and clear. Avoid verbose descriptions. Do NOT exceed the available A4 page vertical space with the response content.`
    : `CV LENGTH CONSTRAINT: STANDARD 2-PAGE TARGET
- The user requires a detailed CV spanning up to 2 pages.
- The summary can be more comprehensive (3-5 sentences).
- Provide up to 4-5 tailored bullet points per role to thoroughly document achievements and responsibilities.`;

  const themeInjection = themeDirective ? `
[USER NARRATIVE DIRECTIVE]
The user has requested a specific overarching theme for this generation: "${themeDirective}"
- INSTRUCTION: Prioritize this theme in the professional summary, the cover letter narrative, and by highlighting relevant metrics in the bullet points.
- STRICT CONSTRAINT: This theme DOES NOT override the Absolute Truthfulness rule. Do not invent facts to satisfy this theme. 
- STRICT CONSTRAINT: This theme DOES NOT override the JSON formatting rules. You must still output the exact required JSON schema without any conversational filler.
` : '';

  const nudgeDirective = isNudgeEnabled ? `
[AI DESCRIPTION NUDGING DIRECTIVE]
The user has enabled AI Description Nudging.
- Actively adapt, rephrase, and align work experience bullet points and project descriptions towards the technical verbs, key skills, and core responsibilities of the target Job Description.
- Adapt the phrasing and emphasis of existing candidate achievements so they directly highlight relevance and fit for this target position.
` : '';

  return `You are an elite recruitment expert and ATS optimization engine. Your goal is to write a flawless, professional CV/Resume and Cover Letter based on the user's profile and the target job description.

${nudgeDirective}
${themeInjection}

CV TARGET LANGUAGE: Write the tailored CV (summary, roles, bullets, skills) entirely in ${cvLanguage === 'DE' ? 'German' : 'English'}.
COVER LETTER TARGET LANGUAGE: Write the tailored Cover Letter entirely in ${clLanguage === 'DE' ? 'German' : 'English'}.

CRITICAL CONSTRAINTS:
1. ABSOLUTE TRUTHFULNESS: Rely ONLY on facts, positions, and skills present in the User Profile or current Custom Notes. Do NOT invent work history, company names, credentials, or certifications.
2. TONE & CUSTOMIZATION OPTIONS:
   - Tone/Style: ${tone}
   - Skills Highlight Mode: ${skillsFocus}
   - Generate all bullet style variants (star, punchy, standard) and cover letter paragraph length variants (short, detailed) in a single response.

${lengthDirective}

3. CV FORMATTING & CONTENT RULES (Targeting ${cvLanguage}):
   ${cvLanguage === 'DE' ? `
   - Must support a clean tabular German Lebenslauf format.
   - Include a signing line at the bottom showing the city and current date (e.g. "München, [Datum]").
   - Write all tailored fields in formal professional German.
   ` : `
   - US/UK/International Resume Style.
   - Omit date of birth, birthplace, age, gender, nationality, or marital status from the resume. They must be empty or null.
   - Use active, result-oriented, professional English. Focus on quantitative achievements, strong action verbs, and clear structural headings.
   `}
   
   ADDITIONAL CV WRITING GUIDELINES:
    - **Internal Promotions:** If a candidate has been promoted or changed departments/roles within the same company, treat each role as a completely separate job/experience entry. This demonstrates growth, distinct responsibilities, and loyalty.
    - **Internships:** When listing an internship, explicitly append " (Internship)" (or " (Praktikum)" in German) right next to the job title.
    - **Relevancy Cut-offs:** ${lengthTarget.includes('1-Page') ? 'Filter and list only the last three companies' : 'Filter and list only the last four companies'} in the tailored work experience. Mention the total cumulative years of experience in the professional summary instead.
    - **Show, Don't Tell Soft Skills:** Do NOT list soft skills standalone. Integrate them naturally within the professional summary or the work history bullet points (e.g., "Strong communication skills developed through customer-facing roles...").
    - **Strict Rules for Hobbies:** Exclude generic hobbies like "reading," "traveling," or "music". Only include hobbies if they are directly relevant to the target job or demonstrate valuable workplace traits like leadership or teamwork.
    - **Software Developer Bullet Progression:** Transform weak bullet points into high-impact, metrics-driven, and result-oriented outcomes following a 4-part formula: (1) start with a strong action verb, (2) provide a concrete metric or result, (3) specify the technical implementation detail (how it was done, including tech stack/tools), and (4) explain the business context/value.
    - **No Literal Labels or Prefixes:** In all generated bullets (including "star", "punchy", and "standard" categories), you MUST write the bullet points directly as cohesive sentences. Never include literal labels or prefixes such as "STAR Method:", "Situation:", "Task:", "Action:", "Result:", "Context:", or "Value:". The formula must be baked into the sentence naturally (e.g., "Developed a scalable CRM API that handled 50,000 monthly active users using React and WebSockets, improving user engagement by 15%").
    - **References:** Do NOT include the phrase "References available upon request". Keep it completely out.
    - **Gender Pronouns:** Gender pronouns are optional. Do not include them by default. If requested or explicitly provided in custom notes, place them directly under the signature/signing line as "Pronouns: [pronouns]".
    - **Projects:** If any projects are provided in the user profile, you must tailor their descriptions and listed technologies to highlight accomplishments, skills, and architectures that directly align with and showcase competence for the requirements in the target Job Description, written entirely in ${cvLanguage === 'DE' ? 'German' : 'English'}.

4. COVER LETTER FORMATTING RULES (Targeting ${clLanguage}):
   ${clLanguage === 'DE' ? `
   - Must strictly align with German DIN 5008 business letter formatting.
   - Sender address should be the user's address.
   - Recipient address must be extracted or placeholder-indicated (e.g., Company, "Personalabteilung").
   - Include a right-aligned date line: "[Signing Location], [Current Date]".
   - A bold subject line starting with "Bewerbung als [Role Name]".
   - Formal German salutation ("Sehr geehrte(r) Frau/Herr [Name]," or "Sehr geehrte Damen und Herren,").
   - Formal closing ("Mit freundlichen Grüßen") followed by signature name.
   - Entirely in formal, flawless German ("Sie" form).
   ` : `
   - Professional English business letter format.
   - Sender contact info at the top.
   - Recipient block (Company, name if available, or "Hiring Manager / Recipient").
   - Formal, polite opening (e.g., "Dear Hiring Manager," or "Dear Mr./Ms. [Name],").
   - Formal closing ("Sincerely," or "Best regards,") followed by signature name.
   - Entirely in professional English.
   `}
   
${strategyDirective}

5. DETERMINISTIC MATCH SCORE RULE:
   - Do NOT calculate or output a match score or percentage yourself. 
   - You are only responsible for listing the specific semantic keyword categorization in the arrays: exactMatches, adjacentMatches, and missingSkills. 
   - The final score will be calculated programmatically on the backend.

${themeInjection}

You must respond with a raw JSON object containing these exact keys:
{
  "gapAnalysis": {
    "exactMatches": [<array of strings of skills/keywords that match exactly between profile and JD>],
    "adjacentMatches": [<array of strings of adjacent/transferable skills that align between profile and JD>],
    "missingSkills": [<array of strings of skills/requirements mentioned in JD but missing in profile>],
    "recommendations": "<detailed and elaborate analysis of user suitability for the role. Highlight their Positives (e.g. strong matches, years of experience, relevant tech stacks, certifications, exceed requirements) and their Negatives (critical skill gaps, missing tools/methods, or areas they may face pushback). Use clear bullet points and headings within the text in markdown format (### Positives\\n- ...\\n\\n### Negatives\\n- ...\\n\\n### Actionable Advice\\n...).>"
  },
  "tailoredCv": {
    "summary": "<short professional summary tailored to the job, in ${cvLanguage === 'DE' ? 'German' : 'English'}>",
    "workExperience": [
      {
        "company": "<exact original company name from the profile experience list to map back>",
        "role": "<tailored job title / role name in ${cvLanguage === 'DE' ? 'German' : 'English'}>",
        "bullets": {
          "star": [<array of tailored achievement strings following the 4-part STAR formula (Strong Action Verb + Concrete Metric + Tech Stack + Business Context) in ${cvLanguage === 'DE' ? 'German' : 'English'}, written directly as a single cohesive sentence WITHOUT any literal labels or prefixes like "Situation:", "Action:", etc.>],
          "punchy": [<array of tailored achievement strings that are short, high-impact highlights in ${cvLanguage === 'DE' ? 'German' : 'English'}>],
          "standard": [<array of tailored achievement strings of standard roles/responsibilities in ${cvLanguage === 'DE' ? 'German' : 'English'}>]
        }
      }
    ],
    "skills": [
      {
        "name": "<name of tailored skill in ${cvLanguage === 'DE' ? 'German' : 'English'}>",
        "level": "<skill level matching user's profile if present, otherwise assign 'Expert' | 'Advanced' | 'Intermediate' | 'Beginner' based on context>",
        "category": "<category of skill, strictly one of: Frontend, Backend, Database, Tools>"
      }
    ],
    "projects": [
      {
        "name": "<exact original project name from the profile projects list to map back>",
        "description": "<tailored description of the project achievements, outcomes, and responsibilities, adapted to match the target job description requirements, in ${cvLanguage === 'DE' ? 'German' : 'English'}>",
        "technologies": [<array of strings representing tailored/relevant technologies used, matching the user's profile and aligned with the job description>]
      }
    ],
    "signingLine": "<string for signature, e.g. 'München, 17. Juni 2026' or empty if EN>"
  },
  "tailoredCoverLetter": {
    "senderAddress": "<string, formatted with newlines>",
    "recipientAddress": "<string, formatted with newlines>",
    "dateLine": "<string, date block content>",
    "subjectLine": "<string, subject block content>",
    "salutation": "<string, e.g., 'Sehr geehrte Damen und Herren,' or 'Dear Hiring Manager,'>",
    "paragraphs": {
      "short": [<array of 2 paragraphs (introduction + concise fit) in ${clLanguage === 'DE' ? 'German' : 'English'}>],
      "detailed": [<array of 3-4 paragraphs (introduction + detailed fit + details like salary/notice period) in ${clLanguage === 'DE' ? 'German' : 'English'}>]
    },
    "closing": "<string, e.g., 'Mit freundlichen Grüßen,' or 'Sincerely,'>",
    "signatureName": "<string>"
  },
  "jobMetadata": {
    "techStack": "<comma-separated list of required technical tools, languages, and methodologies extracted from the Job Description>",
    "mainRequirements": "<bullet point list or short summary of top 3-4 core requirements/qualifications for the role, in ${cvLanguage === 'DE' ? 'German' : 'English'}>",
    "recruiterName": "<name of recruiter/contact person if found, otherwise 'Not specified'>",
    "contactInfo": "<email or phone of recruiter/employer if found, otherwise 'Not specified'>",
    "jobType": "<strictly one of: Full-time, Part-time, Contract, Internship, Freelance, or 'Not specified'>",
    "location": "<city / location of job, otherwise 'Not specified'>",
    "remoteOrPhysical": "<strictly one of: Remote, Hybrid, Onsite, or 'Not specified'>"
  }
}`;
}
