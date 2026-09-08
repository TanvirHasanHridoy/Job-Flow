export interface ParsedJobData {
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  jobType?: string;
  url: string;
  source: 'linkedin' | 'stepstone' | 'indeed' | 'xing' | 'schema' | 'universal' | 'manual';
  extractedAt: string;
}

export interface JobSiteParser {
  name: string;
  matches(url: string): boolean;
  parse(): Promise<ParsedJobData | null> | ParsedJobData | null;
}
