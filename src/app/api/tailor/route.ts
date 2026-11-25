import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { AI_UNAVAILABLE_MESSAGE } from '@/lib/apiErrors';
import { enforceRateLimit } from '@/lib/rateLimit';
import { classifySkillCategory } from '@/lib/skills';
import { getUserTokens, deductTokens, topUpTokens, TOKEN_PRICING } from '@/lib/tokens';
import { aiResponseCache, generateCacheKey } from '@/lib/cache';
import { getAiConfig } from '@/lib/ai';
import { formatCityCountry } from '@/lib/customSections';
import { buildBulletMatrixSystemPrompt } from '@/lib/bulletMatrixPrompts';
import { callAiJson } from '@/lib/aiCall';
import { checkJobDescription } from '@/lib/jobDescriptionCheck';
import { buildBridgingDirective, cityFromAddress } from '@/lib/bridgingPrompt';
import { enforceHardLines, sameName } from '@/lib/bridging';
import {
  buildRequirementAnalysisPrompt,
  computeExperienceYears,
  normalizeRequirementAnalysis,
  toLegacyGapArrays,
  type RequirementAnalysis,
} from '@/lib/requirements';

// === DeepSeek API Configuration (Preserved / Commented as requested) ===
// const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

export async function POST(req: Request) {
  let userId: string | null = null;
  let tokensDeducted = false;
  let refunded = false;

  const refundTokens = async () => {
    if (!tokensDeducted || refunded || !userId) return;
    refunded = true;
    try {
      await topUpTokens(userId, TOKEN_PRICING.TAILOR);
    } catch (refundErr) {
      console.error('Failed to refund tailoring tokens:', refundErr);
    }
  };

  try {
    const auth = await getAuthUserId();
    if ('error' in auth) return auth.error;
    userId = auth.userId;

    const rateLimited = await enforceRateLimit(userId, 'TAILOR');
    if (rateLimited) return rateLimited;

    const {
      jobDescription,
      targetLanguage, // legacy fallback
      cvLanguage = targetLanguage || 'EN',
      clLanguage = targetLanguage || 'EN',
      cvFormat = 'visual', // 'visual' | 'ats' | 'bullet-matrix'
      tone = 'Bold & Action-oriented',
      lengthTarget = 'Strict 1-Page (concise)',
      bulletStyle = 'STAR Method',
      clLength = 'Short & Punchy (under 300 words)',
      skillsFocus = 'Tech-Heavy Focus',
      salaryExpectation,
      noticePeriod,
      signingLocation,
      customNotes,
      themeDirective,
      profile,
      matchStrategy = 'TACTICAL_PIVOT',
      applicationId = null,
      roleName = 'Professional',
      selectedProjects = [],
      isNudgeEnabled = true
    } = await req.json();

    if (!jobDescription || !profile) {
      return NextResponse.json({ error: 'Missing required inputs: jobDescription or profile' }, { status: 400 });
    }

    // Free sanity check before any tokens are charged or AI is called
    const jdCheck = checkJobDescription(jobDescription);
    if (!jdCheck.ok) {
      return NextResponse.json({ error: jdCheck.message, reason: jdCheck.reason }, { status: 422 });
    }

    // Response Cache check before token deduction
    const cacheKey = generateCacheKey({
      route: 'tailor',
      userId,
      jobDescription,
      cvLanguage,
      clLanguage,
      cvFormat,
      tone,
      lengthTarget,
      bulletStyle,
      clLength,
      skillsFocus,
      salaryExpectation,
      noticePeriod,
      signingLocation,
      customNotes,
      themeDirective,
      matchStrategy,
      roleName,
      selectedProjects,
      isNudgeEnabled,
      profileUpdatedAt: profile.updatedAt || profile.id || ''
    });

    const cachedData = aiResponseCache.get(cacheKey);
    if (cachedData) {
      const userTokens = await getUserTokens(userId);
      return NextResponse.json({ ...cachedData, cached: true, remainingTokens: userTokens });
    }

    // Deduct tokens on cache miss
    const deduction = await deductTokens(userId, TOKEN_PRICING.TAILOR);
    if (!deduction.success) {
      return NextResponse.json(
        { error: 'Insufficient tokens. Please top up your account.' },
        { status: 403 }
      );
    }
    tokensDeducted = true;

    const aiConfig = getAiConfig();
    if (!aiConfig.apiKey) {
      await refundTokens();
      return NextResponse.json({ error: `${aiConfig.provider} API Key is not configured in environment variables` }, { status: 500 });
    }

    // === DEEPSEEK API KEY (Preserved / Commented as requested) ===
    // const apiKey = process.env.DEEPSEEK_API_KEY;
    // if (!apiKey) {
    //   return NextResponse.json({ error: 'DeepSeek API Key is not configured in environment variables' }, { status: 500 });
    // }

    // Parse profile details
    const parsedWorkExp = typeof profile.workExperience === 'string' ? JSON.parse(profile.workExperience) : profile.workExperience;
    const parsedEdu = typeof profile.education === 'string' ? JSON.parse(profile.education) : profile.education;
    const parsedSkills = typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills;
    const parsedLanguages = typeof profile.languages === 'string' ? JSON.parse(profile.languages) : profile.languages;
    const parsedProjects = typeof profile.projects === 'string' ? JSON.parse(profile.projects) : (profile.projects || []);

    const filteredProjects = parsedProjects.filter((proj: any) =>
      selectedProjects.includes(proj.name)
    );

    const formattedProfile = {
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      website: profile.website || '',
      github: profile.github || '',
      linkedin: profile.linkedin || '',
      address: formatCityCountry(profile.address) || '',
      dateOfBirth: profile.dateOfBirth || '',
      birthplace: profile.birthplace || '',
      nationality: profile.nationality || '',
      workExperience: parsedWorkExp,
      education: parsedEdu,
      skills: parsedSkills,
      languages: parsedLanguages,
      projects: filteredProjects
    };

    const today = new Date();
    const formattedCurrentDateEN = today.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const formattedCurrentDateDE = today.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    const currentDateStr = cvLanguage === 'DE' || clLanguage === 'DE' ? formattedCurrentDateDE : formattedCurrentDateEN;

    // Construct custom prompt context
    const contextAdditions = [];
    contextAdditions.push(`CURRENT TODAY'S DATE: ${currentDateStr}`);
    if (salaryExpectation) contextAdditions.push(`Salary Expectations: ${salaryExpectation}`);
    if (noticePeriod) contextAdditions.push(`Notice Period / Availability: ${noticePeriod}`);
    if (signingLocation) contextAdditions.push(`Signing Location / City: ${signingLocation}`);
    if (customNotes) contextAdditions.push(`Custom Focus Notes: ${customNotes}`);
    const contextStr = contextAdditions.length > 0 ? contextAdditions.join('\n') : 'None provided';

    // Translate German job description if target CV or CL is in English
    let processedJobDescription = jobDescription;
    if (cvLanguage === 'EN' || clLanguage === 'EN') {
      const commonGermanWords = /\b(und|der|die|das|ist|für|mit|oder|von|auf|den|dem|des|ein|eine|einen|zum|zur|arbeit|erfahrung|kenntnisse|entwickler|gesucht)\b/i;
      if (commonGermanWords.test(jobDescription)) {
        try {
          const translationPayload = {
            model: aiConfig.model,
            messages: [
              {
                role: 'system',
                content: 'You are a professional translator. If the user\'s input job description is in German, translate it accurately and professionally into English, keeping all technical terms and structure. If the text is already in English, return it exactly as it is without any modification or introduction.'
              },
              { role: 'user', content: jobDescription }
            ],
            temperature: 0.1
          };

          // === DEEPSEEK Translation Fetch (Commented) ===
          // const translationRes = await fetch(DEEPSEEK_API_URL, {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          //   body: JSON.stringify({ model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro', ...translationPayload })
          // });

          const translationRes = await fetch(aiConfig.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${aiConfig.apiKey}`
            },
            body: JSON.stringify(translationPayload)
          });

          if (translationRes.ok) {
            const transJson = await translationRes.json();
            processedJobDescription = transJson.choices[0].message.content.trim();
          }
        } catch (err) {
          console.error('Error translating German JD to English:', err);
        }
      }
    }

    // === STEP 1: Requirement analysis (MATCH / ADJACENT / GAP) + feasibility gate ===
    const analysisPrompt = buildRequirementAnalysisPrompt(cvLanguage === 'DE' ? 'DE' : 'EN');
    const experienceYears = computeExperienceYears(parsedWorkExp, today);
    let analysis: RequirementAnalysis;
    let analysisRaw = '';
    try {
      const { data, raw } = await callAiJson(aiConfig, [
        { role: 'system', content: analysisPrompt },
        {
          role: 'user',
          content: `TODAY: ${today.toISOString().slice(0, 10)}\nCOMPUTED EXPERIENCE (use these numbers for years-of-experience requirements; do not recompute): ${experienceYears.excludingInternships} years of professional experience, ${experienceYears.total} years including internships.\n\nCANDIDATE PROFILE:\n${JSON.stringify(formattedProfile, null, 2)}\n\nJOB DESCRIPTION:\n${processedJobDescription}`
        }
      ]);
      analysis = normalizeRequirementAnalysis(data);
      analysisRaw = raw;
    } catch (analysisErr) {
      await refundTokens();
      console.error('Requirement analysis failed:', analysisErr);
      return NextResponse.json({ error: AI_UNAVAILABLE_MESSAGE }, { status: 502 });
    }

    if (analysis.requirements.length === 0) {
      // Nothing recognisable as job requirements (e.g. random text) — don't charge.
      await refundTokens();
      return NextResponse.json(
        { error: 'No job requirements could be found in this text. Please paste the full job description. Your tokens were refunded.' },
        { status: 422 }
      );
    }

    const analysisGap = {
      ...toLegacyGapArrays(analysis.requirements),
      recommendations: analysis.recommendations,
      requirements: analysis.requirements,
      mustCoverage: analysis.mustCoverage,
      mustHaveCount: analysis.mustHaveCount,
      mustHaveCovered: analysis.mustHaveCovered,
      threshold: analysis.threshold,
    };

    if (!analysis.feasible) {
      // Owner decision: refuse when under 50% of must-haves are covered; full price is
      // charged because the user still receives the full gap analysis report.
      const refusal = {
        refused: true,
        matchScore: analysis.matchScore,
        gapAnalysis: { ...analysisGap, matchingKeywords: [...analysisGap.exactMatches, ...analysisGap.adjacentMatches] },
      };
      try {
        await prisma.tailorDiagnosticLog.create({
          data: {
            userId,
            applicationId,
            rawJobDescription: jobDescription,
            userProfileSnapshot: JSON.stringify(formattedProfile),
            matchStrategyUsed: matchStrategy,
            systemPromptSent: analysisPrompt,
            rawLlmResponse: analysisRaw
          }
        });
      } catch (logError) {
        console.error('Failed to create diagnostic log entry:', logError);
      }
      aiResponseCache.set(cacheKey, refusal);
      return NextResponse.json(refusal);
    }

    // Gap-bridging rules (strategy + hard lines) built from the requirement analysis
    const strategyDirective = buildBridgingDirective({
      matchStrategy,
      requirements: analysis.requirements,
      cvLanguage,
      clLanguage,
    });

    // Signing city: explicit override, else the candidate's own city (never a hard-coded example)
    const signingCity = (signingLocation && String(signingLocation).trim()) || cityFromAddress(formatCityCountry(profile.address) || profile.address);

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
- STRICT CONSTRAINT: This theme DOES NOT override the GAP BRIDGING RULES. Do not invent facts to satisfy this theme.
- STRICT CONSTRAINT: This theme DOES NOT override the JSON formatting rules. You must still output the exact required JSON schema without any conversational filler.
` : '';

    const nudgeDirective = isNudgeEnabled ? `
[AI DESCRIPTION NUDGING DIRECTIVE]
The user has enabled AI Description Nudging.
- Actively adapt, rephrase, and align work experience bullet points and project descriptions towards the technical verbs, key skills, and core responsibilities of the target Job Description.
- Adapt the phrasing and emphasis of existing candidate achievements so they directly highlight relevance and fit for this target position.
` : '';

    const systemPrompt = `You are an elite recruitment expert and ATS optimization engine. Your goal is to write a flawless, professional CV/Resume and Cover Letter based on the user's profile and the target job description.

${nudgeDirective}
${themeInjection}

CV TARGET LANGUAGE: Write the tailored CV (summary, roles, bullets, skills) entirely in ${cvLanguage === 'DE' ? 'German' : 'English'}.
COVER LETTER TARGET LANGUAGE: Write the tailored Cover Letter entirely in ${clLanguage === 'DE' ? 'German' : 'English'}.

CRITICAL CONSTRAINTS:
1. TRUTHFULNESS & BRIDGING: Base everything on the User Profile and Custom Notes, and follow the GAP BRIDGING RULES below exactly. They define what may be bridged and what may never be invented.
2. TONE & CUSTOMIZATION OPTIONS:
   - Tone/Style: ${tone}
   - Skills Highlight Mode: ${skillsFocus}
   - Generate all bullet style variants (star, punchy, standard) and cover letter paragraph length variants (short, detailed) in a single response.

${lengthDirective}

3. CV FORMATTING & CONTENT RULES (Targeting ${cvLanguage}):
   ${cvLanguage === 'DE' ? `
   - Must support a clean tabular German Lebenslauf format.
   - Include a signing line at the bottom showing the city and current date: "${signingCity ? signingCity + ', ' : ''}${currentDateStr}".
   - Write all tailored fields in formal professional German.
   ` : `
   - US/UK/International Resume Style.
   - Omit date of birth, birthplace, age, gender, nationality, or marital status from the resume. They must be empty or null.
   - Use active, result-oriented, professional English. Focus on quantitative achievements, strong action verbs, and clear structural headings.
   `}
   
   ADDITIONAL CV WRITING GUIDELINES:
    - **Internal Promotions:** If a candidate has been promoted or changed departments/roles within the same company, treat each role as a completely separate job/experience entry. This demonstrates growth, distinct responsibilities, and loyalty.
    - **Job Titles:** Copy every job title exactly as it appears in the profile (hard line). Do not rename, upgrade or translate-and-reword titles.
    - **Relevancy Cut-offs:** ${lengthTarget.includes('1-Page') ? 'Filter and list only the last three companies' : 'Filter and list only the last four companies'} in the tailored work experience. Mention the total cumulative years of experience in the professional summary instead.
    - **Show, Don't Tell Soft Skills:** Do NOT list soft skills standalone. Integrate them naturally within the professional summary or the work history bullet points (e.g., "Strong communication skills developed through customer-facing roles...").
    - **Strict Rules for Hobbies:** Exclude generic hobbies like "reading," "traveling," or "music". Only include hobbies if they are directly relevant to the target job or demonstrate valuable workplace traits like leadership or teamwork.
    - **Software Developer Bullet Progression:** Transform weak bullet points into high-impact, result-oriented outcomes: (1) start with a strong action verb, (2) state the concrete result — include a metric only when the GAP BRIDGING RULES allow it, never force one, (3) specify the technical implementation detail (tech stack/tools), and (4) explain the business context/value.
    - **No Literal Labels or Prefixes:** In all generated bullets (including "star", "punchy", and "standard" categories), you MUST write the bullet points directly as cohesive sentences. Never include literal labels or prefixes such as "STAR Method:", "Situation:", "Task:", "Action:", "Result:", "Context:", or "Value:". The formula must be baked into the sentence naturally (e.g., "Developed a CRM API with Node.js and WebSockets that gave the sales team real-time visibility into client pipelines").
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

You must respond with a raw JSON object containing these exact keys:
{
  "tailoredCv": {
    "summary": "<short professional summary tailored to the job, in ${cvLanguage === 'DE' ? 'German' : 'English'}>",
    "workExperience": [
      {
        "company": "<exact original company name from the profile experience list to map back>",
        "role": "<the job title copied exactly from the profile>",
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
        "level": "<the skill level from the profile if one is stated, otherwise an empty string>",
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
    "signingLine": "<${cvLanguage === 'DE' ? (signingCity ? signingCity + ', ' : '') + currentDateStr : 'empty string'}>"
  },
  "tailoredCoverLetter": {
    "senderAddress": "<string, formatted with newlines>",
    "recipientAddress": "<string, formatted with newlines>",
    "dateLine": "<string, date block content>",
    "subjectLine": "<string, subject block content>",
    "salutation": "<string, e.g., 'Sehr geehrte Damen und Herren,' or 'Dear Hiring Manager,'>",
    "paragraphs": {
      "short": [<array of 2 paragraphs (introduction + concise fit) in ${clLanguage === 'DE' ? 'German' : 'English'}>],
      "detailed": [<array of 3-4 paragraphs (introduction + detailed fit + salary/notice period only if provided in the additional context) in ${clLanguage === 'DE' ? 'German' : 'English'}>]
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

    const activeSystemPrompt = cvFormat === 'bullet-matrix'
      ? buildBulletMatrixSystemPrompt({
        cvLanguage,
        clLanguage,
        tone,
        lengthTarget,
        bulletStyle,
        skillsFocus: typeof skillsFocus === 'string' ? [skillsFocus] : (skillsFocus || []),
        salaryExpectation,
        noticePeriod,
        signingLocation: signingCity,
        customNotes,
        themeDirective,
        matchStrategy,
        currentDateStr,
        bridgingDirective: strategyDirective
      })
      : systemPrompt;

    const payload = {
      model: aiConfig.model,
      messages: [
        { role: 'system', content: activeSystemPrompt },
        {
          role: 'user',
          content: `Here is the user profile:
${JSON.stringify(formattedProfile, null, 2)}

Here is the Target Job Description (already pre-translated to English if necessary):
${processedJobDescription}

Here is the additional context / overrides:
${contextStr}
Signing city for date lines: ${signingCity || '(none — use the date only, without a city)'}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    };

    // === DEEPSEEK Main Fetch (Commented) ===
    // const response = await fetch(DEEPSEEK_API_URL, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${apiKey}`
    //   },
    //   body: JSON.stringify({ model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro', ...payload })
    // });

    // Retry transient rate limits / upstream outages before giving up.
    let response: Response | null = null;
    let lastError: Error | null = null;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = attempt === 1 ? 1200 : 2500;
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        response = await fetch(aiConfig.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.apiKey}`
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(120000)
        });

        if (response.ok) {
          lastError = null;
          break;
        }

        const isRetryable = response.status === 429 || response.status === 500 || response.status === 502 || response.status === 503 || response.status === 504;
        if (!isRetryable) break;
      } catch (err: any) {
        lastError = err;
        if (attempt === maxRetries) break;
      }
    }

    if (!response || !response.ok) {
      await refundTokens();

      if (!response) {
        const message = lastError?.message || 'Failed to communicate with AI model';
        console.error(`${aiConfig.provider} API request failed:`, message);
        return NextResponse.json({ error: AI_UNAVAILABLE_MESSAGE }, { status: 502 });
      }

      let errorText = '';
      try {
        errorText = await response.text();
      } catch { }
      console.error(`${aiConfig.provider} API Error response:`, errorText);
      return NextResponse.json({ error: AI_UNAVAILABLE_MESSAGE }, { status: 502 });
    }

    let generatedText = '';
    try {
      const resJson = await response.json();
      generatedText = resJson.choices?.[0]?.message?.content || '';
    } catch (parseErr: any) {
      await refundTokens();
      console.error('Failed to read AI response body:', parseErr);
      return NextResponse.json({ error: 'AI provider returned an unreadable response. Please retry.' }, { status: 502 });
    }

    if (!generatedText.trim()) {
      await refundTokens();
      return NextResponse.json({ error: 'AI returned an empty response. Please retry.' }, { status: 502 });
    }

    let tailoredResult: any;
    try {
      tailoredResult = JSON.parse(generatedText);
    } catch (parseErr) {
      await refundTokens();
      console.error('Failed to parse tailoring AI output:', generatedText);
      return NextResponse.json({ error: 'AI produced invalid JSON output. Please retry.' }, { status: 500 });
    }

    // Match score and gap analysis come from the requirement analysis (step 1),
    // computed deterministically — not from lists the generation model writes.
    tailoredResult.matchScore = analysis.matchScore;
    tailoredResult.gapAnalysis = {
      ...analysisGap,
      matchingKeywords: [...analysisGap.exactMatches, ...analysisGap.adjacentMatches],
    };

    // Merge static fields back into the tailored CV response to conserve tokens
    const personalDetails = {
      fullName: profile.fullName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      website: profile.website || '',
      github: profile.github || '',
      linkedin: profile.linkedin || '',
      address: profile.address || '',
      dateOfBirth: cvLanguage === 'DE' ? (profile.dateOfBirth || '') : '',
      birthplace: cvLanguage === 'DE' ? (profile.birthplace || '') : '',
      nationality: cvLanguage === 'DE' ? (profile.nationality || '') : '',
      photo: profile.photo || '',
      signature: profile.signature || '',
      occupation: tailoredResult.tailoredCv?.personalDetails?.occupation || roleName || 'Professional'
    };

    const matchedIndices = new Set<number>();
    const mergedWorkExperience = tailoredResult.tailoredCv?.workExperience
      ? tailoredResult.tailoredCv.workExperience.map((tailoredJob: any, idx: number) => {
        // Find matching original job from user profile by company name (excluding already matched ones)
        let originalIdx = parsedWorkExp.findIndex((j: any, oIdx: number) => {
          if (matchedIndices.has(oIdx)) return false;
          return j.company.toLowerCase() === tailoredJob.company.toLowerCase() ||
            j.company.toLowerCase().includes(tailoredJob.company.toLowerCase()) ||
            tailoredJob.company.toLowerCase().includes(j.company.toLowerCase());
        });

        // Fallback to index if no company match found and it's not already matched
        if (originalIdx === -1) {
          if (idx < parsedWorkExp.length && !matchedIndices.has(idx)) {
            originalIdx = idx;
          }
        }

        const originalJob = originalIdx !== -1 ? parsedWorkExp[originalIdx] : {};
        if (originalIdx !== -1) {
          matchedIndices.add(originalIdx);
        }

        let bullets = tailoredJob.bullets;
        if (!bullets) {
          const origBullets = originalJob.bullets || [];
          bullets = {
            star: origBullets,
            punchy: origBullets,
            standard: origBullets
          };
        } else if (Array.isArray(bullets)) {
          bullets = {
            star: bullets,
            punchy: bullets,
            standard: bullets
          };
        }

        const isCurrent = originalJob.current === true ||
          originalJob.current === 'true' ||
          !originalJob.endDate ||
          originalJob.endDate.trim() === '' ||
          originalJob.endDate.toLowerCase() === 'present';

        const period = originalJob.startDate
          ? (isCurrent
            ? `${originalJob.startDate} – ${cvLanguage === 'DE' ? 'heute' : 'Present'}`
            : `${originalJob.startDate} – ${originalJob.endDate}`)
          : originalJob.period || tailoredJob.period || '';

        // Hard lines: employer, title and dates always come from the profile.
        // A job that matches no profile employer is invented and dropped.
        if (originalIdx === -1) return null;
        return {
          company: originalJob.company,
          role: originalJob.role || tailoredJob.role,
          location: originalJob.location || tailoredJob.location || '',
          period,
          bullets
        };
      }).filter(Boolean)
      : [];

    const mergedEducation = parsedEdu.map((edu: any) => {
      const isCurrent = edu.current === true ||
        edu.current === 'true' ||
        !edu.endDate ||
        edu.endDate.trim() === '' ||
        edu.endDate.toLowerCase() === 'present';
      const period = edu.startDate
        ? (isCurrent
          ? `${edu.startDate} – ${cvLanguage === 'DE' ? 'heute' : 'Present'}`
          : `${edu.startDate} – ${edu.endDate}`)
        : edu.period || '';
      return {
        ...edu,
        period
      };
    });

    // Make sure tailoredCoverLetter.paragraphs is in the { short, detailed } shape
    let paragraphs = tailoredResult.tailoredCoverLetter?.paragraphs;
    if (paragraphs && Array.isArray(paragraphs)) {
      paragraphs = {
        short: paragraphs,
        detailed: paragraphs
      };
    }

    if (tailoredResult.tailoredCoverLetter) {
      tailoredResult.tailoredCoverLetter.paragraphs = paragraphs || { short: [], detailed: [] };

      // Ensure senderAddress has clean newline formatting (Name, Address, Phone, Email)
      let senderAddr = tailoredResult.tailoredCoverLetter.senderAddress || '';
      if (!senderAddr || !senderAddr.includes('\n')) {
        const lines: string[] = [];
        if (profile.fullName) lines.push(profile.fullName);
        if (profile.address) {
          const cityCountry = formatCityCountry(profile.address);
          if (cityCountry) lines.push(cityCountry);
        }
        if (profile.phone) lines.push(profile.phone);
        if (profile.email) lines.push(profile.email);
        if (lines.length > 0) {
          tailoredResult.tailoredCoverLetter.senderAddress = lines.join('\n');
        }
      }
    }

    const mergedSkills = (tailoredResult.tailoredCv?.skills || []).map((skill: any) => {
      let name = '';
      let level = 'Intermediate';
      let category = '';
      if (typeof skill === 'string') {
        name = skill;
      } else if (skill && typeof skill === 'object') {
        name = skill.name || '';
        level = skill.level || 'Intermediate';
        category = skill.category || '';
      }
      name = name.replace(/\s*\((?:adjacent|transferable|bridged|related)\)/gi, '').trim();
      if (name && !category) {
        category = classifySkillCategory(name);
      }
      return { name, level, category };
    });

    const mergedProjects = tailoredResult.tailoredCv?.projects
      ? tailoredResult.tailoredCv.projects.map((tailoredProj: any) => {
        const originalProj = filteredProjects.find((p: any) => sameName(String(p.name || ''), String(tailoredProj.name || '')));
        // Projects must exist in the profile; keep the original name (the AI may append "(Open Source)" etc.)
        if (!originalProj) return null;

        return {
          name: originalProj.name || tailoredProj.name,
          description: tailoredProj.description || originalProj.description || '',
          technologies: tailoredProj.technologies || originalProj.technologies || [],
          url: originalProj.url || ''
        };
      }).filter(Boolean)
      : [];

    if (cvFormat === 'bullet-matrix') {
      let bullets: string[] = [];
      if (Array.isArray(tailoredResult.tailoredCv?.summaryBullets)) {
        bullets = tailoredResult.tailoredCv.summaryBullets.map((s: any) => String(s).replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean);
      } else if (typeof tailoredResult.tailoredCv?.summary === 'string') {
        bullets = tailoredResult.tailoredCv.summary
          .split('\n')
          .map((s: string) => s.replace(/^[•\-\*]\s*/, '').trim())
          .filter(Boolean);
      }
      if (bullets.length > 0) {
        tailoredResult.tailoredCv.summaryBullets = bullets;
        tailoredResult.tailoredCv.summary = bullets.map((b: string) => `• ${b}`).join('\n');
      }
    } else {
      // For Visual and Strict ATS formats: Guarantee clean narrative summary paragraph
      if (typeof tailoredResult.tailoredCv?.summary === 'string') {
        tailoredResult.tailoredCv.summary = tailoredResult.tailoredCv.summary
          .replace(/^[•\-\*]\s*/gm, '')
          .replace(/\n+/g, ' ')
          .trim();
      } else if (Array.isArray(tailoredResult.tailoredCv?.summaryBullets)) {
        tailoredResult.tailoredCv.summary = tailoredResult.tailoredCv.summaryBullets.join(' ');
      }
    }

    tailoredResult.tailoredCv = {
      ...tailoredResult.tailoredCv,
      personalDetails,
      workExperience: mergedWorkExperience,
      education: mergedEducation,
      skills: mergedSkills,
      languages: parsedLanguages,
      projects: mergedProjects
    };

    // Post-check: remove hard-line violations (GAP skills claimed in the CV, invented
    // degrees/certifications). Remaining bridged claims are tagged for review in the UI.
    const { removed: hardLineRemovals } = enforceHardLines(tailoredResult, profile, analysis.requirements);
    tailoredResult.hardLineRemovals = hardLineRemovals;
    if (hardLineRemovals.length > 0) {
      console.warn('[tailor] Removed hard-line violations:', hardLineRemovals);
    }

    // Log query diagnostic data into database
    try {
      await prisma.tailorDiagnosticLog.create({
        data: {
          userId,
          applicationId: applicationId,
          rawJobDescription: jobDescription,
          userProfileSnapshot: JSON.stringify(formattedProfile),
          matchStrategyUsed: matchStrategy,
          systemPromptSent: activeSystemPrompt,
          rawLlmResponse: generatedText
        }
      });
    } catch (logError) {
      console.error('Failed to create diagnostic log entry:', logError);
    }

    aiResponseCache.set(cacheKey, tailoredResult);
    return NextResponse.json(tailoredResult);
  } catch (error: any) {
    await refundTokens();
    console.error('Tailoring API Error:', error);
    return NextResponse.json({ error: 'An error occurred during tailoring. Any tokens for this request were refunded — please try again.' }, { status: 500 });
  }
}
