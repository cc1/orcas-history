/**
 * API route: GET/PATCH /api/media/:number
 * GET: Returns a single media item by its number (e.g., "0001")
 * PATCH: Updates media fields (description, source, notes, date)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, media, dateValue } from '../lib/db.js'
import { eq } from 'drizzle-orm'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (req.method === 'PATCH') {
    return handlePatch(req, res)
  }

  const { number } = req.query

  if (!number || typeof number !== 'string') {
    return res.status(400).json({ error: 'Invalid media number' })
  }

  try {
    const results = await db
      .select({
        id: media.id,
        number: media.number,
        category: media.category,
        title: media.title,
        description: media.description,
        googleUrl: media.googleUrl,
        webImagePath: media.webImagePath,
        originalImagePath: media.originalImagePath,
        resolutionStatus: media.resolutionStatus,
        dateSort: media.dateSort,
        needsDate: media.needsDate,
        locationText: media.locationText,
        sourceText: media.sourceText,
        sourcePageUrl: media.sourcePageUrl,
        externalUrl: media.externalUrl,
        hasHighRes: media.hasHighRes,
        isDuplicate: media.isDuplicate,
        notes: media.notes,
        dateOriginalText: dateValue.originalText,
        datePrecision: dateValue.precision,
        dateYearStart: dateValue.yearStart,
        dateYearEnd: dateValue.yearEnd,
        dateMonth: dateValue.month,
        dateDay: dateValue.day,
      })
      .from(media)
      .leftJoin(dateValue, eq(media.dateId, dateValue.id))
      .where(eq(media.number, number))
      .limit(1)

    if (results.length === 0) {
      return res.status(404).json({ error: 'Media not found' })
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.status(200).json({ data: results[0] })
  } catch (error) {
    console.error('Error fetching media:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Parse date text into structured components with fuzzy logic
function parseDate(text: string): {
  originalText: string
  yearStart: number | null
  yearEnd: number | null
  month: number | null
  day: number | null
  precision: 'exact' | 'year_month' | 'year_only' | 'range' | 'approximate' | 'unknown'
  dateSort: number | null
} {
  const trimmed = text.trim()
  if (!trimmed || trimmed.toLowerCase() === 'tbd' || trimmed.toLowerCase() === 'unknown') {
    return { originalText: trimmed, yearStart: null, yearEnd: null, month: null, day: null, precision: 'unknown', dateSort: null }
  }

  const months: Record<string, number> = {
    january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3,
    april: 4, apr: 4, may: 5, june: 6, jun: 6, july: 7, jul: 7,
    august: 8, aug: 8, september: 9, sep: 9, sept: 9,
    october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12
  }

  let yearStart: number | null = null
  let yearEnd: number | null = null
  let month: number | null = null
  let day: number | null = null
  let precision: 'exact' | 'year_month' | 'year_only' | 'range' | 'approximate' | 'unknown' = 'unknown'
  const isApproximate = /^(c\.?|circa|about|around|~|approx)/i.test(trimmed)
  const cleanText = trimmed.replace(/^(c\.?|circa|about|around|~|approx\.?)\s*/i, '')

  // Try range pattern: "1948-1949" or "1948-49"
  const rangeMatch = cleanText.match(/(\d{4})\s*[-–]\s*(\d{2,4})/)
  if (rangeMatch) {
    yearStart = parseInt(rangeMatch[1])
    const endPart = rangeMatch[2]
    yearEnd = endPart.length === 2
      ? parseInt(rangeMatch[1].slice(0, 2) + endPart)
      : parseInt(endPart)
    precision = isApproximate ? 'approximate' : 'range'
    const dateSort = yearStart * 10000 + 101 // Jan 1 of start year
    return { originalText: trimmed, yearStart, yearEnd, month, day, precision, dateSort }
  }

  // Try full date: "June 1, 1940" or "1 June 1940" or "6/1/1940"
  const fullDateMatch = cleanText.match(/(?:(\w+)\s+(\d{1,2}),?\s+(\d{4}))|(?:(\d{1,2})\s+(\w+)\s+(\d{4}))|(?:(\d{1,2})\/(\d{1,2})\/(\d{4}))/)
  if (fullDateMatch) {
    if (fullDateMatch[1]) {
      // "June 1, 1940"
      month = months[fullDateMatch[1].toLowerCase()] || null
      day = parseInt(fullDateMatch[2])
      yearStart = parseInt(fullDateMatch[3])
    } else if (fullDateMatch[4]) {
      // "1 June 1940"
      day = parseInt(fullDateMatch[4])
      month = months[fullDateMatch[5].toLowerCase()] || null
      yearStart = parseInt(fullDateMatch[6])
    } else if (fullDateMatch[7]) {
      // "6/1/1940"
      month = parseInt(fullDateMatch[7])
      day = parseInt(fullDateMatch[8])
      yearStart = parseInt(fullDateMatch[9])
    }
    if (yearStart && month && day) {
      precision = isApproximate ? 'approximate' : 'exact'
      const dateSort = yearStart * 10000 + month * 100 + day
      return { originalText: trimmed, yearStart, yearEnd, month, day, precision, dateSort }
    }
  }

  // Try month + year: "June 1940"
  const monthYearMatch = cleanText.match(/(\w+)\s+(\d{4})/)
  if (monthYearMatch) {
    month = months[monthYearMatch[1].toLowerCase()] || null
    yearStart = parseInt(monthYearMatch[2])
    if (month && yearStart) {
      precision = isApproximate ? 'approximate' : 'year_month'
      const dateSort = yearStart * 10000 + month * 100 + 15 // Mid-month for sorting
      return { originalText: trimmed, yearStart, yearEnd, month, day, precision, dateSort }
    }
  }

  // Try year only: "1940" or "1940s"
  const yearMatch = cleanText.match(/(\d{4})s?/)
  if (yearMatch) {
    yearStart = parseInt(yearMatch[1])
    precision = isApproximate ? 'approximate' : 'year_only'
    const dateSort = yearStart * 10000 + 701 // July 1 for year-only (mid-year)
    return { originalText: trimmed, yearStart, yearEnd, month, day, precision, dateSort }
  }

  return { originalText: trimmed, yearStart: null, yearEnd: null, month: null, day: null, precision: 'unknown', dateSort: null }
}

