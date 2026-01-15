import { NavLink } from 'react-router-dom'

const tabs = [
  { path: '/photos', label: 'Photos' },
  { path: '/people', label: 'People' },
  { path: '/places', label: 'Places' },
  { path: '/topics', label: 'Topics' },
  { path: '/news', label: 'News' },
]

export function TabNav(): React.ReactElement {
  return (
    <nav className="border-b bg-card">
      <div className="container px-4">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
