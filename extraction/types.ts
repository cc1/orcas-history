// Types for extracted data

export interface ExtractedMedia {
  number: string; // "0001", "0002", etc.
  type: 'photo' | 'document' | 'object';
  imageUrl: string; // Google Sites URL (typically =w1280)
  highResUrl?: string; // URL with =s0 or =d if available
  localPath?: string; // Path to downloaded file
  originalPath?: string; // Path to high-res original (from cousin's folder)
  title?: string;
  date?: ExtractedDate;
  location?: string;
  people?: string[];
  description?: string;
  source?: string; // Contributor
  resolutionStatus: 'original' | 'high' | 'web' | 'pending'; // Track what we have
  needsHighRes?: boolean; // Flag for images that need original import
  duplicate?: string; // Reference to canonical image if this is a duplicate
  notRelevant?: boolean; // Flag for images not relevant to project
  notes?: string;
  pageUrl: string; // Source page URL
}

export interface ExtractedDate {
  original: string; // "June 1, 1940", "1948-1949"
  yearStart?: number;
  yearEnd?: number;
  month?: number;
  day?: number;
  precision: 'exact' | 'year_month' | 'year_only' | 'range' | 'approximate' | 'unknown';
}

export interface ExtractedPerson {
  slug: string; // "culver-carroll-nelson"
  displayName: string;
  biography?: string;
  connectionToPtLawrence?: string;
  keyDates?: string; // "1904-1995 (d. Age 91)"
  birthDate?: ExtractedDate;
  deathDate?: ExtractedDate;
  family: {
    parents?: string[];
    spouses?: string[];
    children?: string[];
    siblings?: string[];
  };
  pageUrl: string;
  headerImageUrl?: string;
}

export interface ExtractedTopic {
  slug: string;
  name: string;
  description?: string;
  content: string; // Full page content
  researchQuestions: string[];
  pageUrl: string;
  headerImageUrl?: string;
}

export interface ExtractedEvent {
  slug: string;
  title: string;
  date?: ExtractedDate;
  content: string;
  source?: string;
  pageUrl: string;
}

export interface SiteMap {
  pages: {
    url: string;
    title: string;
    type: 'home' | 'photo_batch' | 'person' | 'topic' | 'news' | 'document' | 'other';
  }[];
  extractedAt: string;
}

export interface ExtractionReport {
  startedAt: string;
  completedAt: string;
  pagesProcessed: number;
  mediaExtracted: number;
  peopleExtracted: number;
  topicsExtracted: number;
  eventsExtracted: number;
  errors: {
    url: string;
    error: string;
  }[];
  warnings: {
    url: string;
    message: string;
  }[];
}
