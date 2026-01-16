/**
 * Shared page loading/error/not-found states
 *
 * Consolidates duplicate loading state components from PersonPage, PhotoPage,
 * TopicPage, and PlacePage into a single reusable set of components.
 */

interface PageLoadingProps {
  /** Entity type being loaded (e.g., "person", "photo", "topic", "place") */
  entityType: string
}

interface PageErrorProps {
  /** Entity type that failed to load */
  entityType: string
  /** Error message to display */
  message?: string
}

interface PageNotFoundProps {
  /** Entity type that wasn't found */
  entityType: string
}

/**
 * Centered container wrapper for page states
 */
function PageStateContainer({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="container px-4 py-6">
      <div className="flex items-center justify-center py-12">
        {children}
      </div>
    </div>
  )
}

/**
 * Loading state for entity pages
 */
export function PageLoading({ entityType }: PageLoadingProps): React.ReactElement {
  return (
    <PageStateContainer>
      <div className="text-muted-foreground">Loading {entityType}...</div>
    </PageStateContainer>
  )
}

/**
 * Error state for entity pages
 */
export function PageError({ entityType, message }: PageErrorProps): React.ReactElement {
  return (
    <PageStateContainer>
      <div className="text-destructive">
        {message ? `Error loading ${entityType}: ${message}` : `Error loading ${entityType}`}
      </div>
    </PageStateContainer>
  )
}

/**
 * Not found state for entity pages
 */
export function PageNotFound({ entityType }: PageNotFoundProps): React.ReactElement {
  return (
    <PageStateContainer>
      <div className="text-muted-foreground">{entityType} not found</div>
    </PageStateContainer>
  )
}

/**
 * Combined handler for common page state patterns.
 * Returns the appropriate state component, or null if data is ready.
 *
 * Usage:
 * ```tsx
 * const stateElement = handlePageState({ loading, error, data, entityType: 'person' })
 * if (stateElement) return stateElement
 * // ... render page content with data
 * ```
 */
export function handlePageState<T>({
  loading,
  error,
  data,
  entityType,
}: {
  loading: boolean
  error: Error | null
  data: T | null | undefined
  entityType: string
}): React.ReactElement | null {
  if (loading) {
    return <PageLoading entityType={entityType} />
  }
  if (error) {
    return <PageError entityType={entityType} message={error.message} />
  }
  if (!data) {
    return <PageNotFound entityType={entityType} />
  }
  return null
}
