import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'

export function Header(): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editPassword, setEditPassword] = useState('')
  const [editError, setEditError] = useState('')
  const { canEdit, enableEdit, logout } = useAuth()
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleEnableEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError('')
    const success = await enableEdit(editPassword)
    if (success) {
      setShowEditModal(false)
      setEditPassword('')
    } else {
      setEditError('Invalid edit password')
    }
  }

  return (
    <>
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-serif text-lg">PL</span>
            </div>
            <div>
              <h1 className="font-serif text-lg font-semibold text-foreground">
                The Pt. Lawrence Project
              </h1>
              <p className="text-xs text-muted-foreground">
                Orcas Island History & Family Archive
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-64 px-4 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            {canEdit ? (
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                Edit Mode
              </span>
            ) : (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
              >
                Enable Editing
              </button>
            )}

            <button
              onClick={logout}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Edit Mode Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Enable Edit Mode</h2>
            <form onSubmit={handleEnableEdit}>
              <input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Enter edit password"
                className="w-full px-4 py-2 rounded-md border bg-background mb-3"
                autoFocus
              />
              {editError && (
                <p className="text-sm text-destructive mb-3">{editError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm rounded-md hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Enable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
