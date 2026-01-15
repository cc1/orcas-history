/**
 * Shared utility for creating PATCH handlers for entity updates
 * Eliminates duplication across places, topics, and people endpoints
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from './db.js'
import { eq } from 'drizzle-orm'
import type { PgTable, PgColumn } from 'drizzle-orm/pg-core'

interface PatchHandlerConfig<T extends PgTable> {
  table: T
  slugColumn: PgColumn
  fieldMap: Record<string, string>
  jsonFields: string[]
  entityName: string
}

export function createPatchHandler<T extends PgTable>(config: PatchHandlerConfig<T>) {
  const { table, slugColumn, fieldMap, jsonFields, entityName } = config

  return async function handlePatch(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
    const { slug } = req.query

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Invalid slug' })
    }

    const { field, value } = req.body

    if (!field || typeof field !== 'string') {
      return res.status(400).json({ error: 'Field is required' })
    }

    const dbField = fieldMap[field]
    if (!dbField) {
      return res.status(400).json({ error: `Invalid field: ${field}` })
    }

    try {
      // For JSON fields, parse if string
      let finalValue = value
      if (jsonFields.includes(field) && typeof value === 'string') {
        try {
          finalValue = JSON.parse(value)
        } catch {
          finalValue = value
        }
      }

      await db
        .update(table)
        .set({ [field]: finalValue || null })
        .where(eq(slugColumn, slug))

      return res.status(200).json({ success: true, field, value: finalValue })
    } catch (error) {
      console.error(`Error updating ${entityName}:`, error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}
