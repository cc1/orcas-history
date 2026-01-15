import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'

// Mock search results - will be replaced with actual search
interface SearchResult {
  id: string
  type: 'photo' | 'person' | 'place' | 'topic' | 'news'
  title: string
  snippet: string
  imageUrl?: string
  url: string
}

const mockSearchResults: SearchResult[] = [
  { id: '1', type: 'photo', title: 'Photo #0001', snippet: 'Fishing derby weigh in at Point Lawrence...', imageUrl: 'https://picsum.photos/seed/s1/100/75', url: '/photos/0001' },
  { id: '2', type: 'person', title: 'Carroll Nelson Culver', snippet: 'Carroll Culver built and ran Point Lawrence Lodge...', imageUrl: 'https://picsum.photos/seed/s2/100/75', url: '/people/culver-carroll-nelson' },
  { id: '3', type: 'place', title: 'Point Lawrence Lodge', snippet: 'A fishing resort on the eastern tip of Orcas Island...', imageUrl: 'https://picsum.photos/seed/s3/100/75', url: '/places/pt-lawrence-lodge' },
  { id: '4', type: 'topic', title: 'Fish Traps', snippet: 'Fish traps were an important part of the early fishing industry...', imageUrl: 'https://picsum.photos/seed/s4/100/75', url: '/topics/fish-traps' },
  { id: '5', type: 'news', title: '1895 - Culver Family Visit', snippet: 'Leslie Darwin and Lew Berens brought Mr. and Mrs. O. H. Culver...', url: '/news' },
]

const typeLabels: Record<SearchResult['type'], string> = {
  photo: 'Photo',
  person: 'Person',
  place: 'Place',
  topic: 'Topic',
  news: 'News',
}

const typeColors: Record<SearchResult['type'], string> = {
  photo: 'bg-purple-100 text-purple-700',
  person: 'bg-blue-100 text-blue-700',
  place: 'bg-green-100 text-green-700',
  topic: 'bg-orange-100 text-orange-700',
  news: 'bg-gray-100 text-gray-700',
}

export function SearchPage(): React.ReactElement {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (query) {
      setIsLoading(true)
      // Simulate search - replace with actual API call
      setTimeout(() => {
        const filtered = mockSearchResults.filter(r =>
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.snippet.toLowerCase().includes(query.toLowerCase())
        )
        setResults(filtered.length > 0 ? filtered : mockSearchResults)
        setIsLoading(false)
      }, 300)
    } else {
      setResults([])
    }
  }, [query])

  // Group results by type
  const resultsByType = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = []
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  return (
    <div className="container px-4 py-6">
      <h1 className="font-serif text-2xl font-bold mb-2">Search Results</h1>
      {query && (
        <p className="text-muted-foreground mb-6">
          {isLoading ? 'Searching...' : `${results.length} results for "${query}"`}
        </p>
      )}

      {!query && (
        <p className="text-muted-foreground">Enter a search query to find photos, people, places, topics, and news.</p>
      )}

      {!isLoading && results.length > 0 && (
        <div className="space-y-8">
          {Object.entries(resultsByType).map(([type, typeResults]) => (
            <div key={type}>
              <h2 className="font-serif text-lg font-semibold mb-4 capitalize">{typeLabels[type as SearchResult['type']]}</h2>
              <div className="space-y-3">
                {typeResults.map(result => (
                  <Link
                    key={result.id}
                    to={result.url}
                    className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                  >
                    {result.imageUrl && (
                      <img
                        src={result.imageUrl}
                        alt=""
                        className="w-20 h-15 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${typeColors[result.type]}`}>
                          {typeLabels[result.type]}
                        </span>
                        <h3 className="font-medium">{result.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{result.snippet}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && query && results.length === 0 && (
        <p className="text-muted-foreground">No results found for "{query}"</p>
      )}
    </div>
  )
}
