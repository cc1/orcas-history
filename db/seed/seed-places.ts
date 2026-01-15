/**
 * Seed places (geographic topics) from extracted JSON files
 */
import fs from 'fs'
import path from 'path'
import { db } from '../index'
import { place } from '../schema'
import { PLACE_SLUGS, PLACE_COORDINATES } from './utils'

interface TopicSection {
  heading: string
  content: string
}

interface ExtractedTopic {
  slug: string
  name: string
  sourceUrl?: string
  sections?: TopicSection[]
  relatedPhotos?: string[]
  researchQuestions?: string[]
  notes?: string
  extractedAt?: string
}

export async function seedPlaces(): Promise<void> {
  console.log('Seeding places...')

  const topicsDir = path.join(process.cwd(), 'extraction/data/parsed/topics')

  if (!fs.existsSync(topicsDir)) {
    console.log('No topics directory found, skipping places...')
    return
  }

  let totalPlaces = 0

  // Only process files that are places (geographic locations)
  for (const slug of PLACE_SLUGS) {
    const filePath = path.join(topicsDir, `${slug}.json`)

    if (!fs.existsSync(filePath)) {
      console.log(`  Place file not found: ${slug}.json`)
      continue
    }

    const data: ExtractedTopic = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    // Get coordinates if available
    const coords = PLACE_COORDINATES[slug] || null

    // Get first image from related photos for representative image
    let imageUrl: string | null = null
    if (data.relatedPhotos && data.relatedPhotos.length > 0) {
      imageUrl = `/extraction/data/images/${data.relatedPhotos[0]}.jpg`
    }

    // Build description from first section or notes
    let description: string | null = null
    if (data.sections && data.sections.length > 0) {
      description = data.sections[0].content
    } else if (data.notes) {
      description = data.notes
    }

    await db.insert(place).values({
      slug: data.slug,
      name: data.name,
      description,
      latitude: coords ? String(coords.lat) : null,
      longitude: coords ? String(coords.lng) : null,
      contentSections: data.sections || null,
      researchQuestions: data.researchQuestions || null,
      imageUrl,
      sourcePageUrl: data.sourceUrl || null
    }).onConflictDoNothing()

    totalPlaces++
    console.log(`  Seeded place: ${data.name}`)
  }

  console.log(`Seeded ${totalPlaces} places`)
}
