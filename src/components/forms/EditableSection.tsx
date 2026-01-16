import { useState, useCallback, createContext, useContext, type ReactNode } from 'react'
import { useAuth } from '@/lib/auth-context'

interface EditableSectionContextType {
  isEditing: boolean
}

const EditableSectionContext = createContext<EditableSectionContextType>({ isEditing: false })

export function useEditableSection(): EditableSectionContextType {
  return useContext(EditableSectionContext)
}

interface EditableSectionProps {
  children: ReactNode
  className?: string
  onEditStateChange?: (isEditing: boolean) => void
}

/**
 * Wraps a section of content that can be edited.
 * Shows an edit icon for users with edit permissions (based on email allowlist).
 * Editing state is local to this component and does not persist across navigation.
 */
export function EditableSection({
  children,
  className = '',
  onEditStateChange
}: EditableSectionProps): React.ReactElement {
  const { isEditAuthenticated } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  const handleEditClick = useCallback(() => {
    if (isEditing) {
      // Toggle off
      setIsEditing(false)
      onEditStateChange?.(false)
    } else {
      // Toggle on (only possible if user has edit permissions)
      setIsEditing(true)
      onEditStateChange?.(true)
    }
  }, [isEditing, onEditStateChange])

  // Only show edit button if user has edit permissions
  if (!isEditAuthenticated) {
    return (
      <EditableSectionContext.Provider value={{ isEditing: false }}>
        <div className={className}>{children}</div>
      </EditableSectionContext.Provider>
    )
  }

  return (
    <EditableSectionContext.Provider value={{ isEditing }}>
      <div className={`relative ${className}`}>
        {/* Edit Toggle Button */}
        <button
          onClick={handleEditClick}
          className={`absolute top-0 right-0 p-1.5 rounded-md transition-colors z-10 ${
            isEditing
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title={isEditing ? 'Done editing' : 'Edit this section'}
          aria-label={isEditing ? 'Done editing' : 'Edit this section'}
        >
          {isEditing ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          )}
        </button>

        {children}
      </div>
    </EditableSectionContext.Provider>
  )
}
