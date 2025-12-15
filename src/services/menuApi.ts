// ===============================================
// SERVICIO API PARA MENÚ - ADMIN PORTAL
// ===============================================

const API_BASE_URL = 'http://localhost:5000/api/menu';

// ===============================================
// TIPOS TYPESCRIPT
// ===============================================

export interface MenuSection {
  id: number;
  name: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'dropdown' | 'checkboxes' | 'dropdown-quantity';
  required?: boolean;
  maxSelections?: number; // Para checkboxes: cantidad máxima seleccionable (1-4)
  options?: string[];
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
  menu_sections?: {
    id: number;
    name: string;
    is_active: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ===============================================
// UTILIDADES
// ===============================================

const handleResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  if (!data.success) {
    throw new Error(data.message || 'Request was not successful');
  }

  return data.data;
};

const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  console.log(`🔍 API Request: ${finalOptions.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, finalOptions);
    const result = await handleResponse<T>(response);
    console.log(`✅ API Success: ${endpoint}`);
    return result;
  } catch (error) {
    console.error(`❌ API Error: ${endpoint}`, error);
    throw error;
  }
};

// ===============================================
// API DE SECCIONES
// ===============================================

export const sectionsApi = {
  /**
   * Obtener todas las secciones
   */
  getAll: (): Promise<MenuSection[]> => {
    return apiRequest<MenuSection[]>('/sections');
  },

  /**
   * Crear nueva sección
   */
  create: (sectionData: { name: string; display_order?: number }): Promise<MenuSection> => {
    return apiRequest<MenuSection>('/sections', {
      method: 'POST',
      body: JSON.stringify(sectionData),
    });
  },

  /**
   * Actualizar sección
   */
  update: (id: number, sectionData: Partial<MenuSection>): Promise<MenuSection> => {
    return apiRequest<MenuSection>(`/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sectionData),
    });
  },

  /**
   * Eliminar sección
   */
  delete: (id: number): Promise<void> => {
    return apiRequest<void>(`/sections/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Reordenar secciones
   */
  reorder: (sections: { id: number; display_order: number }[]): Promise<void> => {
    return apiRequest<void>('/sections/reorder', {
      method: 'PUT',
      body: JSON.stringify({ sections }),
    });
  },
};

// ===============================================
// API DE PLATILLOS
// ===============================================

export const itemsApi = {
  /**
   * Obtener todos los platillos
   */
  getAll: (filters?: { section_id?: number; is_available?: boolean }): Promise<MenuItem[]> => {
    const queryParams = new URLSearchParams();

    if (filters?.section_id) {
      queryParams.append('section_id', filters.section_id.toString());
    }

    if (filters?.is_available !== undefined) {
      queryParams.append('is_available', filters.is_available.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/items?${queryString}` : '/items';

    return apiRequest<MenuItem[]>(endpoint);
  },

  /**
   * Obtener platillo por ID
   */
  getById: (id: number): Promise<MenuItem> => {
    return apiRequest<MenuItem>(`/items/${id}`);
  },

  /**
   * Crear nuevo platillo
   */
  create: (itemData: {
    section_id: number;
    name: string;
    description?: string;
    image_url?: string;
    price: number;
    discount?: number;
    custom_fields?: CustomField[];
    display_order?: number;
  }): Promise<MenuItem> => {
    return apiRequest<MenuItem>('/items', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },

  /**
   * Actualizar platillo
   */
  update: (id: number, itemData: Partial<MenuItem>): Promise<MenuItem> => {
    return apiRequest<MenuItem>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  },

  /**
   * Eliminar platillo
   */
  delete: (id: number): Promise<void> => {
    return apiRequest<void>(`/items/${id}`, {
      method: 'DELETE',
    });
  },
};

// ===============================================
// API ESPECIALES
// ===============================================

export const menuApi = {
  /**
   * Obtener menú completo (secciones con sus platillos)
   */
  getComplete: (): Promise<any> => {
    return apiRequest<any>('/complete');
  },

  /**
   * Obtener estadísticas del menú
   */
  getStats: (): Promise<any> => {
    return apiRequest<any>('/stats');
  },
};

// ===============================================
// EXPORT DEFAULT
// ===============================================

export default {
  sections: sectionsApi,
  items: itemsApi,
  menu: menuApi,
};