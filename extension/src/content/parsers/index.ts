import { ParsedJobData } from './types';
import { linkedinParser } from './linkedin';
import { stepstoneParser } from './stepstone';
import { indeedParser } from './indeed';
import { xingParser } from './xing';
import { universalParser } from './universal';

const targetedParsers = [
  linkedinParser,
  stepstoneParser,
  indeedParser,
  xingParser
];

export async function parseCurrentPage(): Promise<ParsedJobData | null> {
  const currentUrl = window.location.href;

  // 1. Try targeted site parser first
  for (const parser of targetedParsers) {
    if (parser.matches(currentUrl)) {
      try {
        const result = await parser.parse();
        if (result && (result.description.length > 80 || result.title.length > 3)) {
          return result;
        }
      } catch (err) {
        console.warn(`[JobFlow] ${parser.name} parser failed:`, err);
      }
    }
  }

  // 2. Fallback to universal parser
  try {
    const fallbackResult = await universalParser.parse();
    if (fallbackResult && fallbackResult.description.length > 80) {
      return fallbackResult;
    }
  } catch (err) {
    console.warn('[JobFlow] Universal parser failed:', err);
  }

  return null;
}

export * from './types';
