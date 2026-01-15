/**
 * API route: GET /api/backlinks
 * Returns linked mentions - pages that explicitly link to this entity
 *
 * For Person pages:
 * - Other people who list this person in their familyData (parents, spouses, children, siblings)
 * - Other entities that have this person in their relatedPages
 *
 * For Place/Topic pages:
 * - Other entities that have this place/topic in their relatedPages
 *
 * Query parameters:
 * - type: 'person' | 'place' | 'topic' (required)
 * - id: entity slug (required)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, person, place, topic } from './lib/db.js'
import { eq } from 'drizzle-orm'

interface FamilyData {
  parents?: string[]
  spouses?: string[]
  children?: string[]
  siblings?: string[]
}

interface RelatedPage {
  type: 'person' | 'place' | 'topic'
  slug: string
  name: string
}

interface LinkedMentionsResponse {
  people: Array<{ slug: string; name: string }>
  places: Array<{ slug: string; name: string }>
  topics: Array<{ slug: string; name: string }>
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { type, id } = req.query

  if (!type || typeof type !== 'string') {
    return res.status(400).json({ error: 'Missing required parameter: type' })
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing required parameter: id' })
  }

  if (!['person', 'place', 'topic'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type. Must be person, place, or topic' })
  }

  try {
    // Load all entities
    const [allPeople, allPlaces, allTopics] = await Promise.all([
      db.select().from(person),
      db.select().from(place),
      db.select().from(topic),
    ])

    // Find the current entity's display name
    let currentEntityName = ''
    if (type === 'person') {
      const found = allPeople.find(p => p.slug === id)
      if (!found) return res.status(404).json({ error: 'Person not found' })
      currentEntityName = found.displayName
    } else if (type === 'place') {
      const found = allPlaces.find(p => p.slug === id)
      if (!found) return res.status(404).json({ error: 'Place not found' })
      currentEntityName = found.name
    } else {
      const found = allTopics.find(t => t.slug === id)
      if (!found) return res.status(404).json({ error: 'Topic not found' })
      currentEntityName = found.name
    }

    const linkedMentions: LinkedMentionsResponse = {
      people: [],
      places: [],
      topics: [],
    }

    // Check people for links to this entity
    for (const p of allPeople) {
      // Skip self
      if (type === 'person' && p.slug === id) continue

      let isLinked = false

      // Check if this person's familyData mentions our entity (only for person pages)
      if (type === 'person') {
        const family = (p.familyData as FamilyData) || {}
        const allFamilyMembers = [
          ...(family.parents || []),
          ...(family.spouses || []),
          ...(family.children || []),
          ...(family.siblings || []),
        ]
        if (allFamilyMembers.includes(currentEntityName)) {
          isLinked = true
        }
      }

      // Check if this person's relatedPages includes our entity
      const relatedPages = (p.relatedPages as RelatedPage[]) || []
      if (relatedPages.some(rp => rp.type === type && rp.slug === id)) {
        isLinked = true
      }

      if (isLinked) {
        linkedMentions.people.push({ slug: p.slug, name: p.displayName })
      }
    }

    // Check places for links to this entity
    for (const p of allPlaces) {
      // Skip self
      if (type === 'place' && p.slug === id) continue

      const relatedPages = (p.relatedPages as RelatedPage[]) || []
      if (relatedPages.some(rp => rp.type === type && rp.slug === id)) {
        linkedMentions.places.push({ slug: p.slug, name: p.name })
      }
    }

    // Check topics for links to this entity
    for (const t of allTopics) {
      // Skip self
      if (type === 'topic' && t.slug === id) continue

      const relatedPages = (t.relatedPages as RelatedPage[]) || []
      if (relatedPages.some(rp => rp.type === type && rp.slug === id)) {
        linkedMentions.topics.push({ slug: t.slug, name: t.name })
      }
    }

    // Sort alphabetically
    linkedMentions.people.sort((a, b) => a.name.localeCompare(b.name))
    linkedMentions.places.sort((a, b) => a.name.localeCompare(b.name))
    linkedMentions.topics.sort((a, b) => a.name.localeCompare(b.name))

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
    return res.status(200).json({ data: linkedMentions })
  } catch (error) {
    console.error('Error fetching linked mentions:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
