'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Mail, KeyRound, User, CheckCircle2, Circle, ShieldAlert } from 'lucide-react';
import { Field, Input, FieldError } from "@clerk/elements/common";
import { Root, Step, Action } from "@clerk/elements/sign-up";

export default function Page() {
  const [password, setPassword] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordErrorEs, setPasswordErrorEs] = useState('');
  const passwordFieldRef = useRef<HTMLDivElement>(null);
  const [emailValidation, setEmailValidation] = useState({
    loading: true,
    allowed: false,
    message: '',
    clientName: ''
  });

  // Mapeo de data-error-code de Clerk a mensajes en español
  const clerkErrorMap: Record<string, string> = {
    'form_password_pwned': 'Tu contraseña fue encontrada en una filtración de datos. Por seguridad, usa una contraseña diferente.',
    'form_password_length_too_short': 'La contraseña debe tener al menos 8 caracteres.',
  };

  // Observar el FieldError de Clerk y traducirlo al español
  // Dependemos de emailValidation.allowed para que se ejecute cuando el formulario esté visible
  useEffect(() => {
    // Solo ejecutar cuando el formulario está visible (allowed = true)
    if (!emailValidation.allowed) return;

    let observer: MutationObserver | null = null;

    // Pequeño delay para asegurar que el DOM se haya renderizado
    const timeoutId = setTimeout(() => {
      const container = passwordFieldRef.current;
      if (!container) return;

      const checkForErrors = () => {
        // Buscar el FieldError de Clerk usando el atributo data-error-code (específico de Clerk)
        const errorEl = container.querySelector('[data-error-code]') as HTMLElement | null;
        if (errorEl) {
          const errorCode = errorEl.getAttribute('data-error-code');
          if (errorCode && clerkErrorMap[errorCode]) {
            setPasswordErrorEs(clerkErrorMap[errorCode]);
            return;
          }
        }
        setPasswordErrorEs('');
      };

      // Verificar inmediatamente al montar
      checkForErrors();

      observer = new MutationObserver(checkForErrors);
      observer.observe(container, { childList: true, subtree: true, characterData: true, attributes: true });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [emailValidation.allowed]);

  const searchParams = useSearchParams();
  const { user } = useUser();
  const isInvited = searchParams.get('invited') === 'true';
  const emailFromUrl = searchParams.get('email');

  useEffect(() => {
    if (isInvited && emailFromUrl) {
      // Guardar email de invitación en localStorage para el Layout
      localStorage.setItem('invitation_email', emailFromUrl);
      validateEmailAccess(emailFromUrl);
    } else {
      setEmailValidation({
        loading: false,
        allowed: false,
        message: 'Acceso solo por invitación',
        clientName: ''
      });
    }
  }, [isInvited, emailFromUrl]);

  const validateEmailAccess = async (email: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin-portal/validate-email/${encodeURIComponent(email)}`);
      const data = await response.json();

      setEmailValidation({
        loading: false,
        allowed: data.allowed,
        message: data.message || '',
        clientName: data.client_name || ''
      });
    } catch (error) {
      console.error('❌ Error validating email:', error);
      setEmailValidation({
        loading: false,
        allowed: false,
        message: 'Error validando acceso',
        clientName: ''
      });
    }
  };

  if (emailValidation.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Validando acceso...</p>
        </div>
      </div>
    );
  }

  if (!emailValidation.allowed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          {/* Logo */}
          <div className="mb-6">
            <img
              src="/logos/logo-short-green.webp"
              alt="Xquisito Logo"
              className="size-18 justify-self-center mx-auto"
            />
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
            <div className="text-red-400 text-6xl mb-6">🚫</div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Acceso Restringido
            </h2>
            <p className="text-gray-200 mb-6">
              {emailValidation.message || 'No tienes autorización para acceder a este portal.'}
            </p>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <p className="text-sm text-gray-300">
                Si crees que esto es un error, contacta a tu administrador para obtener una invitación válida.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  Completa tu registro para acceder a tu portal
                </p>
              </div>

              <div className="space-y-3">
                <Field name="firstName" className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                    <Input
                      required
                      type="text"
                      autoComplete="given-name"
                      className="w-full pl-10 pr-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
                      placeholder="Nombre"
                    />
                  </div>
                  <FieldError className="text-rose-400 text-xs" />
                </Field>

                <Field name="lastName" className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                    <Input
                      required
                      type="text"
                      autoComplete="family-name"
                      className="w-full pl-10 pr-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
                      placeholder="Apellido"
                    />
                  </div>
                  <FieldError className="text-rose-400 text-xs" />
                </Field>

                <Field name="emailAddress" className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                    <Input
                      required
                      type="email"
                      autoComplete="username email"
                      className="w-full pl-10 pr-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
                      placeholder="Email"
                      defaultValue={emailFromUrl || ''}
                    />
                  </div>
                  <FieldError className="text-rose-400 text-xs" />
                </Field>

                <div ref={passwordFieldRef}>
                <Field name="password" className="space-y-2">
                  <div
                    className="relative"
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.type === 'password' || target.name === 'password') {
                        setPassword(target.value);
                      }
                    }}
                    onFocusCapture={() => setPasswordFocused(true)}
                    onBlurCapture={() => setPasswordFocused(false)}
                  >
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                    <Input
                      required
                      type="password"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
                      placeholder="Contraseña"
                    />
                  </div>
                  {/* FieldError de Clerk oculto visualmente pero presente en el DOM para el MutationObserver */}
                  <FieldError className="sr-only" />

                  {/* Requisitos de contraseña */}
                  {(passwordFocused || password.length > 0) && (
                    <div className="mt-1 space-y-1.5 transition-all duration-200">
                      {/* <div className="flex items-center gap-1.5">
                        {password.length >= 8 ? (
                          <CheckCircle2 className="size-3.5 text-green-400 flex-shrink-0" />
                        ) : (
                          <Circle className="size-3.5 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={`text-xs ${password.length >= 8 ? 'text-green-400' : 'text-gray-400'}`}>
                          Mínimo 8 caracteres
                        </span>
                      </div> */}
                      <div className="flex items-start gap-1.5">
                        <ShieldAlert className={`size-3.5 flex-shrink-0 mt-0.5 ${passwordErrorEs ? 'text-rose-400' : password.length >= 8 ? 'text-amber-400' : 'text-gray-400'}`} />
                        <span className={`text-xs ${passwordErrorEs ? 'text-rose-400 font-medium' : password.length >= 8 ? 'text-amber-400' : 'text-gray-400'}`}>
                          {passwordErrorEs
                            || (password.length >= 8
                              ? 'Si tu contraseña fue expuesta en una filtración de datos, será rechazada. Usa una contraseña única.'
                              : 'Las contraseñas comprometidas serán rechazadas por seguridad')
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </Field>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 mt-6">
                <Action
                  submit
                  className="bg-black hover:bg-stone-950 w-full text-white py-3 rounded-full cursor-pointer transition-colors"
                >
                  Crear cuenta
                </Action>
              </div>

              <div className="mt-4 text-center">
                <p className="text-white text-sm">
                  ¿Ya tienes una cuenta?{' '}
                  <a href="/sign-in" className="underline hover:text-gray-200">
                    Iniciar sesión
                  </a>
                </p>
              </div>
            </Step>

            <Step name="verifications">
              <div className="mb-6 text-center">
                <h1 className="text-xl font-medium text-white mb-2">
                  Verificar tu cuenta
                </h1>
                <p className="text-gray-200 text-sm">
                  Hemos enviado un código de verificación a tu email
                </p>
              </div>

              <Field name="code" className="space-y-2 mb-6">
                <Input
                  required
                  type="text"
                  className="w-full px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent text-center tracking-widest"
                  placeholder="Código de verificación"
                />
                <FieldError className="text-rose-400 text-xs" />
              </Field>

              <Action
                submit
                className="bg-black hover:bg-stone-950 w-full text-white py-3 rounded-full cursor-pointer transition-colors"
              >
                Verificar cuenta
              </Action>
            </Step>
          </Root>
        </div>
      </div>
    </div>
  );
}