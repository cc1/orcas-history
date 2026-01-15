/**
 * API route: GET /api/media/:number
 * Returns a single media item by its number (e.g., "0001")
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, media, dateValue } from '../lib/db.js'
import { eq } from 'drizzle-orm'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
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
