import { useEffect } from 'react'
import { RouterProvider } from 'react-router'
import { router } from './router'
import { db } from '../db'

export function App() {
  useEffect(() => {
    void db.ensureBaseline()
  }, [])

  return <RouterProvider router={router} />
}
