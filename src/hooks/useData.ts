/**
 * React hooks for data fetching with loading states
 */
import { useState, useEffect, useCallback } from 'react'
import * as api from '@/lib/api'

interface UseDataResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => void
}

// Generic data fetching hook
function useData<T>(
  fetchFn: () => Promise<{ data: T }>,
  deps: unknown[] = []
): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}

// Media hooks
export function useMedia(params?: Parameters<typeof api.getMedia>[0]): UseDataResult<api.MediaItem[]> & { total: number } {
  const [total, setTotal] = useState(0)

  const result = useData(
    async () => {
      const response = await api.getMedia(params)
      setTotal(response.total)
      return { data: response.data }
    },
    [params?.category, params?.sort, params?.needsDate, params?.limit, params?.offset]
  )

  return { ...result, total }
}

export function useMediaByNumber(number: string | null): UseDataResult<api.MediaItem> {
  return useData(
    async () => {
      if (!number) return { data: null as unknown as api.MediaItem }
      return api.getMediaByNumber(number)
    },
    [number]
  )
}

// People hooks
export function usePeople(): UseDataResult<api.Person[]> {
  return useData(() => api.getPeople(), [])
}

export function usePersonBySlug(slug: string | null): UseDataResult<api.Person> {
  return useData(
    async () => {
      if (!slug) return { data: null as unknown as api.Person }
      return api.getPersonBySlug(slug)
    },
    [slug]
  )
}

// Places hooks
export function usePlaces(): UseDataResult<api.Place[]> {
  return useData(() => api.getPlaces(), [])
}

export function usePlaceBySlug(slug: string | null): UseDataResult<api.Place> {
  return useData(
    async () => {
      if (!slug) return { data: null as unknown as api.Place }
      return api.getPlaceBySlug(slug)
    },
    [slug]
  )
}

// Topics hooks
export function useTopics(): UseDataResult<api.Topic[]> {
  return useData(() => api.getTopics(), [])
}

export function useTopicBySlug(slug: string | null): UseDataResult<api.Topic> {
  return useData(
    async () => {
      if (!slug) return { data: null as unknown as api.Topic }
      return api.getTopicBySlug(slug)
    },
    [slug]
  )
}

// News hooks
export function useNews(params?: Parameters<typeof api.getNews>[0]): UseDataResult<api.NewsItem[]> {
  return useData(
    () => api.getNews(params),
    [params?.sort, params?.decade]
  )
}

// Related Pages hook (bidirectional text-based links)
export function useRelatedPages(
  entityType: 'person' | 'place' | 'topic',
  entityId: string | null
): UseDataResult<api.RelatedPages> {
  return useData(
    async () => {
      if (!entityId) return { data: { people: [], places: [], topics: [] } }
      return api.getRelatedPages(entityType, entityId)
    },
    [entityType, entityId]
  )
}
