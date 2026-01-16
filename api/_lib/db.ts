/**
 * Database client for Vercel serverless functions
 */
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../../db/schema.js'

// Get database URL - Vercel dev loads .env.local automatically
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment')
  throw new Error('DATABASE_URL environment variable is required')
}

// Create Neon SQL client
const sql = neon(DATABASE_URL)

// Create Drizzle instance with schema
export const db = drizzle(sql, { schema })

// Re-export schema for convenience
export * from '../../db/schema.js'
