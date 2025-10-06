import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { RestaurantProvider } from '../src/contexts/RestaurantContext'
import '../src/index.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Admin Portal - Xquisito',
  description: 'Portal de Administración de Restaurantes Xquisito',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <RestaurantProvider>
        <html lang="es">
          <body className={inter.className}>{children}</body>
        </html>
      </RestaurantProvider>
    </ClerkProvider>
  )
}