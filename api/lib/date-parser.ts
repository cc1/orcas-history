/**
 * Date parsing utilities for historical dates
 *
 * Handles various date formats found in historical records:
 * - Exact dates: "June 1, 1940", "1 June 1940", "6/1/1940"
 * - Month + year: "June 1940"
 * - Year only: "1940", "1940s"
 * - Ranges: "1948-1949", "1948-49"
 * - Approximate: "c. 1940", "circa 1940", "about 1940"
 * - Unknown: "TBD", "", "unknown"
 */

// ============================================================================
// Types
// ============================================================================

export type DatePrecision =
  | 'exact'        // Full date known: June 1, 1940
  | 'year_month'   // Month and year: June 1940
  | 'year_only'    // Just year: 1940
  | 'range'        // Year range: 1948-1949
  | 'approximate'  // Approximate: c. 1940
  | 'unknown'      // Unknown or TBD

export interface ParsedDate {
  originalText: string
  yearStart: number | null
  yearEnd: number | null
  month: number | null
  day: number | null
  precision: DatePrecision
  dateSort: number | null
}

// ============================================================================
// Constants
// ============================================================================

const MONTHS: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
}

const APPROXIMATE_PREFIXES = /^(c\.?|circa|about|around|~|approx\.?)\s*/i

// ============================================================================
// Helper Functions
// ============================================================================

function computeDateSort(year: number, month?: number | null, day?: number | null): number {
  // Format: YYYYMMDD for sorting
  // Default to mid-points when components are missing
  const m = month ?? 7   // July (mid-year) if no month
  const d = day ?? 15    // Mid-month if no day
  return year * 10000 + m * 100 + d
}

function parseMonthName(name: string): number | null {
  return MONTHS[name.toLowerCase()] ?? null
}

// ============================================================================
// Pattern Matchers
// ============================================================================

function tryParseRange(text: string): Partial<ParsedDate> | null {
  // Matches: "1948-1949", "1948-49", "1948–1949" (en-dash)
  const match = text.match(/(\d{4})\s*[-–]\s*(\d{2,4})/)
  if (!match) return null

  const yearStart = parseInt(match[1])
  const endPart = match[2]
  const yearEnd = endPart.length === 2
    ? parseInt(match[1].slice(0, 2) + endPart)
    : parseInt(endPart)

  return {
    yearStart,
    yearEnd,
    month: null,
    day: null,
    dateSort: computeDateSort(yearStart, 1, 1), // Jan 1 of start year
  }
}

function tryParseFullDate(text: string): Partial<ParsedDate> | null {
  // Pattern 1: "June 1, 1940" or "June 1 1940"
  const pattern1 = text.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/)
  if (pattern1) {
    const month = parseMonthName(pattern1[1])
    const day = parseInt(pattern1[2])
    const year = parseInt(pattern1[3])
    if (month && day >= 1 && day <= 31) {
      return { yearStart: year, month, day, dateSort: computeDateSort(year, month, day) }
    }
  }

  // Pattern 2: "1 June 1940"
  const pattern2 = text.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
  if (pattern2) {
    const day = parseInt(pattern2[1])
    const month = parseMonthName(pattern2[2])
    const year = parseInt(pattern2[3])
    if (month && day >= 1 && day <= 31) {
      return { yearStart: year, month, day, dateSort: computeDateSort(year, month, day) }
    }
  }

  // Pattern 3: "6/1/1940" (M/D/YYYY)
  const pattern3 = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (pattern3) {
    const month = parseInt(pattern3[1])
    const day = parseInt(pattern3[2])
    const year = parseInt(pattern3[3])
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { yearStart: year, month, day, dateSort: computeDateSort(year, month, day) }
    }
  }

  return null
}

function tryParseMonthYear(text: string): Partial<ParsedDate> | null {
  // Matches: "June 1940", "Jun 1940"
  const match = text.match(/(\w+)\s+(\d{4})/)
  if (!match) return null

  const month = parseMonthName(match[1])
  const year = parseInt(match[2])

  if (!month) return null

  return {
    yearStart: year,
    month,
    day: null,
    dateSort: computeDateSort(year, month, 15), // Mid-month
  }
}

function tryParseYearOnly(text: string): Partial<ParsedDate> | null {
  // Matches: "1940", "1940s"
  const match = text.match(/(\d{4})s?/)
  if (!match) return null

  const year = parseInt(match[1])
  return {
    yearStart: year,
    month: null,
    day: null,
    dateSort: computeDateSort(year), // Mid-year
  }
}

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Parse a date string into structured components with precision tracking.
 *
 * @param text - The date string to parse (e.g., "June 1, 1940", "c. 1940")
 * @returns Parsed date components with precision and sort value
 */
export function parseDate(text: string): ParsedDate {
  const trimmed = text.trim()

  // Handle empty/unknown values
  if (!trimmed || /^(tbd|unknown)$/i.test(trimmed)) {
    return {
      originalText: trimmed,
      yearStart: null,
      yearEnd: null,
      month: null,
      day: null,
      precision: 'unknown',
      dateSort: null,
    }
  }

  // Check for approximate prefix
  const isApproximate = APPROXIMATE_PREFIXES.test(trimmed)
  const cleanText = trimmed.replace(APPROXIMATE_PREFIXES, '')

  // Try each pattern in order of specificity
  const result: ParsedDate = {
    originalText: trimmed,
    yearStart: null,
    yearEnd: null,
    month: null,
    day: null,
    precision: 'unknown',
    dateSort: null,
  }

  // Try range first (most specific structure)
  const range = tryParseRange(cleanText)
  if (range) {
    Object.assign(result, range)
    result.precision = isApproximate ? 'approximate' : 'range'
    return result
  }

  // Try full date
  const fullDate = tryParseFullDate(cleanText)
  if (fullDate) {
    Object.assign(result, fullDate)
    result.precision = isApproximate ? 'approximate' : 'exact'
    return result
  }

  // Try month + year
  const monthYear = tryParseMonthYear(cleanText)
  if (monthYear) {
    Object.assign(result, monthYear)
    result.precision = isApproximate ? 'approximate' : 'year_month'
    return result
  }

  // Try year only
  const yearOnly = tryParseYearOnly(cleanText)
  if (yearOnly) {
    Object.assign(result, yearOnly)
    result.precision = isApproximate ? 'approximate' : 'year_only'
    return result
  }

  // Couldn't parse - return as unknown
  return result
}

/**
 * Format a parsed date back to a human-readable string.
 *
 * @param parsed - The parsed date object
 * @returns Formatted date string
 */
export function formatDate(parsed: ParsedDate): string {
  if (parsed.precision === 'unknown' || !parsed.yearStart) {
    return parsed.originalText || 'Unknown'
  }

  const monthNames = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  const isApprox = parsed.originalText?.match(APPROXIMATE_PREFIXES)
  const prefix = isApprox ? 'c. ' : ''

  if (parsed.precision === 'range' && parsed.yearEnd) {
    return `${prefix}${parsed.yearStart}-${parsed.yearEnd}`
  }

  if (parsed.precision === 'exact' && parsed.month && parsed.day) {
    return `${prefix}${monthNames[parsed.month]} ${parsed.day}, ${parsed.yearStart}`
  }

  if (parsed.precision === 'year_month' && parsed.month) {
    return `${prefix}${monthNames[parsed.month]} ${parsed.yearStart}`
  }

  return `${prefix}${parsed.yearStart}`
}
