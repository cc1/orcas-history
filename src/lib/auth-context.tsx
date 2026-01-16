import { createContext, useContext, type ReactNode } from 'react'
import { authClient, isEditor } from './neon-auth'

interface AuthContextType {
  isAuthenticated: boolean
  isEditAuthenticated: boolean
  userEmail: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const session = authClient.useSession()

  // User is authenticated if they have an active session
  const isAuthenticated = !session.isPending && !!session.data?.user

  // User can edit if their email is in the allowlist
  const userEmail = session.data?.user?.email ?? null
  const isEditAuthenticated = isEditor(userEmail)

  return (
    <AuthContext.Provider value={{ isAuthenticated, isEditAuthenticated, userEmail }}>
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
