/**
 * API route: GET /api/news
 * Returns all news items, grouped by decade/year
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, newsItem } from './lib/db.js'
import { asc, desc, eq } from 'drizzle-orm'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { sort = 'asc', decade } = req.query

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
