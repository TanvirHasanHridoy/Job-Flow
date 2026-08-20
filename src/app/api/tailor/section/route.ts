import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { getUserTokens, deductTokens, TOKEN_PRICING } from '@/lib/tokens';
import { aiResponseCache, generateCacheKey } from '@/lib/cache';
import { getAiConfig } from '@/lib/ai';
import { formatCityCountry } from '@/lib/customSections';

// === DeepSeek API Configuration (Preserved / Commented as requested) ===
// const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

export async function POST(req: Request) {
  try {
    const auth = await getAuthUserId();
    if ('error' in auth) return auth.error;
    const { userId } = auth;

    const {
      sectionKey,
      mode = 'section',
      targetLanguage = 'EN',
      cvFormat = 'visual', // 'visual' | 'ats' | 'bullet-matrix'
      jobDescription,
      profile,
      currentContent,
      userInstruction = '',
      tone = 'Bold & Action-oriented',
      bulletStyle = 'STAR Method',
      signingLocation = 'München'
    } = await req.json();

    if (!sectionKey || !jobDescription) {
      return NextResponse.json({ error: 'Missing required parameters: sectionKey or jobDescription' }, { status: 400 });
    }

    // Response Cache check before token deduction
    const cacheKey = generateCacheKey({
      route: 'section',
      userId,
      sectionKey,
      mode,
      targetLanguage,
      cvFormat,
      jobDescription,
      currentContent,
      userInstruction,
      tone,
      bulletStyle,
      signingLocation,
      profileUpdatedAt: profile?.updatedAt || profile?.id || ''
    });

    const cachedData = aiResponseCache.get(cacheKey);
    if (cachedData) {
      const userTokens = await getUserTokens(userId);
      return NextResponse.json({ success: true, data: cachedData, cached: true, remainingTokens: userTokens });
    }

    // Deduct tokens on cache miss
    const tokenAmount = mode === 'bullet' || mode === 'cl-paragraph' || mode === 'project' ? TOKEN_PRICING.POLISH_BULLET : TOKEN_PRICING.REGENERATE_SECTION;
    const deduction = await deductTokens(userId, tokenAmount);
    if (!deduction.success) {
      return NextResponse.json(
        { error: 'Insufficient tokens. Please top up your account.' },
        { status: 403 }
      );
    }

    const aiConfig = getAiConfig();
    if (!aiConfig.apiKey) {
      return NextResponse.json({ error: `${aiConfig.provider} API Key is not configured in environment variables` }, { status: 500 });
    }

    // === DEEPSEEK API KEY (Preserved / Commented as requested) ===
    // const apiKey = process.env.DEEPSEEK_API_KEY;
    // if (!apiKey) {
    //   return NextResponse.json({ error: 'DeepSeek API Key is not configured' }, { status: 500 });
    // }

    const today = new Date();
    const formattedCurrentDateEN = today.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const formattedCurrentDateDE = today.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    const currentDateStr = targetLanguage === 'DE' ? formattedCurrentDateDE : formattedCurrentDateEN;

    let systemPrompt = '';

    if (mode === 'bullet') {
      systemPrompt = `You are an expert ATS resume editor. Your job is to polish and re-write a single work experience bullet point into 3 distinct high-impact variations tailored to the Target Job Description.

TARGET LANGUAGE: Write entirely in ${targetLanguage === 'DE' ? 'German' : 'English'}.
CRITICAL CONSTRAINTS:
1. Rely ONLY on factual experience provided. Do NOT invent fake companies, degrees, or certifications.
2. Formulate bullets directly as single cohesive sentences. Do NOT include literal labels like "STAR Method:" or "Situation:".
3. Write three variations:
   - "star": A metrics-driven achievement following Action Verb + Metric + Tech Stack + Value.
   - "punchy": A short, high-impact concise highlight.
   - "ats": An ATS keyword-optimized variation integrating exact required skills from the Job Description.

Respond strictly with a raw JSON object matching this schema:
{
  "variations": {
    "star": "<string>",
    "punchy": "<string>",
    "ats": "<string>"
  }
}`;
    } else if (mode === 'cl-paragraph') {
      systemPrompt = `You are an expert executive cover letter writer. Polish and re-write a single cover letter paragraph into 3 distinct tone variations tailored to the Target Job Description.

TARGET LANGUAGE: Write entirely in ${targetLanguage === 'DE' ? 'German' : 'English'}.
CURRENT TODAY'S DATE: ${currentDateStr}

CRITICAL CONSTRAINTS:
1. Rely ONLY on factual background. Do NOT invent fake previous roles or metrics.
2. Formulate 3 distinct tone variations:
   - "persuasive": Powerful, confident & achievement-focused.
   - "formal": Classic corporate formal tone (conforming to DIN 5008 norms).
   - "concise": Direct, punchy, under 60 words.

Respond strictly with a raw JSON object matching this schema:
{
  "variations": {
    "persuasive": "<string>",
    "formal": "<string>",
    "concise": "<string>"
  }
}`;
    } else if (mode === 'project') {
      systemPrompt = `You are an expert technical resume writer. Polish and re-write a single project description into 3 distinct variations tailored to the Target Job Description.

TARGET LANGUAGE: Write entirely in ${targetLanguage === 'DE' ? 'German' : 'English'}.

CRITICAL CONSTRAINTS:
1. Rely ONLY on factual project background provided. Do NOT invent fake URLs or non-existent tech stacks.
2. Formulate 3 distinct variations:
   - "ats": High ATS keyword alignment matching target Job Description requirements and technical verbs.
   - "impact": Metrics & tech-stack driven phrasing highlighting architectural impact and deliverables.
   - "concise": Short, punchy, high-density project description (1-2 lines).

Respond strictly with a raw JSON object matching this schema:
{
  "variations": {
    "ats": "<string>",
    "impact": "<string>",
    "concise": "<string>"
  }
}`;
    } else {      // Mode === 'section'
      let schemaGuide = '';
      if (sectionKey === 'summary') {
        if (cvFormat === 'bullet-matrix') {
          schemaGuide = `{
  "summaryBullets": [
    "<discrete capability bullet 1 in ${targetLanguage === 'DE' ? 'German' : 'English'}>",
    "<discrete capability bullet 2 in ${targetLanguage === 'DE' ? 'German' : 'English'}>",
    "<discrete capability bullet 3 in ${targetLanguage === 'DE' ? 'German' : 'English'}>"
  ]
}`;
        } else {
          schemaGuide = `{
  "summary": "<tailored professional summary in ${targetLanguage === 'DE' ? 'German' : 'English'}>"
}`;
        }
      } else if (sectionKey === 'work') {
        if (cvFormat === 'bullet-matrix') {
          schemaGuide = `{
  "workExperience": [
    {
      "company": "<company name>",
      "role": "<tailored job title>",
      "location": "<city, country>",
      "period": "<period>",
      "bullets": [
        "<tailored action-first STAR metric bullet 1 in ${targetLanguage === 'DE' ? 'German' : 'English'}>",
        "<tailored action-first STAR metric bullet 2 in ${targetLanguage === 'DE' ? 'German' : 'English'}>"
      ]
    }
  ]
}`;
        } else {
          schemaGuide = `{
  "workExperience": [
    {
      "company": "<company name>",
      "role": "<tailored job title>",
      "bullets": {
        "star": [<array of STAR metric bullet strings>],
        "punchy": [<array of short punchy bullet strings>],
        "standard": [<array of standard responsibility bullet strings>]
      }
    }
  ]
}`;
        }
      } else if (sectionKey === 'projects') {
        schemaGuide = `{
  "projects": [
    {
      "name": "<project name>",
      "description": "<tailored project description in ${targetLanguage === 'DE' ? 'German' : 'English'}>",
      "technologies": [<array of tech strings>]
    }
  ]
}`;
      } else if (sectionKey === 'skills') {
        schemaGuide = `{
  "skills": [
    {
      "name": "<skill name>",
      "level": "Expert | Advanced | Intermediate | Beginner",
      "category": "${cvFormat === 'bullet-matrix' ? 'Frontend | Backend | Database | Tools & Cloud' : 'Frontend | Backend | Database | Tools'}"
    }
  ]
}`;
      } else if (sectionKey === 'education') {
        schemaGuide = `{
  "education": [
    {
      "degree": "<degree title>",
      "institution": "<institution name>",
      "period": "<period>"
    }
  ]
}`;
      } else if (sectionKey === 'certifications') {
        schemaGuide = `{
  "certifications": [
    "<certification 1 (Issuer / Platform)>",
    "<certification 2 (Issuer / Platform)>"
  ]
}`;
      } else if (sectionKey === 'languages') {
        schemaGuide = `{
  "languages": [
    {
      "language": "<language name>",
      "level": "<proficiency level>"
    }
  ]
}`;
      } else if (sectionKey === 'coverLetter') {
        schemaGuide = `{
  "tailoredCoverLetter": {
    "senderAddress": "<string>",
    "recipientAddress": "<string>",
    "dateLine": "${signingLocation}, ${currentDateStr}",
    "subjectLine": "<string>",
    "salutation": "<string>",
    "paragraphs": ${cvFormat === 'bullet-matrix' ? `[
      "<Opening paragraph in ${targetLanguage === 'DE' ? 'German' : 'English'}>",
      "<Core achievements paragraph in ${targetLanguage === 'DE' ? 'German' : 'English'}>",
      "<Closing paragraph in ${targetLanguage === 'DE' ? 'German' : 'English'}>"
    ]` : `{
      "short": [<array of 2 paragraphs>],
      "detailed": [<array of 3-4 paragraphs>]
    }`},
    "closing": "<string>",
    "signatureName": "<string>"
  }
}`;
      }

      const formatSpecificDirectives = cvFormat === 'bullet-matrix'
        ? `
BULLET MATRIX FORMAT CONSTRAINTS:
1. SUMMARY: Output 4 to 8 discrete capability bullet strings ('summaryBullets') covering full-stack architecture, frontend frameworks, testing, security/SSO, backend/APIs, databases, and CI/CD. Do NOT output a single narrative paragraph.
2. WORK EXPERIENCE: Output direct high-impact STAR metric bullet strings under 'bullets' for each role.
3. SKILLS: Categorize skills strictly into 4 pillars: Frontend, Backend, Database, Tools & Cloud.
4. PROJECTS: Highlight technical stack and organization context in a concise 1-line format.
`
        : '';

      systemPrompt = `You are an elite recruitment expert and ATS optimization engine. Re-generate ONLY the section '${sectionKey}' of the user's document tailored to the target job description.

TARGET LANGUAGE: Write entirely in ${targetLanguage === 'DE' ? 'German' : 'English'}.
CURRENT TODAY'S DATE: ${currentDateStr} (Ensure any dates generated use this current date!).
TONE / STYLE: ${tone}
PREFERRED BULLET STYLE: ${bulletStyle}
${formatSpecificDirectives}

USER CUSTOM INSTRUCTION / REVISION DIRECTIVE:
"${userInstruction || 'Regenerate and optimize this section for maximum alignment with the target job.'}"

STRICT CONSTRAINTS:
1. ABSOLUTE TRUTHFULNESS: Rely strictly on real profile facts. Do NOT fabricate experience.
2. JSON SCHEMA ENFORCEMENT: Output ONLY a raw valid JSON object matching the exact schema specified below. Do not include markdown code blocks, intro text, or extra wrapper keys.

SCHEMA FORMAT REQUIRED:
${schemaGuide}`;
    }

    const payload = {
      model: aiConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Here is the Target Job Description:
${jobDescription}

Here is the current content of this section:
${JSON.stringify(currentContent, null, 2)}

User Profile Context:
${JSON.stringify(profile || {}, null, 2)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    };

    // === DEEPSEEK Section Fetch (Commented) ===
    // const apiRes = await fetch(DEEPSEEK_API_URL, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${apiKey}`
    //   },
    //   body: JSON.stringify({ model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro', ...payload })
    // });

    const apiRes = await fetch(aiConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error(`${aiConfig.provider} Section API Error:`, errText);
      let errMsg = 'Failed to communicate with AI model';
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.error?.message || errJson.message || errMsg;
      } catch { }
      return NextResponse.json({ error: errMsg }, { status: apiRes.status });
    }

    const resJson = await apiRes.json();
    let contentStr = resJson.choices[0].message.content.trim();

    // Clean JSON formatting markdown code blocks if present
    contentStr = contentStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

    try {
      const parsedData = JSON.parse(contentStr);

      if (parsedData.summaryBullets && Array.isArray(parsedData.summaryBullets)) {
        parsedData.summary = parsedData.summaryBullets.map((b: string) => `• ${b}`).join('\n');
      }

      if (parsedData.workExperience && Array.isArray(parsedData.workExperience)) {
        parsedData.workExperience = parsedData.workExperience.map((job: any) => {
          if (Array.isArray(job.bullets)) {
            return {
              ...job,
              bullets: {
                star: job.bullets,
                punchy: job.bullets,
                standard: job.bullets
              }
            };
          }
          return job;
        });
      }

      if (sectionKey === 'coverLetter' && parsedData.tailoredCoverLetter) {
        if (Array.isArray(parsedData.tailoredCoverLetter.paragraphs)) {
          parsedData.tailoredCoverLetter.paragraphs = {
            short: parsedData.tailoredCoverLetter.paragraphs.slice(0, 2),
            detailed: parsedData.tailoredCoverLetter.paragraphs
          };
        }

        let senderAddr = parsedData.tailoredCoverLetter.senderAddress || '';
        if (!senderAddr || !senderAddr.includes('\n')) {
          const lines: string[] = [];
          if (profile?.fullName) lines.push(profile.fullName);
          if (profile?.address) {
            const cityCountry = formatCityCountry(profile.address);
            if (cityCountry) lines.push(cityCountry);
          }
          if (profile?.phone) lines.push(profile.phone);
          if (profile?.email) lines.push(profile.email);
          if (lines.length > 0) {
            parsedData.tailoredCoverLetter.senderAddress = lines.join('\n');
          }
        }
      }

      aiResponseCache.set(cacheKey, parsedData);
      return NextResponse.json({ success: true, data: parsedData, remainingTokens: deduction.tokens });
    } catch (parseErr) {
      console.error('Failed to parse AI section output:', contentStr);
      return NextResponse.json({ error: 'AI produced invalid JSON output structure' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in /api/tailor/section:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
