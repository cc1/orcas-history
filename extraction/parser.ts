import * as cheerio from 'cheerio';
import type { ExtractedMedia, ExtractedPerson, ExtractedTopic, ExtractedDate } from './types.js';

/**
 * Parse a date string into structured format
 */
export function parseDate(dateStr: string): ExtractedDate {
  const trimmed = dateStr.trim();

  // Range: "1948-1949"
  const rangeMatch = trimmed.match(/^(\d{4})\s*[-–]\s*(\d{4})$/);
  if (rangeMatch) {
    return {
      original: trimmed,
      yearStart: parseInt(rangeMatch[1]),
      yearEnd: parseInt(rangeMatch[2]),
      precision: 'range'
    };
  }

  // Full date: "June 1, 1940" or "April 07, 1904"
  const fullDateMatch = trimmed.match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (fullDateMatch) {
    const months: Record<string, number> = {
      january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
      july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
    };
    const month = months[fullDateMatch[1].toLowerCase()];
    return {
      original: trimmed,
      yearStart: parseInt(fullDateMatch[3]),
      month: month,
      day: parseInt(fullDateMatch[2]),
      precision: 'exact'
    };
  }

  // Year only: "1940"
  const yearMatch = trimmed.match(/^(\d{4})$/);
  if (yearMatch) {
    return {
      original: trimmed,
      yearStart: parseInt(yearMatch[1]),
      precision: 'year_only'
    };
  }

  // Approximate: "c. 1940" or "circa 1940"
  const approxMatch = trimmed.match(/(?:c\.?|circa)\s*(\d{4})/i);
  if (approxMatch) {
    return {
      original: trimmed,
      yearStart: parseInt(approxMatch[1]),
      precision: 'approximate'
    };
  }

  // Unknown/TBD
  return {
    original: trimmed,
    precision: 'unknown'
  };
}

/**
 * Convert Google image URL to high-res version
 */
export function getHighResImageUrl(url: string): string {
  // Google Sites images have format: https://lh3.googleusercontent.com/...=w1280
  // Change =w1280 to =s0 for original size
  if (url.includes('googleusercontent.com')) {
    return url.replace(/=[ws]\d+$/, '=s0');
  }
  return url;
}

/**
 * Parse a photo batch page HTML into structured media objects
 */
export function parsePhotoBatchPage(html: string, pageUrl: string): ExtractedMedia[] {
  const $ = cheerio.load(html);
  const media: ExtractedMedia[] = [];

  // Find all image containers (Google Sites structure varies)
  // Look for images followed by metadata text
  const mainContent = $('main, [role="main"]').first();
  const text = mainContent.text();

  // Split by photo numbers (0001, 0002, etc.)
  const photoSections = text.split(/\b(\d{4})\b/).filter(Boolean);

  // Find all images
  const images = mainContent.find('img').toArray();

  // Match images with their metadata sections
  // This is a simplified parser - may need refinement based on actual structure

  return media;
}

/**
 * Parse metadata fields from text content
 */
export function parseMetadataFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {};

  const patterns = [
    { key: 'date', pattern: /Date:\s*(.+?)(?=\n|Location:|People:|Description:|Source:|Resolution:|Notes:|$)/i },
    { key: 'location', pattern: /Location:\s*(.+?)(?=\n|Date:|People:|Description:|Source:|Resolution:|Notes:|$)/i },
    { key: 'people', pattern: /People:\s*(.+?)(?=\n|Date:|Location:|Description:|Source:|Resolution:|Notes:|$)/i },
    { key: 'description', pattern: /Description:\s*(.+?)(?=\n|Date:|Location:|People:|Source:|Resolution:|Notes:|$)/i },
    { key: 'source', pattern: /Source:\s*(.+?)(?=\n|Date:|Location:|People:|Description:|Resolution:|Notes:|$)/i },
    { key: 'resolution', pattern: /Resolution:\s*(.+?)(?=\n|Date:|Location:|People:|Description:|Source:|Notes:|$)/i },
    { key: 'notes', pattern: /Notes:\s*(.+?)(?=\n|Date:|Location:|People:|Description:|Source:|Resolution:|$)/i },
  ];

  for (const { key, pattern } of patterns) {
    const match = text.match(pattern);
    if (match) {
      fields[key] = match[1].trim();
    }
  }

  return fields;
}

