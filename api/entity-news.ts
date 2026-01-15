/**
 * API route: GET /api/entity-news
 * Returns news items linked to a specific entity (person, place, or topic)
 *
 * Query params:
 *   - type: 'person' | 'place' | 'topic'
 *   - slug: The entity's slug
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, newsItem, newsPerson, newsPlace, newsTopic, person, place, topic } from './lib/db.js'
import { eq, asc } from 'drizzle-orm'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { type, slug } = req.query

    if (!type || !slug || typeof type !== 'string' || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Missing type or slug parameter' })
    }

    if (!['person', 'place', 'topic'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be person, place, or topic' })
    }

    let entityId: string | null = null

    // Look up the entity to get its ID
    if (type === 'person') {
      const result = await db.select({ id: person.id }).from(person).where(eq(person.slug, slug)).limit(1)
      entityId = result[0]?.id || null
    } else if (type === 'place') {
      const result = await db.select({ id: place.id }).from(place).where(eq(place.slug, slug)).limit(1)
      entityId = result[0]?.id || null
    } else if (type === 'topic') {
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

    if (type === 'person') {
      const results = await db
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

      newsItems = results
    } else if (type === 'place') {
      const results = await db
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

      newsItems = results
    } else if (type === 'topic') {
      const results = await db
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

      newsItems = results
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.status(200).json({ data: newsItems })
  } catch (error) {
    console.error('Error fetching entity news:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
