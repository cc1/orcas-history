/**
 * API route: POST /api/media/:number/links
 * Updates media-entity relationships (people, places)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, media, mediaPerson, mediaPlace, person, place } from '../../lib/db.js'
import { eq, and, inArray } from 'drizzle-orm'

interface LinkUpdate {
  people?: Array<{ id: string; slug: string; name: string }>
  place?: { id: string; slug: string; name: string } | null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { number } = req.query

  if (!number || typeof number !== 'string') {
    return res.status(400).json({ error: 'Invalid media number' })
  }

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
