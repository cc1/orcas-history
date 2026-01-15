import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface AuthState {
  isAuthenticated: boolean
  canEdit: boolean
}

interface AuthContextType extends AuthState {
  login: (password: string) => Promise<boolean>
  enableEdit: (editPassword: string) => Promise<boolean>
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
      canEdit: editAuth === 'true',
    }
  })

  const login = useCallback(async (password: string): Promise<boolean> => {
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
      return false
    } catch {
      // Fallback for development - check against env variable
      // In production, this should always use the API
      const devPassword = import.meta.env.VITE_SITE_PASSWORD
      if (devPassword && password === devPassword) {
        sessionStorage.setItem(SITE_AUTH_KEY, 'true')
        setAuthState(prev => ({ ...prev, isAuthenticated: true }))
        return true
      }
      return false
    }
  }, [])

  const enableEdit = useCallback(async (editPassword: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: editPassword }),
      })

      if (response.ok) {
        sessionStorage.setItem(EDIT_AUTH_KEY, 'true')
        setAuthState(prev => ({ ...prev, canEdit: true }))
        return true
      }
      return false
    } catch {
      // Fallback for development
      const devEditPassword = import.meta.env.VITE_EDIT_PASSWORD
      if (devEditPassword && editPassword === devEditPassword) {
        sessionStorage.setItem(EDIT_AUTH_KEY, 'true')
        setAuthState(prev => ({ ...prev, canEdit: true }))
        return true
      }
      return false
    }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(SITE_AUTH_KEY)
    sessionStorage.removeItem(EDIT_AUTH_KEY)
    setAuthState({ isAuthenticated: false, canEdit: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...authState, login, enableEdit, logout }}>
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
