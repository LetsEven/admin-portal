import React from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback
}) => {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  // Show loading while authentication is being verified
  if (!isLoaded) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    router.push('/sign-in');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;