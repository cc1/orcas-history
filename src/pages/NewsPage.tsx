import { useState } from 'react'

// Mock data - will be replaced with actual data fetching
const mockNews = [
  { id: '1895-07-001', year: 1895, month: 'July', content: 'Leslie Darwin and Lew Berens, of New Whatcom, brought Mr. and Mrs. O. H. Culver and children out in their launch to Point Lawrence last week.', people: ['O.H. Culver'], places: ['Point Lawrence'] },
  { id: '1895-08-001', year: 1895, month: 'August', content: 'Mr. and Mrs. Craft, of Whatcom, visited the fish trap at Point Lawrence last Sunday.', people: [], places: ['Point Lawrence'] },
  { id: '1896-06-001', year: 1896, month: 'June', content: 'The fish trap at Point Lawrence is reported to be doing well this season.', people: [], places: ['Point Lawrence'] },
  { id: '1897-05-001', year: 1897, month: 'May', content: 'Carroll Culver celebrated his birthday at Point Lawrence Lodge with family and friends.', people: ['Carroll Culver'], places: ['Point Lawrence Lodge'] },
  { id: '1901-08-001', year: 1901, month: 'August', content: 'Mr. and Mrs. Craft, of Whatcom, and Mr. McDonald, state dairy commissioner, of Seattle, visited mr. Craft\'s fish trap at Point Lawrence, Sunday.', people: [], places: ['Point Lawrence'] },
]

type SortOrder = 'asc' | 'desc'

export function NewsPage(): React.ReactElement {
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [filterPerson, setFilterPerson] = useState<string>('')
  const [filterPlace, setFilterPlace] = useState<string>('')

  // Get unique people and places for filter dropdowns
  const allPeople = [...new Set(mockNews.flatMap(n => n.people))].filter(Boolean).sort()
  const allPlaces = [...new Set(mockNews.flatMap(n => n.places))].filter(Boolean).sort()

  // Filter and sort news
  const filteredNews = mockNews
    .filter(item => {
      if (filterPerson && !item.people.includes(filterPerson)) return false
      if (filterPlace && !item.places.includes(filterPlace)) return false
      return true
    })
    .sort((a, b) => {
      const dateA = a.year
      const dateB = b.year
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })

  // Group by year
  const newsByYear = filteredNews.reduce((acc, item) => {
    if (!acc[item.year]) acc[item.year] = []
    acc[item.year].push(item)
    return acc
  }, {} as Record<number, typeof mockNews>)

  const years = Object.keys(newsByYear).map(Number).sort((a, b) =>
    sortOrder === 'asc' ? a - b : b - a
  )

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

          {/* Person Filter */}
          <select
            value={filterPerson}
            onChange={(e) => setFilterPerson(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-md border bg-background"
          >
            <option value="">All People</option>
            {allPeople.map(person => (
              <option key={person} value={person}>{person}</option>
            ))}
          </select>

          {/* Place Filter */}
          <select
            value={filterPlace}
            onChange={(e) => setFilterPlace(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-md border bg-background"
          >
            <option value="">All Places</option>
            {allPlaces.map(place => (
              <option key={place} value={place}>{place}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
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
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.people.map(person => (
                      <span
                        key={person}
                        className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700"
                      >
                        {person}
                      </span>
                    ))}
                    {item.places.map(place => (
                      <span
                        key={place}
                        className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700"
                      >
                        {place}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredNews.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No news items match your filters.
        </div>
      )}
    </div>
  )
}
