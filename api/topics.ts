/**
 * API route: GET /api/topics
 * Returns all topics
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, topic } from './_lib/db.js'
import { asc } from 'drizzle-orm'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const results = await db
      .select({
        id: topic.id,
        slug: topic.slug,
        name: topic.name,
        description: topic.description,
        imageUrl: topic.imageUrl,
      })
      .from(topic)
      .orderBy(asc(topic.name))

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.status(200).json({ data: results })
  } catch (error) {
    console.error('Error fetching topics:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
