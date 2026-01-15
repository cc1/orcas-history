/**
 * In the News section - shows news items linked to an entity
 * Displays items grouped by year with the same styling as the News page
 */
import { useMemo } from 'react'
import { useEntityNews } from '@/hooks/useData'
import type { EntityNewsItem } from '@/lib/api'

interface InTheNewsProps {
  entityType: 'person' | 'place' | 'topic'
  slug: string
}

export function InTheNews({ entityType, slug }: InTheNewsProps): React.ReactElement | null {
  const { data: newsItems, loading } = useEntityNews(entityType, slug)

  // Group news by year
  const newsByYear = useMemo(() => {
    if (!newsItems || newsItems.length === 0) return {}

    return newsItems.reduce((acc, item) => {
      if (!acc[item.year]) acc[item.year] = []
      acc[item.year].push(item)
      return acc
    }, {} as Record<number, EntityNewsItem[]>)
  }, [newsItems])

  const years = useMemo(() => {
    return Object.keys(newsByYear).map(Number).sort((a, b) => a - b)
  }, [newsByYear])

  // Don't render anything if loading or no news items
  if (loading) return null
  if (!newsItems || newsItems.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="font-serif text-xl font-semibold mb-4">In the News</h2>
      <div className="space-y-6">
        {years.map(year => (
          <div key={year}>
            <h3 className="font-semibold text-lg text-muted-foreground mb-2">
              {year}
            </h3>
            <div className="space-y-3 pl-4 border-l-2 border-muted">
              {newsByYear[year].map(item => (
                <div key={item.id} className="relative">
                  {item.month && (
                    <span className="text-sm font-medium text-muted-foreground">
                      {item.month}
                    </span>
                  )}
                  <p className="mt-1 text-foreground leading-relaxed">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
