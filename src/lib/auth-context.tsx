import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface AuthState {
  isAuthenticated: boolean
  isEditAuthenticated: boolean
}

interface AuthContextType extends AuthState {
  login: (password: string) => Promise<boolean>
  validateEditPassword: (editPassword: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const SITE_AUTH_KEY = 'orcas-site-auth'
const EDIT_AUTH_KEY = 'orcas-edit-auth'

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Check for existing auth in session storage
    const siteAuth = sessionStorage.getItem(SITE_AUTH_KEY)
    const editAuth = sessionStorage.getItem(EDIT_AUTH_KEY)
    return {
      isAuthenticated: siteAuth === 'true',
      isEditAuthenticated: editAuth === 'true',
    }
  })

  const login = useCallback(async (password: string): Promise<boolean> => {
    // Helper for dev fallback
    const tryDevFallback = (): boolean => {
      const devPassword = import.meta.env.VITE_SITE_PASSWORD
      if (devPassword && password === devPassword) {
        sessionStorage.setItem(SITE_AUTH_KEY, 'true')
        setAuthState(prev => ({ ...prev, isAuthenticated: true }))
        return true
      }
      return false
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        sessionStorage.setItem(SITE_AUTH_KEY, 'true')
        setAuthState(prev => ({ ...prev, isAuthenticated: true }))
        return true
      }

      // API returned error - check if it's a server error (API not available)
      // vs a 401/403 (wrong password with working API)
      if (response.status >= 500) {
        return tryDevFallback()
      }

      return false
    } catch {
      // Network error or CORS - try dev fallback
      return tryDevFallback()
    }
  }, [])

  // Validates edit password and stores auth state for the session
  // Once authenticated, user can edit without re-entering password
  const validateEditPassword = useCallback(async (editPassword: string): Promise<boolean> => {
    // If already authenticated, return true immediately
    if (authState.isEditAuthenticated) {
      return true
    }

    // Helper for dev fallback
    const tryDevFallback = (): boolean => {
      const devEditPassword = import.meta.env.VITE_EDIT_PASSWORD
      if (devEditPassword && editPassword === devEditPassword) {
        sessionStorage.setItem(EDIT_AUTH_KEY, 'true')
        setAuthState(prev => ({ ...prev, isEditAuthenticated: true }))
        return true
      }
      return false
    }

    try {
      const response = await fetch('/api/auth/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: editPassword }),
      })

      if (response.ok) {
        sessionStorage.setItem(EDIT_AUTH_KEY, 'true')
        setAuthState(prev => ({ ...prev, isEditAuthenticated: true }))
        return true
      }

      // API returned error - check if it's a server error (API not available)
      if (response.status >= 500) {
        return tryDevFallback()
      }

      return false
    } catch {
      // Network error or CORS - try dev fallback
      return tryDevFallback()
    }
  }, [authState.isEditAuthenticated])

  const logout = useCallback(() => {
    sessionStorage.removeItem(SITE_AUTH_KEY)
    sessionStorage.removeItem(EDIT_AUTH_KEY)
    setAuthState({ isAuthenticated: false, isEditAuthenticated: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...authState, login, validateEditPassword, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
