import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

export async function POST(req: Request) {
  try {
    const {
      jobDescription,
      targetLanguage, // legacy fallback
      cvLanguage = targetLanguage || 'EN',
      clLanguage = targetLanguage || 'EN',
      tone = 'Bold & Action-oriented',
      lengthTarget = 'Strict 1-Page (concise)',
      bulletStyle = 'STAR Method',
      clLength = 'Short & Punchy (under 300 words)',
      skillsFocus = 'Tech-Heavy Focus',
      salaryExpectation,
      noticePeriod,
      signingLocation,
      customNotes,
      profile,
      matchStrategy = 'TACTICAL_PIVOT',
      applicationId = null
    } = await req.json();

    if (!jobDescription || !profile) {
      return NextResponse.json({ error: 'Missing required inputs: jobDescription or profile' }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'DeepSeek API Key is not configured in environment variables' }, { status: 500 });
    }

    // Parse profile details
    const parsedWorkExp = typeof profile.workExperience === 'string' ? JSON.parse(profile.workExperience) : profile.workExperience;
    const parsedEdu = typeof profile.education === 'string' ? JSON.parse(profile.education) : profile.education;
    const parsedSkills = typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills;
    const parsedLanguages = typeof profile.languages === 'string' ? JSON.parse(profile.languages) : profile.languages;

    const formattedProfile = {
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      website: profile.website || '',
      github: profile.github || '',
      linkedin: profile.linkedin || '',
      address: profile.address || '',
      dateOfBirth: profile.dateOfBirth || '',
      birthplace: profile.birthplace || '',
      nationality: profile.nationality || '',
      workExperience: parsedWorkExp,
      education: parsedEdu,
      skills: parsedSkills,
      languages: parsedLanguages
    };

    // Construct custom prompt context
    const contextAdditions = [];
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
            model: 'deepseek-v4-pro',
            messages: [
              {
                role: 'system',
                content: 'You are a professional translator. If the user\'s input job description is in German, translate it accurately and professionally into English, keeping all technical terms and structure. If the text is already in English, return it exactly as it is without any modification or introduction.'
              },
              { role: 'user', content: jobDescription }
            ],
            temperature: 0.1
          };

          const translationRes = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
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

    // System prompt selection with strategies
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

    const systemPrompt = `You are an elite recruitment expert and ATS optimization engine. Your goal is to write a flawless, professional CV/Resume and Cover Letter based on the user's profile and the target job description.

CV TARGET LANGUAGE: Write the tailored CV (summary, roles, bullets, skills) entirely in ${cvLanguage === 'DE' ? 'German' : 'English'}.
COVER LETTER TARGET LANGUAGE: Write the tailored Cover Letter entirely in ${clLanguage === 'DE' ? 'German' : 'English'}.

CRITICAL CONSTRAINTS:
1. ABSOLUTE TRUTHFULNESS: Rely ONLY on facts, positions, and skills present in the User Profile or current Custom Notes. Do NOT invent work history, company names, credentials, or certifications.
2. TONE & CUSTOMIZATION OPTIONS:
   - Tone/Style: ${tone}
   - Skills Highlight Mode: ${skillsFocus}
   - Generate all bullet style variants (star, punchy, standard) and cover letter paragraph length variants (short, detailed) in a single response.

3. CV FORMATTING RULES (Targeting ${cvLanguage}):
   ${cvLanguage === 'DE' ? `
   - Must support a clean tabular German Lebenslauf format.
   - Include a signing line at the bottom showing the city and current date (e.g. "München, [Datum]").
   - Write all tailored fields in formal professional German.
   ` : `
   - US/UK/International Resume Style.
   - Omit date of birth, birthplace, age, gender, nationality, or marital status from the resume. They must be empty or null.
   - Use active, result-oriented, professional English. Focus on quantitative achievements, strong action verbs, and clear structural headings.
   `}

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
  "matchScore": <number between 0 and 100>,
  "gapAnalysis": {
    "missingSkills": [<array of strings of skills mentioned in JD but missing in profile>],
    "matchingKeywords": [<array of strings of key skills/keywords that align between profile and JD>],
    "recommendations": "<detailed and elaborate analysis of user suitability for the role. Highlight their Positives (e.g. strong matches, years of experience, relevant tech stacks, certifications, exceed requirements) and their Negatives (critical skill gaps, missing tools/methods, or areas they may face pushback). Use clear bullet points and headings within the text in markdown format (### Positives\\n- ...\\n\\n### Negatives\\n- ...\\n\\n### Actionable Advice\\n...).>"
  },
  "tailoredCv": {
    "summary": "<short professional summary tailored to the job, in ${cvLanguage === 'DE' ? 'German' : 'English'}>",
    "workExperience": [
      {
        "company": "<exact original company name from the profile experience list to map back>",
        "role": "<tailored job title / role name in ${cvLanguage === 'DE' ? 'German' : 'English'}>",
        "bullets": {
          "star": [<array of tailored achievement strings in STAR Method format (Situation, Task, Action, Result) in ${cvLanguage === 'DE' ? 'German' : 'English'}>],
          "punchy": [<array of tailored achievement strings that are short, high-impact highlights in ${cvLanguage === 'DE' ? 'German' : 'English'}>],
          "standard": [<array of tailored achievement strings of standard roles/responsibilities in ${cvLanguage === 'DE' ? 'German' : 'English'}>]
        }
      }
    ],
    "skills": [
      {
        "name": "<name of tailored skill in ${cvLanguage === 'DE' ? 'German' : 'English'}>",
        "level": "<skill level matching user's profile if present, otherwise assign 'Expert' | 'Advanced' | 'Intermediate' | 'Beginner' based on context>"
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
  }
}`;

    const payload = {
      model: 'deepseek-v4-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Here is the user profile:
${JSON.stringify(formattedProfile, null, 2)}

Here is the Target Job Description (already pre-translated to English if necessary):
${processedJobDescription}

Here is the additional context / overrides:
${contextStr}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    };

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API Error response:', errorText);
      return NextResponse.json({ error: `DeepSeek API returned status ${response.status}: ${errorText}` }, { status: 502 });
    }

    const resJson = await response.json();
    const generatedText = resJson.choices[0].message.content;
    const tailoredResult = JSON.parse(generatedText);

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
      nationality: cvLanguage === 'DE' ? (profile.nationality || '') : ''
    };

    const mergedWorkExperience = parsedWorkExp.map((originalJob: any, index: number) => {
      // Find tailored job by index or matching company name
      const tailoredJob = (tailoredResult.tailoredCv?.workExperience && tailoredResult.tailoredCv.workExperience[index]) || 
                          (tailoredResult.tailoredCv?.workExperience && tailoredResult.tailoredCv.workExperience.find((j: any) => j.company === originalJob.company)) || {};
      
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

      return {
        company: originalJob.company,
        role: tailoredJob.role || originalJob.role,
        location: originalJob.location,
        period: originalJob.period,
        bullets
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
    }

    tailoredResult.tailoredCv = {
      ...tailoredResult.tailoredCv,
      personalDetails,
      workExperience: mergedWorkExperience,
      education: parsedEdu,
      languages: parsedLanguages
    };

    // Log query diagnostic data into database
    try {
      await prisma.tailorDiagnosticLog.create({
        data: {
          applicationId: applicationId,
          rawJobDescription: jobDescription,
          userProfileSnapshot: JSON.stringify(formattedProfile),
          matchStrategyUsed: matchStrategy,
          systemPromptSent: systemPrompt,
          rawLlmResponse: generatedText
        }
      });
    } catch (logError) {
      console.error('Failed to create diagnostic log entry:', logError);
    }

    return NextResponse.json(tailoredResult);
  } catch (error: any) {
    console.error('Tailoring API Error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during tailoring' }, { status: 500 });
  }
}
