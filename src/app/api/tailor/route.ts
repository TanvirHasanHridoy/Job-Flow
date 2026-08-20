import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';
import { classifySkillCategory } from '@/lib/skills';
import { getUserTokens, deductTokens, TOKEN_PRICING } from '@/lib/tokens';
import { aiResponseCache, generateCacheKey } from '@/lib/cache';
import { getAiConfig } from '@/lib/ai';
import { formatCityCountry } from '@/lib/customSections';
import { buildBulletMatrixSystemPrompt } from '@/lib/bulletMatrixPrompts';
import { buildStandardCvPrompt } from '@/lib/standardPrompts';

// === DeepSeek API Configuration (Preserved / Commented as requested) ===
// const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

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

    const aiConfig = getAiConfig();
    if (!aiConfig.apiKey) {
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
    // Dedicated Prompt Selection based on CV format
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
          signingLocation,
          customNotes,
          themeDirective,
          matchStrategy,
          currentDateStr
        })
      : buildStandardCvPrompt({
          cvLanguage,
          clLanguage,
          tone,
          lengthTarget,
          bulletStyle,
          skillsFocus: typeof skillsFocus === 'string' ? skillsFocus : (Array.isArray(skillsFocus) ? skillsFocus.join(', ') : 'Tech-Heavy Focus'),
          salaryExpectation,
          noticePeriod,
          signingLocation,
          customNotes,
          themeDirective,
          matchStrategy,
          roleName,
          isNudgeEnabled,
          currentDateStr
        });

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
${contextStr}`
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

    const response = await fetch(aiConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${aiConfig.provider} API Error response:`, errorText);
      return NextResponse.json({ error: `${aiConfig.provider} API returned status ${response.status}: ${errorText}` }, { status: 502 });
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
            return j.company.toLowerCase() === (tailoredJob.company || '').toLowerCase() ||
                   j.company.toLowerCase().includes((tailoredJob.company || '').toLowerCase()) ||
                   (tailoredJob.company || '').toLowerCase().includes(j.company.toLowerCase());
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
        short: paragraphs.slice(0, 2),
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
      if (name && !category) {
        category = classifySkillCategory(name);
      }
      return { name, level, category };
    });

    const mergedProjects = tailoredResult.tailoredCv?.projects
      ? tailoredResult.tailoredCv.projects.map((tailoredProj: any) => {
          const originalProj = filteredProjects.find((p: any) => 
            p.name.toLowerCase() === tailoredProj.name.toLowerCase()
          ) || {};
          
          return {
            name: originalProj.name || tailoredProj.name,
            description: tailoredProj.description || originalProj.description || '',
            technologies: tailoredProj.technologies || originalProj.technologies || [],
            url: originalProj.url || ''
          };
        })
      : [];

    if (cvFormat === 'bullet-matrix') {
      let bullets: string[] = [];
      if (Array.isArray(tailoredResult.tailoredCv?.summaryBullets)) {
        bullets = tailoredResult.tailoredCv.summaryBullets;
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
    }

    tailoredResult.tailoredCv = {
      ...tailoredResult.tailoredCv,
      personalDetails,
      workExperience: mergedWorkExperience,
      education: mergedEducation,
      skills: mergedSkills,
      languages: Array.isArray(tailoredResult.tailoredCv?.languages) ? tailoredResult.tailoredCv.languages : parsedLanguages,
      certifications: Array.isArray(tailoredResult.tailoredCv?.certifications) ? tailoredResult.tailoredCv.certifications : [],
      projects: mergedProjects
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
    console.error('Tailoring API Error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during tailoring' }, { status: 500 });
  }
}
