/**
 * API route: GET/PATCH /api/people/:slug
 * GET: Returns a single person by slug with linked photos
 * PATCH: Updates person fields
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, person, media, mediaPerson } from '../_lib/db.js'
import { eq, and, asc } from 'drizzle-orm'
import { getImageUrl } from '../_lib/image-utils.js'
import { createPatchHandler } from '../_lib/patch-handler.js'

const handlePatch = createPatchHandler({
  table: person,
  slugColumn: person.slug,
  fieldMap: {
    keyDatesText: 'key_dates_text',
    connectionToPtLawrence: 'connection_to_pt_lawrence',
    biography: 'biography',
    miscellaneous: 'miscellaneous',
    familyData: 'family_data',
    timeline: 'timeline',
    relatedPages: 'related_pages',
  },
  jsonFields: ['familyData', 'timeline', 'relatedPages'],
  entityName: 'person',
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'PATCH') {
    return handlePatch(req, res)
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { slug } = req.query

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Invalid person slug' })
  }

  try {
    // Get person data
    const personResults = await db
      .select({
        id: person.id,
        slug: person.slug,
        displayName: person.displayName,
        biography: person.biography,
        connectionToPtLawrence: person.connectionToPtLawrence,
        miscellaneous: person.miscellaneous,
        keyDatesText: person.keyDatesText,
        birthYear: person.birthYear,
        deathYear: person.deathYear,
        familyData: person.familyData,
        timeline: person.timeline,
        imageUrl: person.imageUrl,
        sourcePageUrl: person.sourcePageUrl,
      })
      .from(person)
      .where(eq(person.slug, slug))
      .limit(1)

    if (personResults.length === 0) {
      return res.status(404).json({ error: 'Person not found' })
    }

    const personData = personResults[0]

    // Get linked photos
    const linkedPhotos = await db
      .select({
        id: media.id,
        number: media.number,
        imageUrl: media.webImagePath,
        googleUrl: media.googleUrl,
        description: media.description,
      })
      .from(mediaPerson)
      .innerJoin(media, eq(mediaPerson.mediaId, media.id))
      .where(
        and(
          eq(mediaPerson.personId, personData.id),
          eq(media.notRelevant, false)
        )
      )
      .orderBy(asc(media.number))

    const photos = linkedPhotos.map(p => ({
      id: p.id,
      number: p.number,
      imageUrl: getImageUrl(p.imageUrl, p.googleUrl),
      description: p.description,
    }))

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.status(200).json({
      data: {
        ...personData,
        linkedPhotos: photos,
      }
    })
  } catch (error) {
    console.error('Error fetching person:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
