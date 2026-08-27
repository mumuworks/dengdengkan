import { createBrowserRouter } from 'react-router'
import { AppShell } from '../components/layout/AppShell'
import { HomeRoute } from '../routes/HomeRoute'
import { PegboardRoute } from '../routes/PegboardRoute'
import { SearchRoute } from '../routes/SearchRoute'
import { SettingsRoute } from '../routes/SettingsRoute'
import { BookmarkDetailRoute } from '../routes/BookmarkDetailRoute'

/**
 * Route map per Technical Architecture Proposal §23.2:
 * `/`（收藏）、`/board`（洞洞板）、`/search`、`/settings`、`/bookmark/:id`.
 */
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomeRoute /> },
      { path: '/board', element: <PegboardRoute /> },
      { path: '/search', element: <SearchRoute /> },
      { path: '/settings', element: <SettingsRoute /> },
      { path: '/bookmark/:id', element: <BookmarkDetailRoute /> },
    ],
  },
])
