import { type ReactNode } from 'react'
import { Header } from './Header'
import { TabNav } from './TabNav'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <TabNav />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
