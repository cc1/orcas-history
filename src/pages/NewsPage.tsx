import { useState, useMemo } from 'react'
import { useNews } from '@/hooks/useData'

type SortOrder = 'asc' | 'desc'

export function NewsPage(): React.ReactElement {
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [filterDecade, setFilterDecade] = useState<string>('')

  const { data: news, loading, error } = useNews({
    sort: sortOrder,
    decade: filterDecade || undefined,
  })

  // Group news by year
  const newsByYear = useMemo(() => {
    if (!news) return {}

    return news.reduce((acc, item) => {
      if (!acc[item.year]) acc[item.year] = []
      acc[item.year].push(item)
      return acc
    }, {} as Record<number, typeof news>)
  }, [news])

  const years = useMemo(() => {
    return Object.keys(newsByYear).map(Number).sort((a, b) =>
      sortOrder === 'asc' ? a - b : b - a
    )
  }, [newsByYear, sortOrder])

  // Get available decades
  const decades = ['1890s', '1900s', '1910s', '1920s', '1930s']

  return (
    <div className="container px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="font-serif text-2xl font-bold">News</h1>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sort Toggle */}
          <div className="flex rounded-md border overflow-hidden">
            <button
              onClick={() => setSortOrder('asc')}
              className={`px-3 py-1.5 text-sm ${
                sortOrder === 'asc'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted'
              }`}
            >
              Oldest First
            </button>
            <button
              onClick={() => setSortOrder('desc')}
              className={`px-3 py-1.5 text-sm ${
                sortOrder === 'desc'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted'
              }`}
            >
              Newest First
            </button>
          </div>

          {/* Decade Filter */}
          <select
            value={filterDecade}
            onChange={(e) => setFilterDecade(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-md border bg-background"
          >
            <option value="">All Decades</option>
            {decades.map(decade => (
              <option key={decade} value={decade}>{decade}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading news...</div>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-destructive">Error loading news: {error.message}</div>
        </div>
      )}

      {/* Timeline */}
      {!loading && !error && news && news.length > 0 && (
        <div className="space-y-8">
          {years.map(year => (
            <div key={year}>
              <h2 className="font-serif text-xl font-semibold mb-4 sticky top-0 bg-background py-2 border-b">
                {year}
              </h2>
              <div className="timeline">
                {newsByYear[year].map(item => (
                  <div key={item.id} className="timeline-item">
                    {item.month && (
                      <span className="text-sm font-medium text-muted-foreground">{item.month}</span>
                    )}
                    <p className="mt-1 text-foreground">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && (!news || news.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          No news items found.
        </div>
      )}
    </div>
  )
}
