import { useAuth } from '@clerk/nextjs';

// ===============================================
// CONFIGURACIÓN DE LA API
// ===============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const ADMIN_PORTAL_BASE = `${API_BASE_URL}/api/admin-portal`;

// ===============================================
// TIPOS TYPESCRIPT
// ===============================================

export interface AdminPortalUser {
  id: number;
  clerk_user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserWithRestaurant {
  user: AdminPortalUser;
  restaurant: Restaurant | null;
}

export interface MenuSection {
  id: number;
  restaurant_id: number;
  name: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  items?: MenuItem[];
}

export interface MenuItem {
  id: number;
  section_id: number;
  name: string;
  description?: string;
  image_url?: string;
  price: number;
  discount: number;
  custom_fields: CustomField[];
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CustomField {
  id: string;
  type: 'dropdown' | 'checkboxes' | 'dropdown-quantity';
  name: string;
  required: boolean;
  options: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

export interface DashboardStats {
  user: {
    id: number;
    email: string;
    name: string;
    created_at: string;
  };
  restaurant: {
    id: number;
    name: string;
    has_logo: boolean;
    has_banner: boolean;
    has_description: boolean;
    created_at: string;
  };
  menu: {
    total_sections: number;
    total_items: number;
    active_sections: number;
  };
}

export interface SetupStatus {
  user_exists: boolean;
  has_restaurant: boolean;
  setup_complete: boolean;
}

export interface EnabledServices {
  enabled_services: string[];
  client_id: string;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  tables: number;
  active: boolean;
  opening_hours?: {
    [key: string]: {
      open_time: string;
      close_time: string;
      is_closed: boolean;
    };
  };
  created_at: string;
  updated_at: string;
}

export interface ClientBranches {
  client_id: string;
  branches: Branch[];
}

export interface UpdateBranchAddressResponse {
  success: boolean;
  data: Branch;
  message: string;
}

export interface UpdateBranchOpeningHoursResponse {
  success: boolean;
  data: Branch;
  message: string;
}

export interface ServiceInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean; // Si el super admin lo habilitó
  // Removido: active - ya no manejamos estado local
}

// ===============================================
// CLASE PRINCIPAL DEL SERVICIO API
// ===============================================

class AdminPortalApiService {
  private async getAuthToken(): Promise<string | null> {
    try {
      // En el contexto de un componente, necesitaremos pasar el token
      // Por ahora retornamos null para manejar la autenticación externamente
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    try {
      const url = `${ADMIN_PORTAL_BASE}${endpoint}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      };

      // Agregar token de autenticación si está disponible
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'API request failed');
      }

      return data.data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ===============================================
  // MÉTODOS DE AUTENTICACIÓN Y USUARIO
  // ===============================================

  async syncUserFromClerk(clerkUserData: any, token?: string): Promise<UserWithRestaurant> {
    return this.makeRequest<UserWithRestaurant>('/auth/sync', {
      method: 'POST',
      body: JSON.stringify(clerkUserData),
    }, token);
  }

  async getCurrentUser(token: string): Promise<UserWithRestaurant> {
    return this.makeRequest<UserWithRestaurant>('/auth/me', {
      method: 'GET',
    }, token);
  }

  async updateUserProfile(updateData: Partial<AdminPortalUser>, token: string): Promise<AdminPortalUser> {
    return this.makeRequest<AdminPortalUser>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }, token);
  }

  // ===============================================
  // MÉTODOS DE RESTAURANTE
  // ===============================================

  async getRestaurant(token: string): Promise<Restaurant> {
    return this.makeRequest<Restaurant>('/restaurant', {
      method: 'GET',
    }, token);
  }

  async createRestaurant(restaurantData: { name: string; description?: string }, token: string): Promise<Restaurant> {
    return this.makeRequest<Restaurant>('/restaurant', {
      method: 'POST',
      body: JSON.stringify(restaurantData),
    }, token);
  }

  async updateRestaurant(updateData: Partial<Restaurant>, token: string): Promise<Restaurant> {
    return this.makeRequest<Restaurant>('/restaurant', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }, token);
  }

  // ===============================================
  // MÉTODOS DE MENÚ
  // ===============================================

  async getCompleteMenu(token: string): Promise<MenuSection[]> {
    return this.makeRequest<MenuSection[]>('/menu', {
      method: 'GET',
    }, token);
  }

  // ===============================================
  // MÉTODOS DE DASHBOARD
  // ===============================================

  async getDashboardStats(token: string): Promise<DashboardStats> {
    return this.makeRequest<DashboardStats>('/dashboard/stats', {
      method: 'GET',
    }, token);
  }

  // ===============================================
  // MÉTODOS DE CONFIGURACIÓN
  // ===============================================

  async setupUserAndRestaurant(
    userData: Partial<AdminPortalUser>,
    restaurantData: Partial<Restaurant>,
    token: string
  ): Promise<UserWithRestaurant> {
    return this.makeRequest<UserWithRestaurant>('/setup', {
      method: 'POST',
      body: JSON.stringify({
        user_data: userData,
        restaurant_data: restaurantData,
      }),
    }, token);
  }

  async getSetupStatus(token: string): Promise<SetupStatus> {
    return this.makeRequest<SetupStatus>('/setup/status', {
      method: 'GET',
    }, token);
  }

  // ===============================================
  // MÉTODOS DE SERVICIOS
  // ===============================================

  async getEnabledServices(token: string): Promise<EnabledServices> {
    return this.makeRequest<EnabledServices>('/services/enabled', {
      method: 'GET',
    }, token);
  }

  async getBranches(token: string): Promise<ClientBranches> {
    return this.makeRequest<ClientBranches>('/branches', {
      method: 'GET',
    }, token);
  }

  async updateBranchAddress(branchId: string, address: string, token: string): Promise<UpdateBranchAddressResponse> {
    return this.makeRequest<UpdateBranchAddressResponse>(`/branches/${branchId}/address`, {
      method: 'PUT',
      body: JSON.stringify({ address }),
    }, token);
  }

  async updateBranchOpeningHours(branchId: string, openingHours: any, token: string): Promise<UpdateBranchOpeningHoursResponse> {
    return this.makeRequest<UpdateBranchOpeningHoursResponse>(`/branches/${branchId}/opening-hours`, {
      method: 'PUT',
      body: JSON.stringify({ opening_hours: openingHours }),
    }, token);
  }
}

// ===============================================
// HOOK PERSONALIZADO PARA USAR LA API
// ===============================================

export function useAdminPortalApi() {
  const { getToken } = useAuth();

  const makeAuthenticatedRequest = async <T>(
    requestFn: (token: string) => Promise<T>
  ): Promise<T> => {
    try {
      const token = await getToken();

      if (!token) {
        throw new Error('User not authenticated');
      }

      return await requestFn(token);
    } catch (error) {
      console.error('Authenticated request failed:', error);
      throw error;
    }
  };

  return {
    // Métodos de usuario
    getCurrentUser: () => makeAuthenticatedRequest(
      (token) => adminPortalApiService.getCurrentUser(token)
    ),
    updateUserProfile: (data: Partial<AdminPortalUser>) => makeAuthenticatedRequest(
      (token) => adminPortalApiService.updateUserProfile(data, token)
    ),

    // Métodos de restaurante
    getRestaurant: () => makeAuthenticatedRequest(
      (token) => adminPortalApiService.getRestaurant(token)
    ),
    createRestaurant: (data: { name: string; description?: string }) => makeAuthenticatedRequest(
      (token) => adminPortalApiService.createRestaurant(data, token)
    ),
    updateRestaurant: (data: Partial<Restaurant>) => makeAuthenticatedRequest(
      (token) => adminPortalApiService.updateRestaurant(data, token)
    ),

    // Métodos de menú
    getCompleteMenu: () => makeAuthenticatedRequest(
      (token) => adminPortalApiService.getCompleteMenu(token)
    ),

    // Métodos de dashboard
    getDashboardStats: () => makeAuthenticatedRequest(
      (token) => adminPortalApiService.getDashboardStats(token)
    ),

    // Métodos de configuración
    setupUserAndRestaurant: (userData: Partial<AdminPortalUser>, restaurantData: Partial<Restaurant>) =>
      makeAuthenticatedRequest(
        (token) => adminPortalApiService.setupUserAndRestaurant(userData, restaurantData, token)
      ),
    getSetupStatus: () => makeAuthenticatedRequest(
      (token) => adminPortalApiService.getSetupStatus(token)
    ),

    // Métodos de servicios
    getEnabledServices: () => makeAuthenticatedRequest(
      (token) => adminPortalApiService.getEnabledServices(token)
    ),
    getBranches: () => makeAuthenticatedRequest(
      (token) => adminPortalApiService.getBranches(token)
    ),
    updateBranchAddress: (branchId: string, address: string) => makeAuthenticatedRequest(
      (token) => adminPortalApiService.updateBranchAddress(branchId, address, token)
    ),
    updateBranchOpeningHours: (branchId: string, openingHours: any) => makeAuthenticatedRequest(
      (token) => adminPortalApiService.updateBranchOpeningHours(branchId, openingHours, token)
    ),

    // Sincronización inicial (puede no requerir auth)
    syncUserFromClerk: async (clerkUserData: any) => {
      try {
        const token = await getToken();
        return adminPortalApiService.syncUserFromClerk(clerkUserData, token || undefined);
      } catch (error) {
        console.error('Sync user from Clerk failed:', error);
        throw error;
      }
    }
  };
}

// ===============================================
// INSTANCIA EXPORTADA DEL SERVICIO
// ===============================================

export const adminPortalApiService = new AdminPortalApiService();
export default adminPortalApiService;