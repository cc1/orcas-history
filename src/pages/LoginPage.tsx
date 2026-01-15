import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'

export function LoginPage(): React.ReactElement {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const success = await login(password)
      if (success) {
        navigate('/')
      } else {
        setError('Invalid password')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-primary font-serif text-3xl">PL</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            The Pt. Lawrence Project
          </h1>
          <p className="text-muted-foreground mt-2">
            Orcas Island History & Family Archive
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-center">
            Enter Site Password
          </h2>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
              disabled={isLoading}
            />

            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 px-4 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entering...' : 'Enter'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          This site contains private family history content.
        </p>
      </div>
    </div>
  )
}
