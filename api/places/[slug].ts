/**
 * API route: GET/PATCH /api/places/:slug
 * GET: Returns a single place by slug with linked photos
 * PATCH: Updates place fields
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, place, media, mediaPlace } from '../lib/db.js'
import { eq, and, asc } from 'drizzle-orm'
import { createPatchHandler } from '../lib/patch-handler.js'
import { getImageUrl } from '../lib/image-utils.js'

const handlePatch = createPatchHandler({
  table: place,
  slugColumn: place.slug,
  fieldMap: {
    name: 'name',
    description: 'description',
    contentSections: 'content_sections',
    researchQuestions: 'research_questions',
    relatedPages: 'related_pages',
  },
  jsonFields: ['contentSections', 'researchQuestions', 'relatedPages'],
  entityName: 'place',
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
    return res.status(400).json({ error: 'Invalid place slug' })
  }

  try {
    // Get place data
    const placeResults = await db
      .select({
        id: place.id,
        slug: place.slug,
        name: place.name,
        description: place.description,
        latitude: place.latitude,
        longitude: place.longitude,
        contentSections: place.contentSections,
        researchQuestions: place.researchQuestions,
        relatedPages: place.relatedPages,
        imageUrl: place.imageUrl,
        sourcePageUrl: place.sourcePageUrl,
      })
      .from(place)
      .where(eq(place.slug, slug))
      .limit(1)

    if (placeResults.length === 0) {
      return res.status(404).json({ error: 'Place not found' })
    }

    const placeData = placeResults[0]

    // Get linked photos
    const linkedPhotos = await db
      .select({
        id: media.id,
        number: media.number,
        imageUrl: media.webImagePath,
        googleUrl: media.googleUrl,
        description: media.description,
      })
      .from(mediaPlace)
      .innerJoin(media, eq(mediaPlace.mediaId, media.id))
      .where(
        and(
          eq(mediaPlace.placeId, placeData.id),
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
        ...placeData,
        linkedPhotos: photos,
      }
    })
  } catch (error) {
    console.error('Error fetching place:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
