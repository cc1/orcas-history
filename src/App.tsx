import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthView, SignedIn, RedirectToSignIn } from '@neondatabase/neon-js/auth/react/ui'
import { AuthProvider } from './lib/auth-context'
import { Layout } from './components/layout/Layout'
import { PhotosPage } from './pages/PhotosPage'
import { PhotoPage } from './pages/PhotoPage'
import { PeoplePage } from './pages/PeoplePage'
import { PersonPage } from './pages/PersonPage'
import { PlacesPage } from './pages/PlacesPage'
import { PlacePage } from './pages/PlacePage'
import { TopicsPage } from './pages/TopicsPage'
import { TopicPage } from './pages/TopicPage'
import { NewsPage } from './pages/NewsPage'
import { SearchPage } from './pages/SearchPage'

function AuthPage(): React.ReactElement {
  const { pathname } = useParams()
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
        <AuthView pathname={pathname} />
      </div>
    </div>
  )
}

function ProtectedContent(): React.ReactElement {
  return (
    <>
      <SignedIn>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/photos" replace />} />
            <Route path="/photos" element={<PhotosPage />} />
            <Route path="/photos/:number" element={<PhotoPage />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/people/:slug" element={<PersonPage />} />
            <Route path="/places" element={<PlacesPage />} />
            <Route path="/places/:slug" element={<PlacePage />} />
            <Route path="/topics" element={<TopicsPage />} />
            <Route path="/topics/:slug" element={<TopicPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/search" element={<SearchPage />} />
          </Routes>
        </Layout>
      </SignedIn>
      <RedirectToSignIn />
    </>
  )
}

function App(): React.ReactElement {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth/:pathname" element={<AuthPage />} />
        <Route path="/*" element={<ProtectedContent />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
