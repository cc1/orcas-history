import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth-context'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
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

function App(): React.ReactElement {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
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
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default App
