import React, { useState, useEffect } from 'react';
import { UserButton, useUser, useAuth } from '@clerk/nextjs';
import { useRestaurant } from '../contexts/RestaurantContext';
import Link from 'next/link';
import Sidebar from './Sidebar';
import { MenuIcon, XIcon, StoreIcon, ArrowRightIcon } from 'lucide-react';
interface LayoutProps {
  children: React.ReactNode;
}
const Layout: React.FC<LayoutProps> = ({
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useUser();
  const { isLoaded, isSignedIn } = useAuth();
  const { restaurant, loading: restaurantLoading } = useRestaurant();

  // Completar registro si el usuario viene de una invitación
  useEffect(() => {
    const completeRegistrationIfNeeded = async () => {
      if (!user || !user.emailAddresses[0]) return;

      const userEmail = user.emailAddresses[0].emailAddress;

      // Verificar si hay información de invitación en localStorage
      const invitationEmail = localStorage.getItem('invitation_email');

      // O verificar si el email contiene +test u otros indicadores de invitación
      const isFromInvitation = invitationEmail === userEmail ||
                              userEmail.includes('+') ||
                              localStorage.getItem('registration_completed') !== 'true';

      if (isFromInvitation) {
        try {
          console.log('🔄 Attempting to complete registration for:', userEmail);

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin-portal/complete-registration`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: userEmail,
              user_id: user.id
            })
          });

          const data = await response.json();

          if (response.ok) {
            console.log('✅ Registration completed successfully for:', userEmail);
            localStorage.setItem('registration_completed', 'true');
            localStorage.removeItem('invitation_email');
          } else {
            console.log('ℹ️ Registration completion response:', data);
          }
        } catch (error) {
          console.error('❌ Error completing registration:', error);
        }
      }
    };

    completeRegistrationIfNeeded();
  }, [user]);

  // Show loading while authentication is being verified
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated (fallback, middleware should handle this)
  if (!isSignedIn) {
    window.location.href = '/sign-in';
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }
  return <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className="md:hidden">
        <div className={`fixed inset-0 z-40 flex ${sidebarOpen ? 'visible' : 'invisible'}`}>
          <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)} />
          <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transition ease-in-out duration-300 transform shadow-xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button className={`ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white ${sidebarOpen ? '' : 'hidden'}`} onClick={() => setSidebarOpen(false)}>
                <span className="sr-only">Cerrar menú</span>
                <XIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <Sidebar mobile={true} />
          </div>
          <div className="flex-shrink-0 w-14"></div>
        </div>
      </div>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col transition-all duration-300 ease-in-out w-16 hover:w-64 shadow-lg group">
          <Sidebar mobile={false} />
        </div>
      </div>
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden group">
        <div className="md:hidden pl-3 pt-3 flex items-center border-b border-gray-200 bg-white shadow-sm h-14 sticky top-0 z-10">
          <button className="h-10 w-10 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-custom-green-500" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Abrir menú</span>
            <MenuIcon className="h-6 w-6" />
          </button>
          <div className="ml-4 flex items-center">
            <img src="/iso-1-white.png" alt="Xquisito Logo" className="h-8 w-auto mr-2" />
            <span className="text-lg font-medium text-gray-800">Xquisito</span>
          </div>
        </div>
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none bg-gray-50">
          {/* Restaurant Setup Banner */}
          {/* {!restaurantLoading && !restaurant && (
            <div className="bg-gradient-to-r from-custom-green-500 to-custom-green-600 border-b border-custom-green-700">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <div className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <StoreIcon className="h-8 w-8 text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-white">
                          ¡Configura tu restaurante!
                        </h3>
                        <p className="text-sm text-custom-green-100">
                          Para comenzar a gestionar tu menú, primero necesitas configurar la información de tu restaurante.
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Link href="/menu">
                        <button className="inline-flex items-center px-4 py-2 bg-white text-custom-green-700 text-sm font-medium rounded-lg hover:bg-custom-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-custom-green-600 focus:ring-white transition-colors">
                          Configurar ahora
                          <ArrowRightIcon className="ml-2 h-4 w-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )} */}

          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>;
};
export default Layout;