/**
 * One-time script to match news items to relevant entities (people, places, topics)
 * This creates links in the junction tables: newsPerson, newsPlace, newsTopic
 */
import { db } from '../index'
import { newsItem, newsPerson, newsPlace, newsTopic, person, place, topic } from '../schema'
import { eq } from 'drizzle-orm'

interface EntityMatch {
  entityId: string
  entityName: string
  matchedText: string
}

/**
 * Generate name variations for better matching
 * E.g., "George Nelson Culver" -> ["George Nelson Culver", "G. N. Culver", "G.N. Culver", "George Culver", "Geo. Culver"]
 * Be careful NOT to generate overly generic patterns like "Mr. Culver" that match many people
 */
function generateNameVariations(displayName: string): string[] {
  const variations: string[] = []

  // Clean up display name (remove parenthetical maiden/married names)
  const cleanName = displayName.replace(/\s*\([^)]+\)\s*/g, ' ').replace(/\s+/g, ' ').trim()
  variations.push(cleanName)

  // Also add the original if different
  if (displayName !== cleanName) {
    variations.push(displayName)
  }

  // Split into parts
  const parts = cleanName.split(/\s+/)

  if (parts.length >= 2) {
    const lastName = parts[parts.length - 1]
    const firstName = parts[0]

    // First + Last (e.g., "George Culver" from "George Nelson Culver")
    if (parts.length > 2) {
      variations.push(`${firstName} ${lastName}`)
    }

    // Handle initials - "G. N. Culver" or "G.N. Culver"
    // Only generate multi-initial patterns (2+ initials) to avoid ambiguity
    // e.g., "H. Culver" could match many people, but "G. N. Culver" is specific
    if (parts.length >= 3) {
      const initials = parts.slice(0, -1).map(p => p[0].toUpperCase() + '.').join(' ')
      variations.push(`${initials} ${lastName}`)
      variations.push(`${initials.replace(/ /g, '')} ${lastName}`)
    }
    // Note: We intentionally DON'T generate single-initial patterns like "G. Culver"
    // because they're too ambiguous (could match multiple family members)

    // Common abbreviations
    if (firstName.toLowerCase() === 'george') {
      variations.push(`Geo. ${lastName}`)
      if (parts.length > 2) {
        variations.push(`Geo. ${parts.slice(1).join(' ')}`)
      }
    }
    if (firstName.toLowerCase() === 'william') {
      variations.push(`Wm. ${lastName}`)
    }
    if (firstName.toLowerCase() === 'james') {
      variations.push(`Jas. ${lastName}`)
    }

    // Handle quoted nicknames like "O.H." in 'Otis Henry "O.H." Culver'
    const nicknameMatch = displayName.match(/"([^"]+)"/)
    if (nicknameMatch) {
      variations.push(`${nicknameMatch[1]} ${lastName}`)
      variations.push(`${nicknameMatch[1]}. ${lastName}`)
    }

    // Add Miss/Mr/Mrs + First + Last (but NOT just Miss/Mr/Mrs + Last - too generic)
    // e.g., "Miss Louise Culver", "Mr. Fred Culver"
    variations.push(`Miss ${firstName} ${lastName}`)
    variations.push(`Mr. ${firstName} ${lastName}`)
    variations.push(`Mrs. ${firstName} ${lastName}`)

    // For three-part names, also try Miss/Mr/Mrs + Middle + Last
    if (parts.length >= 3) {
      const middleName = parts[1]
      variations.push(`Miss ${middleName} ${lastName}`)
      variations.push(`Mr. ${middleName} ${lastName}`)
    }
  }

  return [...new Set(variations)] // Remove duplicates
}

/**
 * Check if content contains a name match (case-insensitive, word boundary aware)
 */
function findNameInContent(content: string, name: string): boolean {
  // Create a regex that matches the name with word boundaries
  // Escape special regex characters in the name
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`\\b${escaped}\\b`, 'i')
  return regex.test(content)
}

/**
 * Find all matching people in a news item's content
 */
function findPeopleMatches(
  content: string,
  people: { id: string; displayName: string }[]
): EntityMatch[] {
  const matches: EntityMatch[] = []
  const matchedIds = new Set<string>()

  for (const p of people) {
    if (matchedIds.has(p.id)) continue

    const variations = generateNameVariations(p.displayName)

    for (const variation of variations) {
      if (findNameInContent(content, variation)) {
        matches.push({
          entityId: p.id,
          entityName: p.displayName,
          matchedText: variation
        })
        matchedIds.add(p.id)
        break // Found a match, no need to check other variations
      }
    }
  }

  return matches
}

/**
 * Find all matching places in a news item's content
 */
function findPlaceMatches(content: string, places: { id: string; name: string }[]): EntityMatch[] {
  const matches: EntityMatch[] = []

  for (const p of places) {
    // For places, also generate variations
    const variations = [p.name]

    // Handle "Pt." vs "Point" variations
    if (p.name.includes('Point')) {
      variations.push(p.name.replace('Point', 'Pt.'))
    }
    if (p.name.includes('Pt.')) {
      variations.push(p.name.replace('Pt.', 'Point'))
    }

    for (const variation of variations) {
      if (findNameInContent(content, variation)) {
        matches.push({
          entityId: p.id,
          entityName: p.name,
          matchedText: variation
        })
        break
      }
    }
  }

  return matches
}

