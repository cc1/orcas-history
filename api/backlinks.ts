/**
 * API route: GET /api/backlinks
 * Returns linked mentions OR all entities for autocomplete
 *
 * Query parameters for backlinks:
 * - type: 'person' | 'place' | 'topic' (required)
 * - id: entity slug (required)
 *
 * Query parameters for entities (autocomplete):
 * - action: 'entities' (returns all entities for autocomplete)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db, person, place, topic } from './lib/db.js'
import { eq, asc } from 'drizzle-orm'

// ============================================================================
// Types
// ============================================================================

type EntityType = 'person' | 'place' | 'topic'

interface FamilyData {
  parents?: string[]
  spouses?: string[]
  children?: string[]
  siblings?: string[]
}

interface RelatedPage {
  type: EntityType
  slug: string
  name: string
}

interface EntityRef {
  slug: string
  name: string
}

interface LinkedMentionsResponse {
  people: EntityRef[]
  places: EntityRef[]
  topics: EntityRef[]
}

// ============================================================================
// Entity Queries - Only fetch what we need
// ============================================================================

async function findEntityBySlug(
  type: EntityType,
  slug: string
): Promise<string | null> {
  switch (type) {
    case 'person': {
      const [found] = await db
        .select({ name: person.displayName })
        .from(person)
        .where(eq(person.slug, slug))
        .limit(1)
      return found?.name ?? null
    }
    case 'place': {
      const [found] = await db
        .select({ name: place.name })
        .from(place)
        .where(eq(place.slug, slug))
        .limit(1)
      return found?.name ?? null
    }
    case 'topic': {
      const [found] = await db
        .select({ name: topic.name })
        .from(topic)
        .where(eq(topic.slug, slug))
        .limit(1)
      return found?.name ?? null
    }
  }
}

// Only select columns needed for backlink scanning
async function loadEntityBacklinkData() {
  const [people, places, topics] = await Promise.all([
    db.select({
      slug: person.slug,
      name: person.displayName,
      familyData: person.familyData,
      relatedPages: person.relatedPages,
    }).from(person),
    db.select({
      slug: place.slug,
      name: place.name,
      relatedPages: place.relatedPages,
    }).from(place),
    db.select({
      slug: topic.slug,
      name: topic.name,
      relatedPages: topic.relatedPages,
    }).from(topic),
  ])
  return { people, places, topics }
}

// ============================================================================
// Backlink Scanning
// ============================================================================

function hasRelatedPageLink(
  relatedPages: unknown,
  targetType: EntityType,
  targetSlug: string
): boolean {
  if (!Array.isArray(relatedPages)) return false
  return relatedPages.some(
    (rp: RelatedPage) => rp.type === targetType && rp.slug === targetSlug
  )
}

function hasFamilyLink(familyData: unknown, targetName: string): boolean {
  if (!familyData || typeof familyData !== 'object') return false
  const family = familyData as FamilyData
  const allFamilyMembers = [
    ...(family.parents || []),
    ...(family.spouses || []),
    ...(family.children || []),
    ...(family.siblings || []),
  ]
  return allFamilyMembers.includes(targetName)
}

function collectLinkedMentions(
  data: Awaited<ReturnType<typeof loadEntityBacklinkData>>,
  targetType: EntityType,
  targetSlug: string,
  targetName: string
): LinkedMentionsResponse {
  const result: LinkedMentionsResponse = {
    people: [],
    places: [],
    topics: [],
  }

  // Scan people
  for (const p of data.people) {
    if (targetType === 'person' && p.slug === targetSlug) continue

    const linkedByRelated = hasRelatedPageLink(p.relatedPages, targetType, targetSlug)
    const linkedByFamily = targetType === 'person' && hasFamilyLink(p.familyData, targetName)

    if (linkedByRelated || linkedByFamily) {
      result.people.push({ slug: p.slug, name: p.name })
    }
  }

  // Scan places
  for (const p of data.places) {
    if (targetType === 'place' && p.slug === targetSlug) continue
    if (hasRelatedPageLink(p.relatedPages, targetType, targetSlug)) {
      result.places.push({ slug: p.slug, name: p.name })
    }
  }

  // Scan topics
  for (const t of data.topics) {
    if (targetType === 'topic' && t.slug === targetSlug) continue
    if (hasRelatedPageLink(t.relatedPages, targetType, targetSlug)) {
      result.topics.push({ slug: t.slug, name: t.name })
    }
  }

  // Sort alphabetically
  result.people.sort((a, b) => a.name.localeCompare(b.name))
  result.places.sort((a, b) => a.name.localeCompare(b.name))
  result.topics.sort((a, b) => a.name.localeCompare(b.name))

  return result
}

// ============================================================================
// Request Handler
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { type, id, action } = req.query

  // Handle entities action (for autocomplete)
  if (action === 'entities') {
    return handleEntities(res)
  }

  // Validate parameters for backlinks
  if (!type || typeof type !== 'string') {
    return res.status(400).json({ error: 'Missing required parameter: type' })
  }
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing required parameter: id' })
  }
  if (!['person', 'place', 'topic'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type. Must be person, place, or topic' })
  }

  const entityType = type as EntityType

  try {
    // Find the target entity first (efficient single-row query)
    const entityName = await findEntityBySlug(entityType, id)
    if (!entityName) {
      return res.status(404).json({ error: `${entityType} not found` })
    }

    // Load backlink data (only needed columns)
    const data = await loadEntityBacklinkData()

    // Collect linked mentions
    const linkedMentions = collectLinkedMentions(data, entityType, id, entityName)

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
    return res.status(200).json({ data: linkedMentions })
  } catch (error) {
    console.error('Error fetching linked mentions:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// ============================================================================
// Entities Handler (for autocomplete)
// ============================================================================

interface Entity {
  type: 'person' | 'place' | 'topic'
  slug: string
  name: string
}

async function handleEntities(res: VercelResponse) {
  try {
    const [allPeople, allPlaces, allTopics] = await Promise.all([
      db.select({ slug: person.slug, name: person.displayName }).from(person).orderBy(asc(person.displayName)),
      db.select({ slug: place.slug, name: place.name }).from(place).orderBy(asc(place.name)),
      db.select({ slug: topic.slug, name: topic.name }).from(topic).orderBy(asc(topic.name)),
    ])

    const entities: Entity[] = [
      ...allPeople.map(p => ({ type: 'person' as const, slug: p.slug, name: p.name })),
      ...allPlaces.map(p => ({ type: 'place' as const, slug: p.slug, name: p.name })),
      ...allTopics.map(t => ({ type: 'topic' as const, slug: t.slug, name: t.name })),
    ]

    // Sort all together by name
    entities.sort((a, b) => a.name.localeCompare(b.name))

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.status(200).json({ data: entities })
  } catch (error) {
    console.error('Error fetching entities:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
