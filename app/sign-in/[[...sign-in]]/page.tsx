'use client'

import { SignIn, useUser } from '@clerk/nextjs'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Page() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Usuario ya está logueado, redirigir al dashboard
      router.push('/')
    }
  }, [isLoaded, isSignedIn, router])

  // Mostrar loading mientras Clerk se carga
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-custom-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si el usuario ya está logueado, no mostrar nada (se está redirigiendo)
  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  // Usuario no está logueado, mostrar formulario de login
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Portal - Xquisito
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa a tu portal de administración
          </p>
        </div>
        <SignIn
          afterSignInUrl="/"
          redirectUrl="/"
        />
      </div>
    </div>
  )
}