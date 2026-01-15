/**
 * Timeline parsing utilities
 *
 * Converts between markdown format and timeline array format.
 */

export interface TimelineEntry {
  year: number
  age?: number
  event: string
}

/**
 * Convert a timeline array to markdown format for editing.
 *
 * @param timeline - Array of timeline entries
 * @returns Markdown string with each entry on its own line
 *
 * @example
 * // Returns "**1940** (Age 36): Started working at the mill"
 * timelineToMarkdown([{ year: 1940, age: 36, event: "Started working at the mill" }])
 */
export function timelineToMarkdown(timeline: TimelineEntry[]): string {
  return timeline.map(item => {
    const ageText = item.age !== undefined ? ` (Age ${item.age})` : ''
    return `**${item.year}**${ageText}: ${item.event}`
  }).join('\n\n')
}

/**
 * Parse markdown back to timeline array.
 *
 * Supports multiple formats:
 * - **1940** (Age 36): Event description
 * - **1940**: Event description
 * - 1940: Event description
 *
 * @param markdown - Markdown string with timeline entries
 * @returns Array of parsed timeline entries
 */
export function markdownToTimeline(markdown: string): TimelineEntry[] {
  const lines = markdown.split('\n').filter(l => l.trim())

  return lines
    .map(line => {
      // Try full format: **1940** (Age 36): Event
      const fullMatch = line.match(/\*\*(\d+)\*\*(?:\s*\(Age\s*(\d+)\))?:\s*(.+)/)
      if (fullMatch) {
        return {
          year: parseInt(fullMatch[1]),
          age: fullMatch[2] ? parseInt(fullMatch[2]) : undefined,
          event: fullMatch[3].trim()
        }
      }

      // Try simple format: 1940: Event
      const simpleMatch = line.match(/^(\d{4}):?\s*(.+)/)
      if (simpleMatch) {
        return {
          year: parseInt(simpleMatch[1]),
          event: simpleMatch[2].trim()
        }
      }

      return null
    })
    .filter((entry): entry is TimelineEntry => entry !== null)
}
