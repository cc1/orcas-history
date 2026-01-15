/**
 * API route: GET/PATCH /api/topics/:slug
 * GET: Returns a single topic by slug with linked photos
 * PATCH: Updates topic fields
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, topic, media, mediaTopic } from '../lib/db.js'
import { eq, and, asc } from 'drizzle-orm'
import { createPatchHandler } from '../lib/patch-handler.js'

const handlePatch = createPatchHandler({
  table: topic,
  slugColumn: topic.slug,
  fieldMap: {
    name: 'name',
    description: 'description',
    contentSections: 'content_sections',
    researchQuestions: 'research_questions',
    relatedPages: 'related_pages',
  },
  jsonFields: ['contentSections', 'researchQuestions', 'relatedPages'],
  entityName: 'topic',
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
    return res.status(400).json({ error: 'Invalid topic slug' })
  }

  try {
    // Get topic data
    const topicResults = await db
      .select({
        id: topic.id,
        slug: topic.slug,
        name: topic.name,
        description: topic.description,
        contentSections: topic.contentSections,
        researchQuestions: topic.researchQuestions,
        relatedPages: topic.relatedPages,
        imageUrl: topic.imageUrl,
        sourcePageUrl: topic.sourcePageUrl,
      })
      .from(topic)
      .where(eq(topic.slug, slug))
      .limit(1)

    if (topicResults.length === 0) {
      return res.status(404).json({ error: 'Topic not found' })
    }

    const topicData = topicResults[0]

    // Get linked photos
    const linkedPhotos = await db
      .select({
        id: media.id,
        number: media.number,
        imageUrl: media.webImagePath,
        googleUrl: media.googleUrl,
        description: media.description,
      })
      .from(mediaTopic)
      .innerJoin(media, eq(mediaTopic.mediaId, media.id))
      .where(
        and(
          eq(mediaTopic.topicId, topicData.id),
          eq(media.notRelevant, false)
        )
      )
      .orderBy(asc(media.number))

    const photos = linkedPhotos.map(p => ({
      id: p.id,
      number: p.number,
      imageUrl: p.imageUrl || p.googleUrl,
      description: p.description,
    }))

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.status(200).json({
      data: {
        ...topicData,
        linkedPhotos: photos,
      }
    })
  } catch (error) {
    console.error('Error fetching topic:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
