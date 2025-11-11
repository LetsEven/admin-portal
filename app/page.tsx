'use client'

import Layout from '../src/components/Layout'
import Dashboard from '../src/views/Dashboard'

export default function Home() {
  // Layout component already handles authentication verification
  return (
    <Layout>
      <Dashboard />
    </Layout>
  )
}