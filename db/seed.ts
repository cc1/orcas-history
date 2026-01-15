/**
 * Main seed script - orchestrates all seeding operations
 *
 * Usage:
 *   npm run db:seed          # Run all seeders
 *   npm run db:seed -- media # Run specific seeder
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { db, siteConfig } from './index'
import { seedMedia } from './seed/seed-media'
import { seedPeople, linkPeopleRelationships } from './seed/seed-people'
import { seedPlaces } from './seed/seed-places'
import { seedTopics } from './seed/seed-topics'
import { seedNews } from './seed/seed-news'
import { seedMediaLinks } from './seed/seed-links'

type SeederName = 'media' | 'people' | 'places' | 'topics' | 'news' | 'config' | 'links' | 'all'

/**
 * Seed site configuration defaults
 */
async function seedSiteConfig(): Promise<void> {
  console.log('Seeding site configuration...')

  const defaults = [
    { key: 'site_name', value: 'The Pt. Lawrence Project' },
    { key: 'site_tagline', value: 'Orcas Island History & Family Archive' },
    { key: 'site_description', value: 'A knowledge graph family history site featuring photos and stories from Point Lawrence, Orcas Island.' },
  ]

  for (const config of defaults) {
    await db.insert(siteConfig).values(config).onConflictDoNothing()
  }

  console.log(`  Seeded ${defaults.length} config entries`)
}

const seeders: Record<Exclude<SeederName, 'all'>, () => Promise<void>> = {
  config: seedSiteConfig,
  media: seedMedia,
  people: seedPeople,
  places: seedPlaces,
  topics: seedTopics,
  news: seedNews,
  links: seedMediaLinks
}

async function main(): Promise<void> {
  console.log('=== Orcas History Database Seeder ===\n')

  // Get target from command line args
  const target = (process.argv[2] || 'all') as SeederName

  const startTime = Date.now()

  try {
    if (target === 'all') {
      // Run all seeders in order
      console.log('Running all seeders...\n')

      await seedSiteConfig()
      console.log('')

      await seedMedia()
      console.log('')

      await seedPeople()
      console.log('')

      await seedPlaces()
      console.log('')

      await seedTopics()
      console.log('')

      await seedNews()
      console.log('')

      // Link relationships after all entities are created
      await linkPeopleRelationships()
      console.log('')

      // Create media-entity links after all entities are seeded
      await seedMediaLinks()
      console.log('')

    } else if (seeders[target]) {
      await seeders[target]()

      // If seeding people, also run relationship linking
      if (target === 'people') {
        await linkPeopleRelationships()
      }
    } else {
      console.error(`Unknown seeder: ${target}`)
      console.error(`Available: ${Object.keys(seeders).join(', ')}, all`)
      process.exit(1)
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`\n=== Seeding complete in ${elapsed}s ===`)

  } catch (error) {
    console.error('\nSeeding failed:', error)
    process.exit(1)
  }
}

main()
