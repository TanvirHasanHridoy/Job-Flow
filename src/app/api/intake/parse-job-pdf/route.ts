import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { deductTokens, topUpTokens, TOKEN_PRICING } from '@/lib/tokens';
import { getAiConfig } from '@/lib/ai';
import 'pdf-parse/worker';
import { PDFParse } from 'pdf-parse';

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
      await topUpTokens(userId, TOKEN_PRICING.INTAKE);
    } catch (refundErr) {
      console.error('Failed to refund job PDF tokens:', refundErr);
    }
  };

  try {
    const auth = await getAuthUserId();
    if ('error' in auth) return auth.error;
    userId = auth.userId;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file was uploaded.' }, { status: 400 });
    }

    // 1. Extract text from the PDF buffer before charging the user
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let pdfText = '';
    try {
      const parser = new PDFParse({ data: buffer });
      const pdfData = await parser.getText();
      pdfText = pdfData.text || '';
    } catch (parseErr: any) {
      console.error('pdf-parse failure on job description:', parseErr);
      return NextResponse.json(
        { error: `Failed to extract text from the PDF document: ${parseErr.message || parseErr}` },
        { status: 422 }
      );
    }

    if (!pdfText.trim()) {
      return NextResponse.json(
        { error: 'The uploaded PDF appears to be empty or does not contain a machine-readable text layer.' },
        { status: 422 }
      );
    }

    // 2. Deduct tokens only once there is valid text to process
    const deduction = await deductTokens(userId, TOKEN_PRICING.INTAKE);
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
      return NextResponse.json(
        { error: `${aiConfig.provider} API Key is not configured in environment variables.` },
        { status: 500 }
      );
    }

    // === DEEPSEEK API KEY (Preserved / Commented as requested) ===
    // const apiKey = process.env.DEEPSEEK_API_KEY;
    // if (!apiKey) {
    //   return NextResponse.json(
    //     { error: 'DeepSeek API Key is not configured in environment variables.' },
    //     { status: 500 }
    //   );
    // }

    // 2. Query the AI provider to clean and parse the extracted raw text into structured JD details
    const systemPrompt = `You are a professional recruiting intake analyzer. Your task is to process raw text extracted from a job description PDF and extract:
1. Job Title / Role Name (e.g. "Senior React Developer")
2. Company Name (e.g. "Acme Corp")
3. Clean Job Description (Keep requirements, responsibilities, technical skills, benefits. Strip headers, footers, page numbers, formatting relics, or unrelated company meta).

Return a strict JSON object conforming to this template:
{
  "roleName": "<string>",
  "companyName": "<string>",
  "jobDescription": "<string, markdown formatted requirements & job details>"
}`;

    const promptContent = `Here is the raw text extracted from the job description PDF:
--- PDF TEXT ---
${pdfText}

Please parse and return the JSON object.`;

    // === DEEPSEEK PDF Parse Fetch (Commented) ===
    // const response = await fetch(DEEPSEEK_API_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    //   body: JSON.stringify({
    //     model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro',
    //     messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: promptContent }],
    //     response_format: { type: 'json_object' },
    //     temperature: 0.1
    //   })
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
          body: JSON.stringify({
            model: aiConfig.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: promptContent }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1
          }),
          signal: AbortSignal.timeout(90000)
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
        console.error(`${aiConfig.provider} API request failed during job description PDF parsing:`, message);
        return NextResponse.json({ error: message }, { status: 502 });
      }

      const errorText = await response.text().catch(() => '');
      console.error(`${aiConfig.provider} API Error during job description PDF parsing:`, errorText);
      return NextResponse.json(
        { error: `${aiConfig.provider} API returned status ${response.status}: ${errorText}` },
        { status: 502 }
      );
    }

    let parsedData: any;
    try {
      const resJson = await response.json();
      const content = resJson.choices?.[0]?.message?.content || '';
      if (!content.trim()) throw new Error('AI returned an empty response');
      parsedData = JSON.parse(content);
    } catch (parseErr: any) {
      await refundTokens();
      console.error('Failed to parse job description PDF AI output:', parseErr);
      return NextResponse.json({ error: 'AI produced invalid JSON output. Please retry.' }, { status: 502 });
    }

    return NextResponse.json(parsedData);
  } catch (error: any) {
    await refundTokens();
    console.error('Parse job PDF API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during job PDF parsing' }, { status: 500 });
  }
}
