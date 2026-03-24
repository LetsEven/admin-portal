import { useAuth } from '@clerk/nextjs';

// ===============================================
// CONFIGURACIÓN DE LA API
// ===============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const POS_BASE = `${API_BASE_URL}/api/pos`;

// ===============================================
// TIPOS TYPESCRIPT
// ===============================================

export interface AgentStatus {
  hasIntegration: boolean;
  isActive: boolean;
  isAgentConnected: boolean;
  providerName: string | null;
}

export interface SyncResult {
  success: boolean;
  message?: string;
  pulled?: {
    sections: { created: number; updated: number };
    items: { created: number; updated: number };
  };
  pushed?: {
    sections: { created: number };
    items: { created: number };
  };
  errors?: string[];
}

export interface SectionMapping {
  id: string;
  integration_id: string;
  menu_section_id: number;
  pos_group_id: string;
  pos_group_name: string;
  last_synced_at: string;
  menu_sections?: {
    id: number;
    name: string;
    display_order: number;
  };
}

export interface ItemMapping {
  id: string;
  integration_id: string;
  menu_item_id: number;
  pos_item_id: string;
  pos_item_name: string;
  last_synced_at: string;
  menu_items?: {
    id: number;
    name: string;
    price: number;
    section_id: number;
  };
}

// ===============================================
// HOOK PRINCIPAL
// ===============================================

export function usePosApi() {
  const { getToken } = useAuth();

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const token = await getToken();

    const response = await fetch(`${POS_BASE}${endpoint}`, {
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
    // Obtener estado del agente POS para una sucursal
    getAgentStatus: async (branchId: string): Promise<AgentStatus> => {
      const response = await fetchWithAuth(`/branch/${branchId}/agent-status`);
      return response;
    },

    // Sincronizar menú (PULL + PUSH)
    syncMenu: async (branchId: string): Promise<SyncResult> => {
      const response = await fetchWithAuth(`/branch/${branchId}/sync-menu`, {
        method: 'POST',
      });
      return response;
    },

    // Obtener mapeos de secciones
    getSectionMappings: async (branchId: string): Promise<{ mappings: SectionMapping[] }> => {
      const response = await fetchWithAuth(`/branch/${branchId}/section-mappings`);
      return response;
    },

    // Obtener mapeos de items
    getItemMappings: async (branchId: string): Promise<{ mappings: ItemMapping[] }> => {
      const response = await fetchWithAuth(`/branch/${branchId}/item-mappings`);
      return response;
    },

    // Obtener integración POS de una sucursal
    getIntegration: async (branchId: string) => {
      const response = await fetchWithAuth(`/branch/${branchId}/integration`);
      return response;
    },
  };
}
