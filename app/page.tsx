'use client'

import { useAuth } from '@clerk/nextjs'
import Layout from '../src/components/Layout'
import Dashboard from '../src/pages/Dashboard'

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth()

  // Show loading while auth is being verified by middleware
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // If we reach here, user is authenticated (middleware ensures this)
  return (
    <Layout>
      <Dashboard />
    </Layout>
  )
}