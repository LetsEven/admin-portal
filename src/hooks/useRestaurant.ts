import { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';

interface RestaurantData {
  id?: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  banner_url?: string;
  openingHours?: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  // Settings específicos
  orderNotifications?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  tapPayMode?: "scan_to_pay" | "tap_to_pay";
  language?: string;
  currency?: string;
  tableCount?: number;
}

interface UseRestaurantReturn {
  restaurant: RestaurantData | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateRestaurant: (data: Partial<RestaurantData>) => Promise<void>;
  updateLogo: (imageUrl: string) => Promise<void>;
  updateBanner: (imageUrl: string) => Promise<void>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// Función para convertir horarios del backend (JSON) al formato del frontend
function convertBackendHoursToFrontend(backendHours: any) {
  const frontendHours: any = {};

  for (const [day, hours] of Object.entries(backendHours)) {
    if (typeof hours === 'object' && hours !== null) {
      frontendHours[day] = {
        open: (hours as any).open_time || '09:00',
        close: (hours as any).close_time || '22:00',
        closed: (hours as any).is_closed || false
      };
    }
  }

  return frontendHours;
}

// Función para convertir horarios del frontend al formato del backend (JSON)
function convertFrontendHoursToBackend(frontendHours: any) {
  const backendHours: any = {};

  for (const [day, hours] of Object.entries(frontendHours)) {
    if (typeof hours === 'object' && hours !== null) {
      backendHours[day] = {
        is_closed: (hours as any).closed || false,
        open_time: (hours as any).open || '09:00',
        close_time: (hours as any).close || '22:00'
      };
    }
  }

  return backendHours;
}

export function useRestaurant(): UseRestaurantReturn {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener token de autenticación
  const getAuthToken = useCallback(async (): Promise<string> => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }
      return token;
    } catch (error) {
      console.error('❌ [getAuthToken] Error obteniendo token:', error);
      throw new Error('Error de autenticación');
    }
  }, [user, getToken]);

  // Cargar datos del restaurante
  const fetchRestaurant = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const token = await getAuthToken();
      console.log('🔍 [useRestaurant] Obteniendo restaurante del backend...');

      // Primero intentar obtener el restaurante existente
      const response = await fetch(`${API_BASE_URL}/api/admin-portal/restaurant`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Convertir datos del backend al formato esperado por el frontend
          const restaurantData: RestaurantData = {
            id: result.data.id,
            name: result.data.name,
            description: result.data.description || '',
            address: result.data.address || '',
            phone: result.data.phone || '',
            email: result.data.email || '',
            logo_url: result.data.logo_url || '',
            banner_url: result.data.banner_url || '',
            // Usar opening_hours del backend o datos por defecto
            openingHours: result.data.opening_hours ?
              convertBackendHoursToFrontend(result.data.opening_hours) :
              {
                monday: { open: '09:00', close: '22:00', closed: false },
                tuesday: { open: '09:00', close: '22:00', closed: false },
                wednesday: { open: '09:00', close: '22:00', closed: false },
                thursday: { open: '09:00', close: '22:00', closed: false },
                friday: { open: '09:00', close: '23:00', closed: false },
                saturday: { open: '10:00', close: '23:00', closed: false },
                sunday: { open: '10:00', close: '20:00', closed: false }
              },
            // Usar camelCase en el frontend
            orderNotifications: result.data.order_notifications ?? true,
            emailNotifications: result.data.email_notifications ?? false,
            smsNotifications: result.data.sms_notifications ?? false,
            tapPayMode: result.data.tap_pay_mode ?? "scan_to_pay",
            tableCount: result.data.table_count ?? 0,
            language: 'es',
            currency: 'MXN'
          };

          setRestaurant(restaurantData);
        } else {
          // No hay restaurante, usar datos por defecto
          setRestaurant(getDefaultRestaurantData());
        }
      } else if (response.status === 404) {
        // Restaurante no encontrado, usar datos por defecto
        setRestaurant(getDefaultRestaurantData());
      } else {
        throw new Error('Error al cargar el restaurante');
      }
    } catch (error) {
      console.error('❌ Error cargando restaurante:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      // En caso de error, usar datos por defecto para no bloquear la UI
      setRestaurant(getDefaultRestaurantData());
    } finally {
      setIsLoading(false);
    }
  }, [user, getAuthToken]);

  // Datos por defecto del restaurante
  const getDefaultRestaurantData = (): RestaurantData => ({
    name: 'Mi Restaurante',
    description: '',
    address: '',
    phone: '',
    email: user?.emailAddresses?.[0]?.emailAddress || '',
    logo_url: '',
    banner_url: '',
    openingHours: {
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '23:00', closed: false },
      saturday: { open: '10:00', close: '23:00', closed: false },
      sunday: { open: '10:00', close: '20:00', closed: false }
    },
    orderNotifications: true,
    emailNotifications: false,
    smsNotifications: false,
    tableCount: 0,
    language: 'es',
    currency: 'MXN'
  });

  // Actualizar datos del restaurante
  const updateRestaurant = useCallback(async (updateData: Partial<RestaurantData>) => {
    if (!user || !restaurant) {
      throw new Error('No hay datos del restaurante para actualizar');
    }

    try {
      setIsUpdating(true);
      setError(null);

      const token = await getAuthToken();

      // Preparar datos para el backend (solo los campos que acepta)
      const backendData: any = {
        name: updateData.name,
        description: updateData.description,
        address: updateData.address,
        phone: updateData.phone,
        email: updateData.email,
        logo_url: updateData.logo_url,
        banner_url: updateData.banner_url,
        order_notifications: updateData.orderNotifications,
        email_notifications: updateData.emailNotifications,
        sms_notifications: updateData.smsNotifications,
        tap_pay_mode: updateData.tapPayMode,
        table_count: updateData.tableCount,
      };

      // Si se incluyen horarios, convertirlos al formato del backend
      if (updateData.openingHours) {
        backendData.opening_hours = convertFrontendHoursToBackend(updateData.openingHours);
      }

      // DEBUG: Log datos antes y después del filtrado
      console.log('🔍 [DEBUG] backendData antes del filtrado:', backendData);

      // Filtrar campos undefined
      const filteredData = Object.fromEntries(
        Object.entries(backendData).filter(([_, value]) => value !== undefined)
      );

      console.log('🔍 [DEBUG] filteredData después del filtrado:', filteredData);
      console.log('🔄 Actualizando restaurante:', filteredData);

      const response = await fetch(`${API_BASE_URL}/api/admin-portal/restaurant`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filteredData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el restaurante');
      }

      const result = await response.json();

      if (result.success) {
        // Actualizar estado local con los nuevos datos
        setRestaurant(prev => prev ? { ...prev, ...updateData } : null);
        console.log('✅ Restaurante actualizado exitosamente');
      } else {
        throw new Error(result.message || 'Error al actualizar el restaurante');
      }
    } catch (error) {
      console.error('❌ Error actualizando restaurante:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [user, restaurant, getAuthToken]);

  // Actualizar logo
  const updateLogo = useCallback(async (imageUrl: string) => {
    await updateRestaurant({ logo_url: imageUrl });
  }, [updateRestaurant]);

  // Actualizar banner
  const updateBanner = useCallback(async (imageUrl: string) => {
    await updateRestaurant({ banner_url: imageUrl });
  }, [updateRestaurant]);

  // Cargar datos al montar el componente o cuando cambie el usuario
  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  return {
    restaurant,
    isLoading,
    isUpdating,
    error,
    refetch: fetchRestaurant,
    updateRestaurant,
    updateLogo,
    updateBanner,
  };
}