/**
 * Database connection using Neon serverless driver with Drizzle ORM
 */
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Create Neon SQL client
const sql = neon(DATABASE_URL)

// Create Drizzle instance with schema
export const db = drizzle(sql, { schema })

// Re-export schema for convenience
export * from './schema'
