/**
 * React hooks for data fetching with loading states
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import * as api from '@/lib/api'

interface UseDataResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => void
}

// Generic data fetching hook with optional enabled flag
function useData<T>(
  fetchFn: () => Promise<{ data: T }>,
  deps: unknown[] = [],
  options: { enabled?: boolean } = {}
): UseDataResult<T> {
  const { enabled = true } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    if (!enabled) return
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
  }, [...deps, enabled])

  useEffect(() => {
    if (enabled) {
      fetch()
    }
  }, [fetch, enabled])

  return { data, loading, error, refetch: fetch }
}

// Generic slug-based entity hook factory (eliminates duplicate null-handling logic)
function useEntityBySlug<T>(
  slug: string | null,
  fetchFn: (slug: string) => Promise<{ data: T }>
): UseDataResult<T> {
  return useData(
    async () => {
      if (!slug) return { data: null as unknown as T }
      return fetchFn(slug)
    },
    [slug]
  )
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
export function usePeople(options?: { enabled?: boolean }): UseDataResult<api.Person[]> {
  return useData(() => api.getPeople(), [], options)
}

export function usePersonBySlug(slug: string | null): UseDataResult<api.Person> {
  return useEntityBySlug(slug, api.getPersonBySlug)
}

// Places hooks
export function usePlaces(options?: { enabled?: boolean }): UseDataResult<api.Place[]> {
  return useData(() => api.getPlaces(), [], options)
}

export function usePlaceBySlug(slug: string | null): UseDataResult<api.Place> {
  return useEntityBySlug(slug, api.getPlaceBySlug)
}

// Topics hooks
export function useTopics(): UseDataResult<api.Topic[]> {
  return useData(() => api.getTopics(), [])
}

export function useTopicBySlug(slug: string | null): UseDataResult<api.Topic> {
  return useEntityBySlug(slug, api.getTopicBySlug)
}

// News hooks
export function useNews(params?: Parameters<typeof api.getNews>[0]): UseDataResult<api.NewsItem[]> {
  return useData(
    () => api.getNews(params),
    [params?.sort, params?.decade]
  )
}

// Entity News hook (news items linked to a specific entity)
export function useEntityNews(
  entityType: 'person' | 'place' | 'topic',
  slug: string | null
): UseDataResult<api.EntityNewsItem[]> {
  return useData(
    async () => {
      if (!slug) return { data: [] }
      return api.getEntityNews(entityType, slug)
    },
    [entityType, slug]
  )
}

// Linked Mentions hook (explicit links from other pages)
export function useLinkedMentions(
  entityType: 'person' | 'place' | 'topic',
  entityId: string | null
): UseDataResult<api.LinkedMentions> {
  return useData(
    async () => {
      if (!entityId) return { data: { people: [], places: [], topics: [] } }
      return api.getLinkedMentions(entityType, entityId)
    },
    [entityType, entityId]
  )
}

// All Entities hook (for autocomplete across all types)
export function useAllEntities(): UseDataResult<api.Entity[]> {
  return useData(() => api.getAllEntities(), [])
}

// ============================================================================
// Infinite Scroll Hook
// ============================================================================

interface UseInfiniteMediaParams {
  category?: 'photo' | 'document'
  sort?: 'number' | 'year-asc' | 'year-desc' | 'random'
  needsDate?: boolean
  missingInfo?: boolean
  pageSize?: number
}

interface UseInfiniteMediaResult {
  data: api.MediaItem[]
  loading: boolean
  loadingMore: boolean
  error: Error | null
  hasMore: boolean
  loadMore: () => void
  total: number
}

export function useInfiniteMedia(params: UseInfiniteMediaParams = {}): UseInfiniteMediaResult {
  const { pageSize = 40 } = params
  const [data, setData] = useState<api.MediaItem[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(true)

  // Track params to detect changes that require a reset
  const paramsRef = useRef({ ...params, pageSize })

  // Reset when params change
  useEffect(() => {
    const paramsChanged =
      paramsRef.current.category !== params.category ||
      paramsRef.current.sort !== params.sort ||
      paramsRef.current.needsDate !== params.needsDate ||
      paramsRef.current.missingInfo !== params.missingInfo

    if (paramsChanged) {
      paramsRef.current = { ...params, pageSize }
      setData([])
      setOffset(0)
      setHasMore(true)
      setLoading(true)
    }
  }, [params.category, params.sort, params.needsDate, params.missingInfo, pageSize])

  // Fetch data
  const fetchPage = useCallback(async (pageOffset: number, isLoadMore: boolean) => {
    if (isLoadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const response = await api.getMedia({
        category: params.category,
        sort: params.sort,
        needsDate: params.needsDate,
        missingInfo: params.missingInfo,
        limit: pageSize,
        offset: pageOffset,
      })

      setTotal(response.total)

      if (isLoadMore) {
        setData(prev => [...prev, ...response.data])
      } else {
        setData(response.data)
      }

      // Check if there are more items to load
      const newTotalLoaded = pageOffset + response.data.length
      setHasMore(newTotalLoaded < response.total)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [params.category, params.sort, params.needsDate, params.missingInfo, pageSize])

  // Initial fetch
  useEffect(() => {
    fetchPage(0, false)
  }, [fetchPage])

  // Load more function
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    const newOffset = offset + pageSize
    setOffset(newOffset)
    fetchPage(newOffset, true)
  }, [loadingMore, hasMore, offset, pageSize, fetchPage])

  return { data, loading, loadingMore, error, hasMore, loadMore, total }
}
