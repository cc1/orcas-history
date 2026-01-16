/**
 * API route: GET/PATCH/POST /api/media/:number
 * GET: Returns a single media item by its number (e.g., "0001")
 * PATCH: Updates media fields (description, source, notes, date)
 * POST: Updates media-entity relationships (people, places) - use ?action=links
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, media, dateValue, mediaPerson, mediaPlace, person, place } from '../lib/db.js'
import { eq, inArray } from 'drizzle-orm'
import { parseDate } from '../lib/date-parser.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'PATCH' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { number } = req.query
  if (!number || typeof number !== 'string') {
    return res.status(400).json({ error: 'Invalid media number' })
  }

  if (req.method === 'POST') {
    return handleLinksUpdate(req, res, number)
  }

  if (req.method === 'PATCH') {
    return handlePatch(req, res, number)
  }

  return handleGet(res, number)
}

// ============================================================================
// GET Handler
// ============================================================================

async function handleGet(res: VercelResponse, number: string) {
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

// ============================================================================
// PATCH Handler
// ============================================================================

const FIELD_MAP: Record<string, keyof typeof media> = {
  description: 'description',
  source: 'sourceText',
  notes: 'notes',
}

async function handlePatch(req: VercelRequest, res: VercelResponse, number: string) {
  const { field, value } = req.body

  if (!field || typeof field !== 'string') {
    return res.status(400).json({ error: 'Field is required' })
  }

  // Date updates are handled separately (stored in dateValue table)
  if (field === 'date') {
    return handleDateUpdate(number, value || '', res)
  }

  const dbField = FIELD_MAP[field]
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

// ============================================================================
// Date Update Handler
// ============================================================================

async function handleDateUpdate(number: string, dateText: string, res: VercelResponse) {
  try {
    // Get existing media record
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
      // Create new dateValue record and link to media
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

// ============================================================================
// Links Update Handler (POST)
// ============================================================================

interface LinkUpdate {
  people?: Array<{ id: string; slug: string; name: string }>
  place?: { id: string; slug: string; name: string } | null
}

async function handleLinksUpdate(req: VercelRequest, res: VercelResponse, number: string) {
  try {
    // Get the media record
    const [mediaRecord] = await db
      .select({ id: media.id })
      .from(media)
      .where(eq(media.number, number))
      .limit(1)

    if (!mediaRecord) {
      return res.status(404).json({ error: 'Media not found' })
    }

    const mediaId = mediaRecord.id
    const updates: LinkUpdate = req.body

    // Update people links
    if (updates.people !== undefined) {
      // Delete existing links
      await db.delete(mediaPerson).where(eq(mediaPerson.mediaId, mediaId))

      // Insert new links
      if (updates.people && updates.people.length > 0) {
        const personIds = updates.people.map(p => p.id)

        // Verify all person IDs exist
        const validPeople = await db
          .select({ id: person.id })
          .from(person)
          .where(inArray(person.id, personIds))

        const validPersonIds = new Set(validPeople.map(p => p.id))

        for (const p of updates.people) {
          if (validPersonIds.has(p.id)) {
            await db.insert(mediaPerson).values({
              mediaId,
              personId: p.id,
              confidence: 'confirmed',
              notes: 'Updated via admin interface',
            })
          }
        }
      }
    }

    // Update place link
    if (updates.place !== undefined) {
      // Delete existing links
      await db.delete(mediaPlace).where(eq(mediaPlace.mediaId, mediaId))

      // Insert new link if provided
      if (updates.place) {
        // Verify place ID exists
        const [validPlace] = await db
          .select({ id: place.id })
          .from(place)
          .where(eq(place.id, updates.place.id))
          .limit(1)

        if (validPlace) {
          await db.insert(mediaPlace).values({
            mediaId,
            placeId: updates.place.id,
            confidence: 'confirmed',
          })
        }
      }
    }

    // Fetch updated links to return
    const [updatedPeople, updatedPlaces] = await Promise.all([
      db
        .select({
          id: person.id,
          slug: person.slug,
          name: person.displayName,
        })
        .from(mediaPerson)
        .innerJoin(person, eq(mediaPerson.personId, person.id))
        .where(eq(mediaPerson.mediaId, mediaId)),

      db
        .select({
          id: place.id,
          slug: place.slug,
          name: place.name,
        })
        .from(mediaPlace)
        .innerJoin(place, eq(mediaPlace.placeId, place.id))
        .where(eq(mediaPlace.mediaId, mediaId))
        .limit(1),
    ])

    return res.status(200).json({
      data: {
        people: updatedPeople,
        place: updatedPlaces[0] || null,
      }
    })
  } catch (error) {
    console.error('Error updating media links:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
