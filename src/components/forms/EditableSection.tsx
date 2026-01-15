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
 * Shows an edit icon that prompts for password, then enables editing for that section only.
 * Editing state is local to this component and does not persist across navigation.
 */
export function EditableSection({
  children,
  className = '',
  onEditStateChange
}: EditableSectionProps): React.ReactElement {
  const { validateEditPassword, isEditAuthenticated } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isValidating, setIsValidating] = useState(false)

  const handleEditClick = useCallback(async () => {
    if (isEditing) {
      // If already editing, just toggle off
      setIsEditing(false)
      onEditStateChange?.(false)
    } else if (isEditAuthenticated) {
      // Already authenticated for this session, enable editing immediately
      setIsEditing(true)
      onEditStateChange?.(true)
    } else {
      // Need to authenticate first
      setShowPasswordModal(true)
      setPassword('')
      setError('')
    }
  }, [isEditing, isEditAuthenticated, onEditStateChange])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsValidating(true)

    try {
      const isValid = await validateEditPassword(password)
      if (isValid) {
        setShowPasswordModal(false)
        setPassword('')
        setIsEditing(true)
        onEditStateChange?.(true)
      } else {
        setError('Invalid password')
      }
    } catch {
      setError('Authentication failed')
    } finally {
      setIsValidating(false)
    }
  }

  const handleCancel = () => {
    setShowPasswordModal(false)
    setPassword('')
    setError('')
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

        {/* Password Modal */}
        {showPasswordModal && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
            onClick={handleCancel}
          >
            <div
              className="bg-card rounded-lg shadow-xl p-6 w-full max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-semibold mb-4">Enter Edit Password</h2>
              <form onSubmit={handlePasswordSubmit}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-2 rounded-md border bg-background mb-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                  disabled={isValidating}
                />
                {error && (
                  <p className="text-sm text-destructive mb-3">{error}</p>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm rounded-md hover:bg-muted transition-colors"
                    disabled={isValidating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    disabled={isValidating}
                  >
                    {isValidating ? 'Checking...' : 'Enable Edit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </EditableSectionContext.Provider>
  )
}
