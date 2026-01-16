/**
 * API route: GET /api/news
 * Returns news items, optionally filtered by decade or linked entity
 *
 * Query params:
 *   - decade: Filter by decade (e.g., '1890s')
 *   - sort: 'asc' | 'desc' (default: 'asc')
 *   - entityType: 'person' | 'place' | 'topic' (for entity filtering)
 *   - entitySlug: The entity's slug (required with entityType)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, newsItem, newsPerson, newsPlace, newsTopic, person, place, topic } from './_lib/db.js'
import { asc, desc, eq } from 'drizzle-orm'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { sort = 'asc', decade, entityType, entitySlug } = req.query

    // If filtering by entity, use the entity news logic
    if (entityType && entitySlug && typeof entityType === 'string' && typeof entitySlug === 'string') {
      return handleEntityNews(req, res, entityType, entitySlug)
    }

    let query = db
      .select({
        id: newsItem.id,
        itemId: newsItem.itemId,
        decade: newsItem.decade,
        year: newsItem.year,
        month: newsItem.month,
        monthSort: newsItem.monthSort,
        content: newsItem.content,
        sourceUrl: newsItem.sourceUrl,
      })
      .from(newsItem)

    // Filter by decade if provided
    if (decade && typeof decade === 'string') {
      query = query.where(eq(newsItem.decade, decade)) as typeof query
    }

    // Order by year and month
    const orderFn = sort === 'desc' ? desc : asc
    const results = await query.orderBy(orderFn(newsItem.year), orderFn(newsItem.monthSort))

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.status(200).json({ data: results })
  } catch (error) {
    console.error('Error fetching news:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Entity-linked news handler
async function handleEntityNews(
  req: VercelRequest,
  res: VercelResponse,
  entityType: string,
  slug: string
) {
  if (!['person', 'place', 'topic'].includes(entityType)) {
    return res.status(400).json({ error: 'Invalid entityType. Must be person, place, or topic' })
  }

  let entityId: string | null = null

  // Look up the entity to get its ID
  if (entityType === 'person') {
    const result = await db.select({ id: person.id }).from(person).where(eq(person.slug, slug)).limit(1)
    entityId = result[0]?.id || null
  } else if (entityType === 'place') {
    const result = await db.select({ id: place.id }).from(place).where(eq(place.slug, slug)).limit(1)
    entityId = result[0]?.id || null
  } else if (entityType === 'topic') {
    const result = await db.select({ id: topic.id }).from(topic).where(eq(topic.slug, slug)).limit(1)
    entityId = result[0]?.id || null
  }

  if (!entityId) {
    return res.status(404).json({ error: 'Entity not found' })
  }

  // Query for linked news items
  let newsItems: Array<{
    id: string
    itemId: string
    year: number
    month: string | null
    monthSort: number | null
    content: string
  }> = []

  if (entityType === 'person') {
    newsItems = await db
      .select({
        id: newsItem.id,
        itemId: newsItem.itemId,
        year: newsItem.year,
        month: newsItem.month,
        monthSort: newsItem.monthSort,
        content: newsItem.content,
      })
      .from(newsItem)
      .innerJoin(newsPerson, eq(newsItem.id, newsPerson.newsItemId))
      .where(eq(newsPerson.personId, entityId))
      .orderBy(asc(newsItem.year), asc(newsItem.monthSort))
  } else if (entityType === 'place') {
    newsItems = await db
      .select({
        id: newsItem.id,
        itemId: newsItem.itemId,
        year: newsItem.year,
        month: newsItem.month,
        monthSort: newsItem.monthSort,
        content: newsItem.content,
      })
      .from(newsItem)
      .innerJoin(newsPlace, eq(newsItem.id, newsPlace.newsItemId))
      .where(eq(newsPlace.placeId, entityId))
      .orderBy(asc(newsItem.year), asc(newsItem.monthSort))
  } else if (entityType === 'topic') {
    newsItems = await db
      .select({
        id: newsItem.id,
        itemId: newsItem.itemId,
        year: newsItem.year,
        month: newsItem.month,
        monthSort: newsItem.monthSort,
        content: newsItem.content,
      })
      .from(newsItem)
      .innerJoin(newsTopic, eq(newsItem.id, newsTopic.newsItemId))
      .where(eq(newsTopic.topicId, entityId))
      .orderBy(asc(newsItem.year), asc(newsItem.monthSort))
  }

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
  return res.status(200).json({ data: newsItems })
}
