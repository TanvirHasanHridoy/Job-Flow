import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { classifySkillCategory } from '@/lib/skills';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

export async function POST(req: Request) {
  try {
    const auth = await getAuthUserId();
    if ('error' in auth) return auth.error;
    const { userId } = auth;

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
      applicationId = null,
      roleName = 'Professional'
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
            model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
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

    const systemPrompt = `You are an elite recruitment expert and ATS optimization engine. Your goal is to write a flawless, professional CV/Resume and Cover Letter based on the user's profile and the target job description.

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
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
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

    // Deterministically calculate match score from exact, adjacent, and missing skills
    const exactMatches = tailoredResult.gapAnalysis?.exactMatches || [];
    const adjacentMatches = tailoredResult.gapAnalysis?.adjacentMatches || [];
    const missingSkills = tailoredResult.gapAnalysis?.missingSkills || [];

    const we = 1.0;
    const wa = 0.5;
    const wm = 1.0;

    const numerator = we * exactMatches.length + wa * adjacentMatches.length;
    const denominator = numerator + wm * missingSkills.length;

    let calculatedScore = 100;
    if (denominator > 0) {
      calculatedScore = Math.round((numerator / denominator) * 100);
    }

    tailoredResult.matchScore = calculatedScore;

    // Maintain backwards compatibility with UI mapping
    if (tailoredResult.gapAnalysis) {
      tailoredResult.gapAnalysis.matchingKeywords = [...exactMatches, ...adjacentMatches];
    }

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

          return {
            company: originalJob.company || tailoredJob.company,
            role: tailoredJob.role || originalJob.role,
            location: originalJob.location || tailoredJob.location || '',
            period,
            bullets
          };
        })
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
      if (name && !category) {
        category = classifySkillCategory(name);
      }
      return { name, level, category };
    });

    tailoredResult.tailoredCv = {
      ...tailoredResult.tailoredCv,
      personalDetails,
      workExperience: mergedWorkExperience,
      education: mergedEducation,
      skills: mergedSkills,
      languages: parsedLanguages
    };

    // Log query diagnostic data into database
    try {
      await prisma.tailorDiagnosticLog.create({
        data: {
          userId,
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
