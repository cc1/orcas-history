import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react/ui'
import '@neondatabase/neon-js/ui/css'
import App from './App'
import { authClient } from './lib/neon-auth'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <NeonAuthUIProvider authClient={authClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </NeonAuthUIProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