async function handlePatch(req: VercelRequest, res: VercelResponse) {
  const { number } = req.query

  if (!number || typeof number !== 'string') {
    return res.status(400).json({ error: 'Invalid media number' })
  }

  const { field, value } = req.body

  if (!field || typeof field !== 'string') {
    return res.status(400).json({ error: 'Field is required' })
  }

  // Handle date updates specially (stored in separate dateValue table)
  if (field === 'date') {
    return handleDateUpdate(number, value || '', res)
  }

  // Map frontend field names to database columns for simple text fields
  const fieldMap: Record<string, keyof typeof media> = {
    description: 'description',
    source: 'sourceText',
    notes: 'notes',
  }

  const dbField = fieldMap[field]
  if (!dbField) {
    return res.status(400).json({ error: `Invalid field: ${field}` })
  }

  try {
    await db
      .update(media)
      .set({ [dbField]: value || null })
      .where(eq(media.number, number))

    return res.status(200).json({ success: true, field, value })
  } catch (error) {
    console.error('Error updating media:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleDateUpdate(number: string, dateText: string, res: VercelResponse) {
  try {
    // Get existing media record to find current dateId
    const [mediaRecord] = await db
      .select({ id: media.id, dateId: media.dateId })
      .from(media)
      .where(eq(media.number, number))
      .limit(1)

    if (!mediaRecord) {
      return res.status(404).json({ error: 'Media not found' })
    }

    const parsed = parseDate(dateText)

    if (mediaRecord.dateId) {
      // Update existing dateValue record
      await db
        .update(dateValue)
        .set({
          originalText: parsed.originalText,
          yearStart: parsed.yearStart,
          yearEnd: parsed.yearEnd,
          month: parsed.month,
          day: parsed.day,
          precision: parsed.precision,
        })
        .where(eq(dateValue.id, mediaRecord.dateId))
    } else if (parsed.originalText) {
      // Create new dateValue record
      const [newDateValue] = await db
        .insert(dateValue)
        .values({
          originalText: parsed.originalText,
          yearStart: parsed.yearStart,
          yearEnd: parsed.yearEnd,
          month: parsed.month,
          day: parsed.day,
          precision: parsed.precision,
        })
        .returning({ id: dateValue.id })

      // Link it to the media record
      await db
        .update(media)
        .set({ dateId: newDateValue.id, dateSort: parsed.dateSort })
        .where(eq(media.number, number))

      return res.status(200).json({ success: true, field: 'date', value: dateText, parsed })
    }

    // Update dateSort on media for sorting
    await db
      .update(media)
      .set({ dateSort: parsed.dateSort })
      .where(eq(media.number, number))

    return res.status(200).json({ success: true, field: 'date', value: dateText, parsed })
  } catch (error) {
    console.error('Error updating date:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
