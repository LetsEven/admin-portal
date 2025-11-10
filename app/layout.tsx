import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'react-hot-toast'
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
    <ClerkProvider 
      signUpFallbackRedirectUrl="/"
      signInFallbackRedirectUrl="/"
    >
      <RestaurantProvider>
        <html lang="es">
          <body className={inter.className}>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#fff',
                  color: '#333',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                },
                success: {
                  style: {
                    border: '1px solid #10b981',
                  },
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  style: {
                    border: '1px solid #ef4444',
                  },
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </body>
        </html>
      </RestaurantProvider>
    </ClerkProvider>
  )
}