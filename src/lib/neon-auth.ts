import { createAuthClient } from '@neondatabase/auth'
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters'

// Create auth client with React hooks support
export const authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH_URL, {
  adapter: BetterAuthReactAdapter(),
})

// Email allowlist for edit permissions
const EDITOR_EMAILS = (import.meta.env.VITE_EDITOR_EMAILS || '').split(',').map((e: string) => e.trim().toLowerCase())

export function isEditor(email: string | undefined | null): boolean {
  if (!email) return false
  return EDITOR_EMAILS.includes(email.toLowerCase())
}
