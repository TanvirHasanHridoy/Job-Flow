import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { deductTokens, TOKEN_PRICING } from '@/lib/tokens';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

export async function POST(req: Request) {
  try {
    const auth = await getAuthUserId();
    if ('error' in auth) return auth.error;
    const { userId } = auth;

    const {
      sectionKey,
      mode = 'section',
      targetLanguage = 'EN',
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

    // Deduct tokens
    const tokenAmount = mode === 'bullet' || mode === 'cl-paragraph' || mode === 'project' ? TOKEN_PRICING.POLISH_BULLET : TOKEN_PRICING.REGENERATE_SECTION;
    const deduction = await deductTokens(userId, tokenAmount);
    if (!deduction.success) {
      return NextResponse.json(
        { error: 'Insufficient tokens. Please top up your account.' },
        { status: 403 }
      );
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'DeepSeek API Key is not configured' }, { status: 500 });
    }

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
    } else {
      // Mode === 'section'
      let schemaGuide = '';
      if (sectionKey === 'summary') {
        schemaGuide = `{
  "summary": "<tailored professional summary in ${targetLanguage === 'DE' ? 'German' : 'English'}>"
}`;
      } else if (sectionKey === 'work') {
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
      } else if (sectionKey === 'projects') {
        schemaGuide = `{
  "projects": [
    {
      "name": "<project name>",
      "description": "<tailored project description>",
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
      "category": "Frontend | Backend | Database | Tools"
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
      } else if (sectionKey === 'coverLetter') {
        schemaGuide = `{
  "tailoredCoverLetter": {
    "senderAddress": "<string>",
    "recipientAddress": "<string>",
    "dateLine": "${signingLocation}, ${currentDateStr}",
    "subjectLine": "<string>",
    "salutation": "<string>",
    "paragraphs": {
      "short": [<array of 2 paragraphs>],
      "detailed": [<array of 3-4 paragraphs>]
    },
    "closing": "<string>",
    "signatureName": "<string>"
  }
}`;
      }

      systemPrompt = `You are an elite recruitment expert and ATS optimization engine. Re-generate ONLY the section '${sectionKey}' of the user's document tailored to the target job description.

TARGET LANGUAGE: Write entirely in ${targetLanguage === 'DE' ? 'German' : 'English'}.
CURRENT TODAY'S DATE: ${currentDateStr} (Ensure any dates generated use this current date!).
TONE / STYLE: ${tone}
PREFERRED BULLET STYLE: ${bulletStyle}

USER CUSTOM INSTRUCTION / REVISION DIRECTIVE:
"${userInstruction || 'Regenerate and optimize this section for maximum alignment with the target job.'}"

STRICT CONSTRAINTS:
1. ABSOLUTE TRUTHFULNESS: Rely strictly on real profile facts. Do NOT fabricate experience.
2. JSON SCHEMA ENFORCEMENT: Output ONLY a raw valid JSON object matching the exact schema specified below. Do not include markdown code blocks, intro text, or extra wrapper keys.

SCHEMA FORMAT REQUIRED:
${schemaGuide}`;
    }

    const payload = {
      model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro',
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

    const apiRes = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('DeepSeek Section API Error:', errText);
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