/**
 * Parse a person page HTML into structured person object
 */
export function parsePersonPage(html: string, pageUrl: string): ExtractedPerson {
  const $ = cheerio.load(html);
  const mainContent = $('main, [role="main"]').first();
  const text = mainContent.text();

  // Extract slug from URL
  const slug = pageUrl.split('/').pop() || '';

  // Extract display name from h1/title
  const displayName = $('h1').first().text().trim() ||
                      $('title').text().replace(' - The Pt. Lawrence Project', '').trim();

  // Extract family relationships
  const family: ExtractedPerson['family'] = {};

  const parentMatch = text.match(/(?:Son of|Daughter of|Child of):\s*(.+?)(?=\n|Husband|Wife|Father|Mother|Brother|Sister|Key Dates|$)/i);
  if (parentMatch) {
    family.parents = parentMatch[1].split(/,\s*and\s*|,\s*/).map(s => s.trim());
  }

  const spouseMatch = text.match(/(?:Husband of|Wife of|Spouse of|Married to):\s*(.+?)(?=\n|Son|Daughter|Father|Mother|Brother|Sister|Key Dates|$)/i);
  if (spouseMatch) {
    family.spouses = spouseMatch[1].split(/,\s*/).map(s => s.trim());
  }

  const childMatch = text.match(/(?:Father of|Mother of|Parent of):\s*(.+?)(?=\n|Son|Daughter|Husband|Wife|Brother|Sister|Key Dates|$)/i);
  if (childMatch) {
    family.children = childMatch[1].split(/,\s*/).map(s => s.trim());
  }

  const siblingMatch = text.match(/(?:Brother of|Sister of|Sibling of):\s*(.+?)(?=\n|Son|Daughter|Husband|Wife|Father|Mother|Key Dates|$)/i);
  if (siblingMatch) {
    family.siblings = siblingMatch[1].split(/,\s*and\s*|,\s*/).map(s => s.trim());
  }

  // Extract key dates
  const keyDatesMatch = text.match(/Key Dates:\s*(.+?)(?=\n\n|\d{4}:|\d{4}\s*\(Age)/i);
  const keyDates = keyDatesMatch ? keyDatesMatch[1].trim() : undefined;

  // Extract connection to Pt. Lawrence
  const connectionMatch = text.match(/Connection to Pt\. Lawrence\s*\n\s*(.+?)(?=\n\n|Immediate Family|$)/is);
  const connectionToPtLawrence = connectionMatch ? connectionMatch[1].trim() : undefined;

  // Extract biography (everything after "Key Dates" section)
  const bioMatch = text.match(/Key Dates:[\s\S]*?\n\n([\s\S]+)/i);
  const biography = bioMatch ? bioMatch[1].trim() : undefined;

  // Get header image
  const headerImg = mainContent.find('img').first();
  const headerImageUrl = headerImg.length ? getHighResImageUrl(headerImg.attr('src') || '') : undefined;

  return {
    slug,
    displayName,
    biography,
    connectionToPtLawrence,
    keyDates,
    family,
    pageUrl,
    headerImageUrl,
  };
}

/**
 * Parse a topic page HTML into structured topic object
 */
export function parseTopicPage(html: string, pageUrl: string): ExtractedTopic {
  const $ = cheerio.load(html);
  const mainContent = $('main, [role="main"]').first();
  const text = mainContent.text();

  const slug = pageUrl.split('/').pop() || '';
  const name = $('h1').first().text().trim() ||
               $('title').text().replace(' - The Pt. Lawrence Project', '').trim();

  // Extract research questions (lines ending with ?)
  const questions = text.match(/[^\n]+\?/g) || [];
  const researchQuestions = questions.map(q => q.trim()).filter(q => q.length > 10);

  // Get header image
  const headerImg = mainContent.find('img').first();
  const headerImageUrl = headerImg.length ? getHighResImageUrl(headerImg.attr('src') || '') : undefined;

  return {
    slug,
    name,
    content: text,
    researchQuestions,
    pageUrl,
    headerImageUrl,
  };
}

/**
 * Generate a slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
