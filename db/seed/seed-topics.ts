/**
 * Seed topics (non-geographic subjects) from extracted JSON files
 */
import fs from 'fs'
import path from 'path'
import { db } from '../index'
import { topic } from '../schema'
import { PLACE_SLUGS } from './utils'

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

export async function seedTopics(): Promise<void> {
  console.log('Seeding topics...')

  const topicsDir = path.join(process.cwd(), 'extraction/data/parsed/topics')

  if (!fs.existsSync(topicsDir)) {
    console.log('No topics directory found, skipping...')
    return
  }

  const files = fs.readdirSync(topicsDir)
    .filter(f => f.endsWith('.json'))
    .sort()

  let totalTopics = 0

  for (const file of files) {
    const slug = file.replace('.json', '')

    // Skip if this is a place (geographic location)
    if (PLACE_SLUGS.includes(slug)) {
      continue
    }

    const filePath = path.join(topicsDir, file)
    const data: ExtractedTopic = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

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

    await db.insert(topic).values({
      slug: data.slug,
      name: data.name,
      description,
      contentSections: data.sections || null,
      researchQuestions: data.researchQuestions || null,
      imageUrl,
      sourcePageUrl: data.sourceUrl || null
    }).onConflictDoNothing()

    totalTopics++
    console.log(`  Seeded topic: ${data.name}`)
  }

  console.log(`Seeded ${totalTopics} topics`)
}
