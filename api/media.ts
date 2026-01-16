/**
 * API route: GET /api/media
 * Returns all media (photos and documents) with optional filtering
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, media, dateValue, mediaPerson } from './_lib/db.js'
import { eq, and, or, desc, asc, sql, isNull, notExists } from 'drizzle-orm'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      category,
      sort = 'number',
      needsDate,
      missingInfo,
      limit = '100',
      offset = '0'
    } = req.query

    // Build where conditions
    const conditions = [
      eq(media.notRelevant, false),
      eq(media.isDuplicate, false),
    ]

    if (category === 'document') {
      conditions.push(eq(media.category, 'document'))
    } else if (category === 'photo') {
      conditions.push(eq(media.category, 'photo'))
    }

    if (needsDate === 'true') {
      conditions.push(eq(media.needsDate, true))
    }

    // Missing Information: photos with blank date OR no linked people
    if (missingInfo === 'true') {
      // Subquery to check if media has any linked people
      const hasNoPeople = notExists(
        db.select({ one: sql`1` })
          .from(mediaPerson)
          .where(eq(mediaPerson.mediaId, media.id))
      )

      // Missing date: needsDate flag is true OR dateId is null
      const missingDate = or(
        eq(media.needsDate, true),
        isNull(media.dateId)
      )

      conditions.push(or(missingDate, hasNoPeople)!)
    }

    // Query with sorting
    let orderBy
    if (sort === 'year-asc') {
      orderBy = asc(media.dateSort)
    } else if (sort === 'year-desc') {
      orderBy = desc(media.dateSort)
    } else if (sort === 'random') {
      orderBy = sql`RANDOM()`
    } else {
      orderBy = asc(media.number)
    }

    const results = await db
      .select({
        id: media.id,
        number: media.number,
        category: media.category,
        title: media.title,
        description: media.description,
        googleUrl: media.googleUrl,
        webImagePath: media.webImagePath,
        dateSort: media.dateSort,
        needsDate: media.needsDate,
        locationText: media.locationText,
        sourceText: media.sourceText,
        hasHighRes: media.hasHighRes,
        notes: media.notes,
        dateOriginalText: dateValue.originalText,
        datePrecision: dateValue.precision,
      })
      .from(media)
      .leftJoin(dateValue, eq(media.dateId, dateValue.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(parseInt(limit as string, 10))
      .offset(parseInt(offset as string, 10))

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(media)
      .where(and(...conditions))

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
    return res.status(200).json({
      data: results,
      total: Number(countResult[0].count),
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    })
  } catch (error) {
    console.error('Error fetching media:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
