'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, KeyRound } from 'lucide-react'
import { Field, Input, FieldError } from "@clerk/elements/common"
import { Root, Step, Action } from "@clerk/elements/sign-in"

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
      <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-2 text-white">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si el usuario ya está logueado, no mostrar nada (se está redirigiendo)
  if (isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  // Usuario no está logueado, mostrar formulario de login
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col justify-center items-center px-4">
      <div className="relative z-10 w-full max-w-md text-center flex flex-col items-center">
        {/* Logo */}
        <div className="mb-6">
          <img
            src="logo-short-green.webp"
            alt="Xquisito Logo"
            className="size-16 justify-self-center"
          />
        </div>

        <div className="w-full">
          <Root>
            <Step name="start">
              {/* Título y descripción */}
              <div className="mb-6 text-center">
                <h1 className="text-xl font-medium text-white mb-2">
                  Admin Portal - Xquisito
                </h1>
                <p className="text-gray-200 text-sm">
                  Ingresa a tu portal de administración
                </p>
              </div>

              <div className="space-y-3">
                <Field name="identifier" className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                    <Input
                      required
                      type="email"
                      autoComplete="username email"
                      className="w-full pl-10 pr-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
                      placeholder="Email"
                    />
                  </div>
                  <FieldError className="text-rose-400 text-xs" />
                </Field>

                <Field name="password" className="space-y-2">
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                    <Input
                      required
                      type="password"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
                      placeholder="Contraseña"
                    />
                  </div>
                  <FieldError className="text-rose-400 text-xs" />
                </Field>
              </div>

              <div className="flex items-center justify-center gap-3 mt-5">
                <Action
                  submit
                  className="bg-black hover:bg-stone-950 w-full text-white py-3 rounded-full cursor-pointer transition-colors"
                >
                  Iniciar sesión
                </Action>
              </div>

              <div className="mt-4 text-center">
                <Action
                  navigate="forgot-password"
                  className="text-white text-sm underline cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </Action>
              </div>
            </Step>

            <Step name="forgot-password">
              <div className="mb-6 text-center">
                <h1 className="text-xl font-medium text-white mb-2">
                  Recupera tu contraseña
                </h1>
                <p className="text-gray-200 text-sm">
                  Ingresa tu email para recibir un código
                </p>
              </div>

              <Field name="identifier" className="space-y-2 mb-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                  <Input
                    required
                    type="email"
                    className="w-full pl-10 pr-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
                    placeholder="Email"
                  />
                </div>
                <FieldError className="text-rose-400 text-xs" />
              </Field>

              <Action
                submit
                className="bg-black hover:bg-stone-950 w-full text-white py-3 rounded-full cursor-pointer transition-colors mb-4"
              >
                Enviar código
              </Action>

              <Action
                navigate="start"
                className="text-white text-sm underline cursor-pointer block text-center w-full"
              >
                Volver al inicio de sesión
              </Action>
            </Step>
          </Root>
        </div>
      </div>
    </div>
  )
}