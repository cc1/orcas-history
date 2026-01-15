/**
 * API route: PATCH /api/people/:slug/update
 * Updates person fields (dates, biography, connection, etc.)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { person } from '../../lib/db.js'
import { createPatchHandler } from '../../lib/patch-handler.js'

const handlePatch = createPatchHandler({
  table: person,
  slugColumn: person.slug,
  fieldMap: {
    keyDatesText: 'key_dates_text',
    connectionToPtLawrence: 'connection_to_pt_lawrence',
    biography: 'biography',
    miscellaneous: 'miscellaneous',
    familyData: 'family_data',
    timeline: 'timeline',
    relatedPages: 'related_pages',
  },
  jsonFields: ['familyData', 'timeline', 'relatedPages'],
  entityName: 'person',
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  return handlePatch(req, res)
}
