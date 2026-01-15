/**
 * Utility functions for seeding data
 */

// Month name to number mapping
const MONTH_MAP: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4,
  may: 5, june: 6, july: 7, august: 8,
  september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4,
  jun: 6, jul: 7, aug: 8, sep: 9, sept: 9,
  oct: 10, nov: 11, dec: 12
}

export interface ParsedDate {
  originalText: string
  yearStart: number | null
  yearEnd: number | null
  month: number | null
  day: number | null
  precision: 'exact' | 'year_month' | 'year_only' | 'range' | 'approximate' | 'unknown'
  dateSort: number | null // YYYYMMDD format for sorting
  needsDate: boolean
}

/**
 * Parse a date string into structured date info
 * Handles formats like:
 * - "June 1, 1940"
 * - "1948-1949"
 * - "Estimated 1949"
 * - "c. 1940"
 * - "TBD"
 */
export function parseDate(dateText: string | undefined | null): ParsedDate {
  if (!dateText || dateText === 'TBD' || dateText.trim() === '') {
    return {
      originalText: dateText || '',
      yearStart: null,
      yearEnd: null,
      month: null,
      day: null,
      precision: 'unknown',
      dateSort: null,
      needsDate: true
    }
  }

  const text = dateText.trim()
  let yearStart: number | null = null
  let yearEnd: number | null = null
  let month: number | null = null
  let day: number | null = null
  let precision: ParsedDate['precision'] = 'unknown'
  let needsDate = false

  // Check for approximate markers
  const isApproximate = /^(c\.|circa|about|approx|estimated|~)/i.test(text)
  const cleanText = text.replace(/^(c\.|circa|about|approx\.?|estimated|~)\s*/i, '')

  // Try to match year range: "1948-1949" or "1948–1949"
  const rangeMatch = cleanText.match(/(\d{4})\s*[-–]\s*(\d{4})/)
  if (rangeMatch) {
    yearStart = parseInt(rangeMatch[1])
    yearEnd = parseInt(rangeMatch[2])
    precision = 'range'
    return {
      originalText: text,
      yearStart,
      yearEnd,
      month: null,
      day: null,
      precision,
      dateSort: yearStart * 10000, // Use start year for sorting
      needsDate: false
    }
  }

  // Try to match full date: "June 1, 1940" or "June 1 1940" or "1 June 1940"
  const fullDateMatch = cleanText.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/) ||
                        cleanText.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
  if (fullDateMatch) {
    const [, part1, part2, part3] = fullDateMatch

    // Determine which format we matched
    if (isNaN(parseInt(part1))) {
      // "Month Day, Year" format
      month = MONTH_MAP[part1.toLowerCase()] || null
      day = parseInt(part2)
      yearStart = parseInt(part3)
    } else {
      // "Day Month Year" format
      day = parseInt(part1)
      month = MONTH_MAP[part2.toLowerCase()] || null
      yearStart = parseInt(part3)
    }

    if (month && day && yearStart) {
      precision = isApproximate ? 'approximate' : 'exact'
      return {
        originalText: text,
        yearStart,
        yearEnd: null,
        month,
        day,
        precision,
        dateSort: yearStart * 10000 + month * 100 + day,
        needsDate: false
      }
    }
  }

  // Try to match month and year: "June 1940"
  const monthYearMatch = cleanText.match(/(\w+)\s+(\d{4})/)
  if (monthYearMatch) {
    const monthName = monthYearMatch[1].toLowerCase()
    if (MONTH_MAP[monthName]) {
      month = MONTH_MAP[monthName]
      yearStart = parseInt(monthYearMatch[2])
      precision = isApproximate ? 'approximate' : 'year_month'
      return {
        originalText: text,
        yearStart,
        yearEnd: null,
        month,
        day: null,
        precision,
        dateSort: yearStart * 10000 + month * 100,
        needsDate: false
      }
    }
  }

  // Try to match just year: "1940"
  const yearMatch = cleanText.match(/(\d{4})/)
  if (yearMatch) {
    yearStart = parseInt(yearMatch[1])
    precision = isApproximate ? 'approximate' : 'year_only'
    return {
      originalText: text,
      yearStart,
      yearEnd: null,
      month: null,
      day: null,
      precision,
      dateSort: yearStart * 10000,
      needsDate: false
    }
  }

  // Couldn't parse - mark as needing date
  return {
    originalText: text,
    yearStart: null,
    yearEnd: null,
    month: null,
    day: null,
    precision: 'unknown',
    dateSort: null,
    needsDate: true
  }
}

/**
 * Generate a slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Parse people field which can be a string with comma/and separated names
 * Returns array of person names
 */
export function parsePeopleField(people: string | undefined | null): string[] {
  if (!people || people === 'TBD' || people === 'NA' || people.trim() === '') {
    return []
  }

  // Split by comma and "and"
  return people
    .split(/,\s*|\s+and\s+/i)
    .map(name => name.trim())
    .filter(name => name.length > 0 && name !== 'TBD' && name !== 'NA')
}

/**
 * Known duplicates mapping (duplicate -> primary)
 */
export const KNOWN_DUPLICATES: Record<string, string> = {
  '0003': '0414',
  '0007': '0258',
  '0030': '0002',
  '0156': '0287',
  '0225': '0402',
  '0353': '0213',
  '0355': '0314',
  '0635': '0065'
}

/**
 * Photos to mark as hidden/not relevant
 */
export const HIDDEN_PHOTOS = ['0460']

/**
 * Places (geographic topics with coordinates)
 */
export const PLACE_SLUGS = [
  'alderbrook-farm',
  'blakely-mill',
  'doe-bay',
  'mt-constitution',
  'olga',
  'olga-cemetery',
  'pt-lawrence-lodge',
  'sea-acres',
  'shorewood'
]

/**
 * Approximate coordinates for places
 */
export const PLACE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'alderbrook-farm': { lat: 48.6789, lng: -122.8234 },
  'blakely-mill': { lat: 48.5750, lng: -122.8100 },
  'doe-bay': { lat: 48.6631, lng: -122.7972 },
  'mt-constitution': { lat: 48.6803, lng: -122.8317 },
  'olga': { lat: 48.6256, lng: -122.8186 },
  'olga-cemetery': { lat: 48.6280, lng: -122.8200 },
  'pt-lawrence-lodge': { lat: 48.6789, lng: -122.7456 },
  'sea-acres': { lat: 48.6700, lng: -122.7600 },
  'shorewood': { lat: 48.6650, lng: -122.7550 }
}

/**
 * Get local image path from photo number
 */
export function getImagePath(photoNumber: string): string {
  return `/extraction/data/images/${photoNumber}.jpg`
}
