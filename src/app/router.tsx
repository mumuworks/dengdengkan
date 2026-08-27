import { createBrowserRouter } from 'react-router'
import { AppShell } from '../components/layout/AppShell'
import { HomeRoute } from '../routes/HomeRoute'
import { PegboardRoute } from '../routes/PegboardRoute'
import { SearchRoute } from '../routes/SearchRoute'
import { SettingsRoute } from '../routes/SettingsRoute'
import { BookmarkDetailRoute } from '../routes/BookmarkDetailRoute'
import { CategoryRoute } from '../routes/CategoryRoute'

/**
 * Route map per Technical Architecture Proposal §23.2:
 * `/`（收藏）、`/board`（洞洞板）、`/search`、`/settings`、`/bookmark/:id`.
 * `/category/:id` is a P1-C2a addition (分類收藏列表, Interaction §9.1) — the
 * source-of-truth route list predates Category browsing and does not enumerate
 * it, so this is an uncontroversial routing extension, not a product decision.
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
      { path: '/category/:id', element: <CategoryRoute /> },
    ],
  },
])
