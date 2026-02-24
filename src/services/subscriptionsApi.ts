import { useAuth } from '@clerk/nextjs';

// ===============================================
// CONFIGURACIÓN DE LA API
// ===============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const SUBSCRIPTIONS_BASE = `${API_BASE_URL}/api/subscriptions`;

// ===============================================
// TIPOS TYPESCRIPT
// ===============================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  features: string[];
  limits: {
    campaigns_per_month: number;
    customers_per_campaign: number;
    segments_total: number;
    advanced_analytics: boolean;
    priority_support: boolean;
  };
  free?: boolean;
  popular?: boolean;
}

export interface Subscription {
  id: number;
  restaurant_id: number;
  plan_type: string;
  status: string;
  ecartpay_customer_id?: string;
  start_date: string;
  end_date?: string;
  next_billing_date?: string;
  auto_renew: boolean;
  price_paid: number;
  currency: string;
  days_remaining?: number;
  renewal_attempts?: number;
  scheduled_plan_change?: string | null;
  renewal_reminder_sent?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionData {
  plan_type: string;
  auto_renew?: boolean;
  payment_data?: {
    fullName: string;
    email: string;
    cardNumber: string;
    expDate: string;
    cvv: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  payment_url?: string;
  payment_id?: string;
  message?: string;
  error?: string;
}

// ===============================================
// UTILIDADES HELPER
// ===============================================

const getAuthHeaders = async (getToken: () => Promise<string | null>) => {
  const token = await getToken();

  if (!token) {
    throw new Error('No authentication token available');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

const handleApiResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status}`;

    if (isJson) {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    }

    throw new Error(errorMessage);
  }

  if (isJson) {
    return await response.json();
  }

  return null;
};

// ===============================================
// FUNCIONES DE LA API
// ===============================================

// Obtener todos los planes disponibles (público)
const getPlansInternal = async (): Promise<SubscriptionPlan[]> => {
  try {
    const response = await fetch(`${SUBSCRIPTIONS_BASE}/plans`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await handleApiResponse(response);
    return result.data || [];
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
};

// Obtener suscripción actual del restaurante del usuario autenticado
const getCurrentSubscriptionInternal = async (getToken: () => Promise<string | null>): Promise<Subscription | null> => {
  try {
    const headers = await getAuthHeaders(getToken);

    const response = await fetch(`${SUBSCRIPTIONS_BASE}/current`, {
      method: 'GET',
      headers,
    });

    const result = await handleApiResponse(response);
    return result.data;
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    throw error;
  }
};

// Obtener suscripción actual del restaurante (por ID - para compatibilidad)
const getCurrentSubscriptionByIdInternal = async (getToken: () => Promise<string | null>, restaurantId: number): Promise<Subscription | null> => {
  try {
    const headers = await getAuthHeaders(getToken);

    const response = await fetch(`${SUBSCRIPTIONS_BASE}/restaurant/${restaurantId}/current`, {
      method: 'GET',
      headers,
    });

    const result = await handleApiResponse(response);
    return result.data;
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    throw error;
  }
};

// Crear nueva suscripción (con procesamiento de pago si es necesario)
const createSubscriptionInternal = async (getToken: () => Promise<string | null>, data: CreateSubscriptionData): Promise<PaymentResponse> => {
  try {
    const headers = await getAuthHeaders(getToken);

    const response = await fetch(`${SUBSCRIPTIONS_BASE}/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    const result = await handleApiResponse(response);
    return result;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
};

// Cambiar plan de suscripción existente
const changePlanInternal = async (getToken: () => Promise<string | null>, data: CreateSubscriptionData): Promise<PaymentResponse> => {
  try {
    const headers = await getAuthHeaders(getToken);

    const response = await fetch(`${SUBSCRIPTIONS_BASE}/change-plan`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    const result = await handleApiResponse(response);
    return result;
  } catch (error) {
    console.error('Error changing plan:', error);
    throw error;
  }
};

// Cancelar suscripción
const cancelSubscriptionInternal = async (getToken: () => Promise<string | null>, subscriptionId: number): Promise<void> => {
  try {
    const headers = await getAuthHeaders(getToken);

    const response = await fetch(`${SUBSCRIPTIONS_BASE}/cancel/${subscriptionId}`, {
      method: 'PUT',
      headers,
    });

    await handleApiResponse(response);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};

// Verificar acceso a una característica específica
const checkFeatureAccessInternal = async (getToken: () => Promise<string | null>, restaurantId: number, featureName: string): Promise<boolean> => {
  try {
    const headers = await getAuthHeaders(getToken);

    const response = await fetch(`${SUBSCRIPTIONS_BASE}/restaurant/${restaurantId}/feature/${featureName}/access`, {
      method: 'GET',
      headers,
    });

    const result = await handleApiResponse(response);
    return result.data?.hasAccess || false;
  } catch (error) {
    console.error('Error checking feature access:', error);
    // En caso de error, denegar acceso por seguridad
    return false;
  }
};

// Programar un downgrade para el fin del ciclo de facturacion
const scheduleDowngradeInternal = async (getToken: () => Promise<string | null>, targetPlan: string): Promise<PaymentResponse> => {
  try {
    const headers = await getAuthHeaders(getToken);

    const response = await fetch(`${SUBSCRIPTIONS_BASE}/schedule-downgrade`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ target_plan: targetPlan }),
    });

    const result = await handleApiResponse(response);
    return result;
  } catch (error) {
    console.error('Error scheduling downgrade:', error);
    throw error;
  }
};

// Cancelar un downgrade programado
const cancelScheduledDowngradeInternal = async (getToken: () => Promise<string | null>): Promise<PaymentResponse> => {
  try {
    const headers = await getAuthHeaders(getToken);

    const response = await fetch(`${SUBSCRIPTIONS_BASE}/schedule-downgrade`, {
      method: 'DELETE',
      headers,
    });

    const result = await handleApiResponse(response);
    return result;
  } catch (error) {
    console.error('Error cancelling scheduled downgrade:', error);
    throw error;
  }
};

// Activar/desactivar renovacion automatica
const toggleAutoRenewInternal = async (getToken: () => Promise<string | null>, autoRenew: boolean): Promise<PaymentResponse> => {
  try {
    const headers = await getAuthHeaders(getToken);

    const response = await fetch(`${SUBSCRIPTIONS_BASE}/auto-renew`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ auto_renew: autoRenew }),
    });

    const result = await handleApiResponse(response);
    return result;
  } catch (error) {
    console.error('Error toggling auto renew:', error);
    throw error;
  }
};

// ===============================================
// HOOK REACT PERSONALIZADO
// ===============================================

export const useSubscriptionsApi = () => {
  const { getToken } = useAuth();

  return {
    getPlans: getPlansInternal,
    getCurrentSubscription: () => getCurrentSubscriptionInternal(getToken),
    getCurrentSubscriptionById: (restaurantId: number) => getCurrentSubscriptionByIdInternal(getToken, restaurantId),
    createSubscription: (data: CreateSubscriptionData) => createSubscriptionInternal(getToken, data),
    changePlan: (data: CreateSubscriptionData) => changePlanInternal(getToken, data),
    cancelSubscription: (subscriptionId: number) => cancelSubscriptionInternal(getToken, subscriptionId),
    checkFeatureAccess: (restaurantId: number, featureName: string) => checkFeatureAccessInternal(getToken, restaurantId, featureName),
    // Nuevas funciones para renovacion automatica
    scheduleDowngrade: (targetPlan: string) => scheduleDowngradeInternal(getToken, targetPlan),
    cancelScheduledDowngrade: () => cancelScheduledDowngradeInternal(getToken),
    toggleAutoRenew: (autoRenew: boolean) => toggleAutoRenewInternal(getToken, autoRenew),
  };
};

export default useSubscriptionsApi;