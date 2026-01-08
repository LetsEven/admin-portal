import { useAuth } from '@clerk/nextjs';
import { MenuSection, MenuItem, CustomField } from './adminPortalApi';

// Re-export types for convenience
export type { MenuSection, MenuItem, CustomField };

// ===============================================
// CONFIGURACIÓN DE LA API DE MENÚ
// ===============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const MENU_ADMIN_BASE = `${API_BASE_URL}/api/admin-portal/menu`;

// ===============================================
// TIPOS ESPECÍFICOS PARA OPERACIONES DE MENÚ
// ===============================================

export interface CreateSectionRequest {
  name: string;
  display_order?: number;
}

export interface UpdateSectionRequest {
  name?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface CreateItemRequest {
  section_id: number;
  name: string;
  description?: string;
  image_url?: string;
  price: number;
  discount?: number;
  custom_fields?: CustomField[];
  display_order?: number;
  availableBranches?: string[]; // Array de branch IDs donde estará disponible
}

export interface UpdateItemRequest {
  section_id?: number;
  name?: string;
  description?: string;
  image_url?: string;
  price?: number;
  discount?: number;
  custom_fields?: CustomField[];
  is_available?: boolean;
  display_order?: number;
  availableBranches?: string[]; // Array de branch IDs donde estará disponible
}

// ===============================================
// SERVICIO DE API PARA MENÚ ADMIN PORTAL
// ===============================================

class MenuAdminPortalApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    try {
      const url = `${MENU_ADMIN_BASE}${endpoint}`;

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
      console.error(`Menu API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ===============================================
  // OPERACIONES DE SECCIONES
  // ===============================================

  async getAllSections(token: string): Promise<MenuSection[]> {
    return this.makeRequest<MenuSection[]>('/sections', {
      method: 'GET',
    }, token);
  }

  async createSection(sectionData: CreateSectionRequest, token: string): Promise<MenuSection> {
    return this.makeRequest<MenuSection>('/sections', {
      method: 'POST',
      body: JSON.stringify(sectionData),
    }, token);
  }

  async updateSection(sectionId: number, updateData: UpdateSectionRequest, token: string): Promise<MenuSection> {
    return this.makeRequest<MenuSection>(`/sections/${sectionId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }, token);
  }

  async deleteSection(sectionId: number, token: string): Promise<boolean> {
    return this.makeRequest<boolean>(`/sections/${sectionId}`, {
      method: 'DELETE',
    }, token);
  }

  async reorderSections(sections: { id: number; display_order: number }[], token: string): Promise<boolean> {
    return this.makeRequest<boolean>('/sections/reorder', {
      method: 'PUT',
      body: JSON.stringify({ sections }),
    }, token);
  }

  // ===============================================
  // OPERACIONES DE ITEMS
  // ===============================================

  async getAllItems(token: string, filters: { section_id?: number; is_available?: boolean } = {}): Promise<MenuItem[]> {
    const queryParams = new URLSearchParams();

    if (filters.section_id !== undefined) {
      queryParams.append('section_id', filters.section_id.toString());
    }

    if (filters.is_available !== undefined) {
      queryParams.append('is_available', filters.is_available.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/items?${queryString}` : '/items';

    return this.makeRequest<MenuItem[]>(endpoint, {
      method: 'GET',
    }, token);
  }

  async getAllItemsByBranch(branchId: string | null, token: string): Promise<MenuItem[]> {
    const endpoint = branchId ? `/items/by-branch/${branchId}` : '/items/by-branch';
    return this.makeRequest<MenuItem[]>(endpoint, {
      method: 'GET',
    }, token);
  }

  async getItemById(itemId: number, token: string): Promise<MenuItem> {
    return this.makeRequest<MenuItem>(`/items/${itemId}`, {
      method: 'GET',
    }, token);
  }

  async createItem(itemData: CreateItemRequest, token: string): Promise<MenuItem> {
    return this.makeRequest<MenuItem>('/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    }, token);
  }

  async updateItem(itemId: number, updateData: UpdateItemRequest, token: string): Promise<MenuItem> {
    return this.makeRequest<MenuItem>(`/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }, token);
  }

  async deleteItem(itemId: number, token: string): Promise<boolean> {
    return this.makeRequest<boolean>(`/items/${itemId}`, {
      method: 'DELETE',
    }, token);
  }

  // ===============================================
  // OPERACIONES DE MENÚ COMPLETO
  // ===============================================

  async getCompleteMenu(token: string): Promise<MenuSection[]> {
    return this.makeRequest<MenuSection[]>('/complete', {
      method: 'GET',
    }, token);
  }
}

// ===============================================
// HOOK PERSONALIZADO PARA OPERACIONES DE MENÚ
// ===============================================

export function useMenuAdminPortalApi() {
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
      console.error('Authenticated menu request failed:', error);
      throw error;
    }
  };

  return {
    // Operaciones de secciones
    sections: {
      getAll: () => makeAuthenticatedRequest(
        (token) => menuAdminPortalApiService.getAllSections(token)
      ),
      create: (data: CreateSectionRequest) => makeAuthenticatedRequest(
        (token) => menuAdminPortalApiService.createSection(data, token)
      ),
      update: (id: number, data: UpdateSectionRequest) => makeAuthenticatedRequest(
        (token) => menuAdminPortalApiService.updateSection(id, data, token)
      ),
      delete: (id: number) => makeAuthenticatedRequest(
        (token) => menuAdminPortalApiService.deleteSection(id, token)
      ),
      reorder: (sections: { id: number; display_order: number }[]) => makeAuthenticatedRequest(
        (token) => menuAdminPortalApiService.reorderSections(sections, token)
      ),
    },

    // Operaciones de items
    items: {
      getAll: (filters?: { section_id?: number; is_available?: boolean }) => makeAuthenticatedRequest(
        (token) => menuAdminPortalApiService.getAllItems(token, filters)
      ),
      getAllByBranch: (branchId: string | null) => makeAuthenticatedRequest(
        (token) => menuAdminPortalApiService.getAllItemsByBranch(branchId, token)
      ),
      getById: (id: number) => makeAuthenticatedRequest(
        (token) => menuAdminPortalApiService.getItemById(id, token)
      ),
      create: (data: CreateItemRequest) => makeAuthenticatedRequest(
        (token) => menuAdminPortalApiService.createItem(data, token)
      ),
      update: (id: number, data: UpdateItemRequest) => makeAuthenticatedRequest(
        (token) => menuAdminPortalApiService.updateItem(id, data, token)
      ),
      delete: (id: number) => makeAuthenticatedRequest(
        (token) => menuAdminPortalApiService.deleteItem(id, token)
      ),
    },

    // Operaciones de menú completo
    menu: {
      getComplete: () => makeAuthenticatedRequest(
        (token) => menuAdminPortalApiService.getCompleteMenu(token)
      ),
    },
  };
}

// ===============================================
// INSTANCIA EXPORTADA DEL SERVICIO
// ===============================================

export const menuAdminPortalApiService = new MenuAdminPortalApiService();
export default menuAdminPortalApiService;