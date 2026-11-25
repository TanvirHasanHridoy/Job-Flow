import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { AI_UNAVAILABLE_MESSAGE } from '@/lib/apiErrors';
import { enforceRateLimit } from '@/lib/rateLimit';
import { getUserTokens, deductTokens, topUpTokens, TOKEN_PRICING } from '@/lib/tokens';
import { aiResponseCache, generateCacheKey } from '@/lib/cache';
import { getAiConfig } from '@/lib/ai';

function safeParseArray(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeSkills(skills: any): string[] {
  if (!skills) return [];
  if (typeof skills === 'string') {
    try {
      const parsed = JSON.parse(skills);
      if (Array.isArray(parsed)) return normalizeSkills(parsed);
    } catch {
      return skills.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  if (Array.isArray(skills)) {
    return skills.map((s: any) => {
      if (typeof s === 'string') return s.trim();
      if (s && typeof s === 'object' && s.name) return String(s.name).trim();
      return String(s || '').trim();
    }).filter(Boolean);
  }
  return [];
}

function normalizeSummary(tailoredCv: any): string {
  if (typeof tailoredCv?.summary === 'string' && tailoredCv.summary.trim()) {
    return tailoredCv.summary.trim();
  }
  if (Array.isArray(tailoredCv?.summaryBullets) && tailoredCv.summaryBullets.length > 0) {
    return tailoredCv.summaryBullets.map((b: any) => String(b).trim()).filter(Boolean).join('\n');
  }
  return '';
}

function extractJson(rawText: string): any {
  let cleaned = rawText.trim();

  // 1. Try markdown code block extraction
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  } else {
    // 2. Find outermost JSON braces
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // 3. Relax common JSON syntax errors (trailing commas, illegal control chars)
    const relaxed = cleaned
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
    return JSON.parse(relaxed);
  }
}

export async function POST(req: Request) {
  let userId: string | null = null;
  let tokensDeducted = false;

  try {
    const auth = await getAuthUserId();
    if ('error' in auth) return auth.error;
    userId = auth.userId;

    const rateLimited = await enforceRateLimit(userId, 'INTERVIEW_PREP');
    if (rateLimited) return rateLimited;

    const {
      jobDescription,
      companyName = '',
      roleName = '',
      tailoredCv,
      targetLanguage = 'EN',
      customInstruction = '',
      keptBridgedClaims = []
    } = await req.json();

    // Bridged claims the user chose to keep in their CV (see src/lib/bridging.ts)
    const bridgedForPrep: Array<{ claim: string; terms: string[]; basis: string }> = (Array.isArray(keptBridgedClaims) ? keptBridgedClaims : [])
      .filter((c: any) => c && typeof c.claim === 'string')
      .slice(0, 12)
      .map((c: any) => ({
        claim: String(c.claim).slice(0, 300),
        terms: Array.isArray(c.terms) ? c.terms.map(String).slice(0, 6) : [],
        basis: String(c.basis || '').slice(0, 200),
      }));

    if (!jobDescription) {
      return NextResponse.json({ error: 'Missing jobDescription parameter' }, { status: 400 });
    }

    const normalizedSkillList = normalizeSkills(tailoredCv?.skills);
    const normalizedSummaryText = normalizeSummary(tailoredCv);
    const parsedWorkExp = safeParseArray(tailoredCv?.workExperience);
    const parsedProjects = safeParseArray(tailoredCv?.projects);

    // Cache check
    const cacheKey = generateCacheKey({
      route: 'interview-prep',
      userId,
      companyName,
      roleName,
      targetLanguage,
      customInstruction,
      cvSummary: normalizedSummaryText,
      cvSkills: normalizedSkillList.join(','),
      bridged: bridgedForPrep
    });

    const cachedData = aiResponseCache.get(cacheKey);
    if (cachedData) {
      const userTokens = await getUserTokens(userId);
      return NextResponse.json({ success: true, data: cachedData, cached: true, remainingTokens: userTokens });
    }

    // Deduct tokens (5 tokens)
    const deduction = await deductTokens(userId, TOKEN_PRICING.INTERVIEW_PREP);
    if (!deduction.success) {
      return NextResponse.json(
        { error: 'Insufficient tokens. Please top up your account.' },
        { status: 403 }
      );
    }
    tokensDeducted = true;

    const aiConfig = getAiConfig();
    if (!aiConfig.apiKey) {
      if (tokensDeducted && userId) {
        await topUpTokens(userId, TOKEN_PRICING.INTERVIEW_PREP);
        tokensDeducted = false;
      }
      return NextResponse.json({ error: `${aiConfig.provider} API Key is not configured` }, { status: 500 });
    }

    const isDe = targetLanguage === 'DE';
    const candidateName = tailoredCv?.personalDetails?.fullName || 'the candidate';

    const systemPrompt = `You are a Principal Engineering Leader and Executive Interview Coach.
Your goal is to build an elite Interview Cheat-Sheet & Strategy Guide for ${candidateName} interviewing for the ${roleName || 'target'} role at ${companyName || 'the target company'}.

TARGET LANGUAGE: Write entirely in ${isDe ? 'German' : 'English'}.

CRITICAL REQUIREMENTS & OUTPUT SECTIONS:
1. "elevatorPitch":
   - A high-impact 30-45 second answer to "Tell me about yourself / Stellen Sie sich kurz vor".
   - 3 punchy sentences: Current identity + Key career superpower/metric + Why this specific company & role.

2. "predictedQuestions":
   - Array of 5 highly likely technical and behavioral questions tailored specifically to this job description and the candidate's background.
   - For each question:
     - "question": The exact question the interviewer will ask.
     - "category": "Technical Deep Dive", "System Architecture", "Leadership & Impact", or "Behavioral / STAR".
     - "intent": What the interviewer is secretly testing.
     - "suggestedAnswerTalkingPoints": Array of 3-4 bullet points referencing the candidate's REAL background (Situation -> Task -> Action -> Result).

3. "reverseQuestions":
   - Array of 3 high-signal reverse questions for the candidate to ask the hiring manager/interviewer at the end of the interview.
   - Questions that demonstrate senior domain insight, product thinking, and cultural curiosity.

4. "redFlagTraps":
   - Array of 2-3 specific technical/behavioral traps for this role/tech stack and how the candidate should gracefully handle them.

5. "backItUp":
   - ${bridgedForPrep.length > 0 ? 'One entry per BRIDGED CLAIM listed in the user message. These are statements in the CV that go beyond the candidate\'s documented experience (often a related skill presented as the target skill).' : 'Return an empty array.'}
   - For each: "claim" (short restatement), "skill" (the bridged skill/figure), "studyPlan" (3-4 concrete things to learn or build before the interview), "honestFraming" (how to talk about it truthfully if probed, anchored in the related real experience), "likelyProbe" (the follow-up question an interviewer would ask).

STRICT CONSTRAINTS:
1. Rely strictly on real background facts from the provided CV. Do NOT add technologies, versions, metrics or project details that are not in the CV facts.
2. Custom candidate instruction: "${(customInstruction || 'Provide actionable, concrete talking points.').replace(/"/g, "'")}"
3. Output strictly valid JSON matching this schema:
{
  "interviewPrep": {
    "elevatorPitch": "<string>",
    "predictedQuestions": [
      {
        "question": "<string>",
        "category": "<string>",
        "intent": "<string>",
        "suggestedAnswerTalkingPoints": ["<string>", "<string>", "<string>"]
      }
    ],
    "reverseQuestions": [
      {
        "question": "<string>",
        "context": "<string>"
      }
    ],
    "redFlagTraps": [
      {
        "trap": "<string>",
        "recommendation": "<string>"
      }
    ],
    "backItUp": [
      {
        "claim": "<string>",
        "skill": "<string>",
        "studyPlan": ["<string>", "<string>", "<string>"],
        "honestFraming": "<string>",
        "likelyProbe": "<string>"
      }
    ]
  }
}`;

    const payload = {
      model: aiConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Target Company: ${companyName}
Target Role: ${roleName}

Target Job Description:
${jobDescription}

Candidate Tailored CV Facts:
${JSON.stringify({
            personalDetails: tailoredCv?.personalDetails,
            summary: normalizedSummaryText,
            skills: normalizedSkillList,
            workExperience: parsedWorkExp.slice(0, 3),
            projects: parsedProjects.slice(0, 3)
          }, null, 2)}
${bridgedForPrep.length > 0 ? `
BRIDGED CLAIMS kept in the CV (coach the candidate to back these up — "basis" is the real experience they come from):
${JSON.stringify(bridgedForPrep, null, 2)}` : ''}`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 8192,
      temperature: 0.3
    };

    // Resilient fetch with exponential retry backoff for rate limits / transient server errors
    let lastError: Error | null = null;
    let apiRes: Response | null = null;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = attempt === 1 ? 1200 : 2500;
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        apiRes = await fetch(aiConfig.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.apiKey}`
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(65000)
        });

        if (apiRes.ok) {
          lastError = null;
          break;
        }

        const isRetryable = apiRes.status === 429 || apiRes.status === 500 || apiRes.status === 502 || apiRes.status === 503 || apiRes.status === 504;
        if (!isRetryable) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        if (attempt === maxRetries) break;
      }
    }

    if (!apiRes || !apiRes.ok) {
      if (tokensDeducted && userId) {
        await topUpTokens(userId, TOKEN_PRICING.INTERVIEW_PREP);
        tokensDeducted = false;
      }

      let errMsg = lastError?.message || 'Failed to communicate with AI model';
      let errStatus = apiRes ? apiRes.status : 502;

      if (apiRes) {
        try {
          const errText = await apiRes.text();
          console.error('Interview Prep API Error:', errText);
          const errJson = JSON.parse(errText);
          errMsg = errJson.error?.message || errJson.message || errMsg;
        } catch { }
      }

      console.error('AI provider error:', errStatus, errMsg);
      return NextResponse.json({ error: AI_UNAVAILABLE_MESSAGE }, { status: 502 });
    }

    const resJson = await apiRes.json();
    const rawContent = resJson.choices?.[0]?.message?.content;
    if (!rawContent) {
      if (tokensDeducted && userId) {
        await topUpTokens(userId, TOKEN_PRICING.INTERVIEW_PREP);
        tokensDeducted = false;
      }
      return NextResponse.json({ error: 'AI returned an empty response. Please try again.' }, { status: 502 });
    }

    let parsedData: any;
    try {
      parsedData = extractJson(rawContent);
    } catch (parseErr) {
      console.error('Failed to parse interview prep AI output:', rawContent);
      if (tokensDeducted && userId) {
        await topUpTokens(userId, TOKEN_PRICING.INTERVIEW_PREP);
        tokensDeducted = false;
      }
      return NextResponse.json({ error: 'AI produced invalid JSON output. Please retry.' }, { status: 500 });
    }

    // Normalize response shape so frontend always gets data.interviewPrep
    const rawPrep = parsedData?.interviewPrep || parsedData?.interview_prep || (parsedData?.elevatorPitch ? parsedData : parsedData?.data?.interviewPrep);
    if (!rawPrep || typeof rawPrep !== 'object') {
      if (tokensDeducted && userId) {
        await topUpTokens(userId, TOKEN_PRICING.INTERVIEW_PREP);
        tokensDeducted = false;
      }
      return NextResponse.json({ error: 'AI response missing interview prep sections. Please retry.' }, { status: 500 });
    }

    const normalizedPrep = {
      elevatorPitch: typeof rawPrep.elevatorPitch === 'string' ? rawPrep.elevatorPitch : '',
      predictedQuestions: Array.isArray(rawPrep.predictedQuestions) ? rawPrep.predictedQuestions : [],
      reverseQuestions: Array.isArray(rawPrep.reverseQuestions) ? rawPrep.reverseQuestions : [],
      redFlagTraps: Array.isArray(rawPrep.redFlagTraps) ? rawPrep.redFlagTraps : [],
      backItUp: bridgedForPrep.length > 0 && Array.isArray(rawPrep.backItUp) ? rawPrep.backItUp : []
    };

    const finalResponseData = { interviewPrep: normalizedPrep };
    aiResponseCache.set(cacheKey, finalResponseData);

    return NextResponse.json({
      success: true,
      data: finalResponseData,
      remainingTokens: deduction.tokens
    });
  } catch (error: any) {
    console.error('Error in interview-prep route:', error);
    if (tokensDeducted && userId) {
      try {
        await topUpTokens(userId, TOKEN_PRICING.INTERVIEW_PREP);
      } catch { }
    }
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
