'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SignUp, useUser } from '@clerk/nextjs';

export default function Page() {
  const [emailValidation, setEmailValidation] = useState({
    loading: true,
    allowed: false,
    message: '',
    clientName: ''
  });

  const searchParams = useSearchParams();
  const { user } = useUser();
  const isInvited = searchParams.get('invited') === 'true';
  const emailFromUrl = searchParams.get('email');

  useEffect(() => {
    if (isInvited && emailFromUrl) {
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

  // Marcar invitación como completada cuando el usuario se registre
  useEffect(() => {
    if (user && user.emailAddresses[0] && emailFromUrl) {
      const completeRegistration = async () => {
        try {
          await fetch('http://localhost:5000/api/admin-portal/complete-registration', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.emailAddresses[0].emailAddress,
              user_id: user.id
            })
          });
          console.log('✅ Registration completed for:', user.emailAddresses[0].emailAddress);
        } catch (error) {
          console.error('❌ Error completing registration:', error);
        }
      };

      completeRegistration();
    }
  }, [user, emailFromUrl]);

  const validateEmailAccess = async (email: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin-portal/validate-email/${encodeURIComponent(email)}`);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validando acceso...</p>
        </div>
      </div>
    );
  }

  if (!emailValidation.allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-6xl mb-6">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Acceso Restringido
          </h2>
          <p className="text-gray-600 mb-6">
            {emailValidation.message || 'No tienes autorización para acceder a este portal.'}
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">
              Si crees que esto es un error, contacta a tu administrador para obtener una invitación válida.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        {/* Banner de bienvenida para usuarios invitados */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-500 text-2xl mr-3">🎉</div>
            <div>
              <h3 className="text-green-800 font-semibold">
                ¡Bienvenido a la experiencia Xquisito!
              </h3>
              <p className="text-green-700 text-sm">
                Registro autorizado para: <strong>{emailFromUrl}</strong>
              </p>
              {/* {emailValidation.clientName && (
                <p className="text-green-600 text-xs mt-1">
                  Cliente: {emailValidation.clientName}
                </p>
              )} */}
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Admin Portal - Xquisito
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Completa tu registro para acceder a tu portal
          </p>
        </div>

        {/* Formulario de registro */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <SignUp
            afterSignUpUrl="/dashboard"
            appearance={{
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
                card: 'shadow-none'
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}