/**
 * Find all matching topics in a news item's content
 */
function findTopicMatches(content: string, topics: { id: string; name: string }[]): EntityMatch[] {
  const matches: EntityMatch[] = []

  for (const t of topics) {
    // For topics, match the name directly
    // Also handle "The" prefix variations
    const variations = [t.name]

    if (t.name.startsWith('The ')) {
      variations.push(t.name.substring(4)) // Without "The "
    } else {
      variations.push(`The ${t.name}`) // With "The "
    }

    for (const variation of variations) {
      if (findNameInContent(content, variation)) {
        matches.push({
          entityId: t.id,
          entityName: t.name,
          matchedText: variation
        })
        break
      }
    }
  }

  return matches
}

export async function seedNewsLinks(): Promise<void> {
  console.log('Matching news items to entities...\n')

  // Clear existing links first
  console.log('Clearing existing news-entity links...')
  await db.delete(newsPerson)
  await db.delete(newsPlace)
  await db.delete(newsTopic)
  console.log('Done.\n')

  // Load all entities
  const [allNews, allPeople, allPlaces, allTopics] = await Promise.all([
    db.select({ id: newsItem.id, itemId: newsItem.itemId, content: newsItem.content, year: newsItem.year }).from(newsItem),
    db.select({ id: person.id, displayName: person.displayName }).from(person),
    db.select({ id: place.id, name: place.name }).from(place),
    db.select({ id: topic.id, name: topic.name }).from(topic),
  ])

  console.log(`Loaded: ${allNews.length} news items, ${allPeople.length} people, ${allPlaces.length} places, ${allTopics.length} topics\n`)

  // Track statistics
  let totalPersonLinks = 0
  let totalPlaceLinks = 0
  let totalTopicLinks = 0
  const personLinkCounts: Record<string, number> = {}
  const placeLinkCounts: Record<string, number> = {}
  const topicLinkCounts: Record<string, number> = {}

  // Process each news item
  for (const news of allNews) {
    const content = news.content

    // Find matches
    const peopleMatches = findPeopleMatches(content, allPeople)
    const placeMatches = findPlaceMatches(content, allPlaces)
    const topicMatches = findTopicMatches(content, allTopics)

    // Insert person links
    for (const match of peopleMatches) {
      await db.insert(newsPerson).values({
        newsItemId: news.id,
        personId: match.entityId
      }).onConflictDoNothing()

      totalPersonLinks++
      personLinkCounts[match.entityName] = (personLinkCounts[match.entityName] || 0) + 1
    }

    // Insert place links
    for (const match of placeMatches) {
      await db.insert(newsPlace).values({
        newsItemId: news.id,
        placeId: match.entityId
      }).onConflictDoNothing()

      totalPlaceLinks++
      placeLinkCounts[match.entityName] = (placeLinkCounts[match.entityName] || 0) + 1
    }

    // Insert topic links
    for (const match of topicMatches) {
      await db.insert(newsTopic).values({
        newsItemId: news.id,
        topicId: match.entityId
      }).onConflictDoNothing()

      totalTopicLinks++
      topicLinkCounts[match.entityName] = (topicLinkCounts[match.entityName] || 0) + 1
    }

    // Log progress for items with matches
    const totalMatches = peopleMatches.length + placeMatches.length + topicMatches.length
    if (totalMatches > 0) {
      console.log(`[${news.year}] "${news.content.substring(0, 60)}..."`)
      if (peopleMatches.length > 0) {
        console.log(`  People: ${peopleMatches.map(m => m.entityName).join(', ')}`)
      }
      if (placeMatches.length > 0) {
        console.log(`  Places: ${placeMatches.map(m => m.entityName).join(', ')}`)
      }
      if (topicMatches.length > 0) {
        console.log(`  Topics: ${topicMatches.map(m => m.entityName).join(', ')}`)
      }
      console.log()
    }
  }

  // Summary
  console.log('\n=== SUMMARY ===\n')
  console.log(`Total links created:`)
  console.log(`  People: ${totalPersonLinks}`)
  console.log(`  Places: ${totalPlaceLinks}`)
  console.log(`  Topics: ${totalTopicLinks}`)

  console.log('\nPeople mentioned in news:')
  const sortedPeople = Object.entries(personLinkCounts).sort((a, b) => b[1] - a[1])
  for (const [name, count] of sortedPeople) {
    console.log(`  ${name}: ${count} items`)
  }

  console.log('\nPlaces mentioned in news:')
  const sortedPlaces = Object.entries(placeLinkCounts).sort((a, b) => b[1] - a[1])
  for (const [name, count] of sortedPlaces) {
    console.log(`  ${name}: ${count} items`)
  }

  console.log('\nTopics mentioned in news:')
  const sortedTopics = Object.entries(topicLinkCounts).sort((a, b) => b[1] - a[1])
  for (const [name, count] of sortedTopics) {
    console.log(`  ${name}: ${count} items`)
  }
}

// Allow running directly
if (process.argv[1]?.includes('seed-news-links')) {
  seedNewsLinks()
    .then(() => {
      console.log('\nDone!')
      process.exit(0)
    })
    .catch(err => {
      console.error('Error:', err)
      process.exit(1)
    })
}
