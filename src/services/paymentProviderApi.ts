import { useAuth } from '@clerk/nextjs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const BASE = `${API_BASE_URL}/api/payment-providers`;

export interface PaymentProvider {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export interface PaymentIntegration {
  id: string;
  client_id: string;
  is_active: boolean;
  settings: Record<string, unknown>;
  payment_providers: PaymentProvider;
}

export function usePaymentProviderApi() {
  const { getToken } = useAuth();

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const token = await getToken();

    const response = await fetch(`${BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || `Error ${response.status}`);
    }

    return response.json();
  };

  return {
    // Lista todos los proveedores disponibles
    getProviders: async (): Promise<{ success: boolean; providers: PaymentProvider[] }> => {
      return fetchWithAuth('/');
    },

    // Proveedor activo del restaurante por client UUID
    getClientProvider: async (clientId: string): Promise<{
      success: boolean;
      integration: PaymentIntegration | null;
      provider: string | null;
    }> => {
      return fetchWithAuth(`/client/${clientId}`);
    },

    // Guardar/cambiar el proveedor del restaurante
    setClientProvider: async (clientId: string, providerCode: string): Promise<{
      success: boolean;
      integration: PaymentIntegration;
      provider: string;
    }> => {
      return fetchWithAuth(`/client/${clientId}`, {
        method: 'PUT',
        body: JSON.stringify({ providerCode }),
      });
    },
  };
}
