import { useAuth } from '@clerk/nextjs';

// ===============================================
// CONFIGURACIÓN DE LA API
// ===============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const CAMPAIGNS_BASE = `${API_BASE_URL}/api/campaigns`;

// ===============================================
// TIPOS TYPESCRIPT
// ===============================================

export interface Campaign {
  id: string;
  restaurant_id: number;
  name: string;
  description?: string;
  segment_id: string;
  reward_type: 'discount_percentage' | 'discount_fixed' | 'free_item' | 'points' | 'buy_one_get_one';
  reward_value: number;
  reward_code?: string;
  reward_description?: string;
  points_required?: number;
  points_awarded?: number;
  start_date: string;
  end_date: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  delivery_methods: string[];
  auto_send?: boolean;
  send_immediately?: boolean;
  total_targeted?: number;
  total_sent?: number;
  total_delivered?: number;
  total_opened?: number;
  total_clicked?: number;
  total_redeemed?: number;
  budget_limit?: number;
  current_spend?: number;
  first_sent_at?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string;
  customer_segments?: {
    id: string;
    segment_name: string;
    active_filters_count: number;
    estimated_customers: number;
  };
  templates?: CampaignTemplate[];
}

export interface CampaignTemplate {
  id: string;
  campaign_id: string;
  template_id: string;
  template_type: 'sms' | 'email' | 'whatsapp' | 'push';
  is_primary?: boolean;
  custom_variables?: Record<string, any>;
  template_data?: any;
  created_at: string;
}

export interface CreateCampaignData {
  restaurant_id: number;
  name: string;
  description?: string;
  segment_id: string;
  reward_type: 'discount_percentage' | 'discount_fixed' | 'free_item' | 'points' | 'buy_one_get_one';
  reward_value?: number; // Opcional
  reward_code?: string; // Opcional
  reward_description?: string;
  points_required?: number;
  points_awarded?: number;
  start_date: string;
  end_date: string;
  delivery_methods: string[];
  auto_send?: boolean;
  send_immediately?: boolean;
  budget_limit?: number;
}

export interface UpdateCampaignData {
  name?: string;
  description?: string;
  segment_id?: string;
  reward_type?: 'discount_percentage' | 'discount_fixed' | 'free_item' | 'points' | 'buy_one_get_one';
  reward_value?: number;
  reward_code?: string;
  reward_description?: string;
  points_required?: number;
  points_awarded?: number;
  start_date?: string;
  end_date?: string;
  status?: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  delivery_methods?: string[];
  auto_send?: boolean;
  send_immediately?: boolean;
  budget_limit?: number;
}

export interface AssociateTemplatesData {
  restaurant_id: number;
  templates: {
    template_id: string;
    template_type: 'sms' | 'email' | 'whatsapp' | 'push';
    is_primary?: boolean;
    custom_variables?: Record<string, any>;
  }[];
}

export interface CampaignStats {
  total: number;
  by_status: Record<string, number>;
  by_delivery_method: Record<string, number>;
}

export interface CampaignAnalytics {
  total_campaigns: number;
  active_campaigns: number;
  total_customers_reached: number;
  total_redemptions: number;
  average_open_rate: number;
  average_redemption_rate: number;
  campaigns: any[];
}

// ===============================================
// CLASE PRINCIPAL DEL SERVICIO API
// ===============================================

class CampaignsApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    try {
      const url = `${CAMPAIGNS_BASE}${endpoint}`;

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
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      return data.data;
    } catch (error) {
      console.error(`Campaigns API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ===============================================
  // MÉTODOS DE CAMPAÑAS
  // ===============================================

  async getCampaigns(restaurantId: number, token: string): Promise<Campaign[]> {
    return this.makeRequest<Campaign[]>(`?restaurant_id=${restaurantId}`, {
      method: 'GET',
    }, token);
  }

  async getCampaignById(campaignId: string, restaurantId: number, token: string): Promise<Campaign> {
    return this.makeRequest<Campaign>(`/${campaignId}?restaurant_id=${restaurantId}`, {
      method: 'GET',
    }, token);
  }

  async createCampaign(campaignData: CreateCampaignData, token: string): Promise<Campaign> {
    return this.makeRequest<Campaign>('', {
      method: 'POST',
      body: JSON.stringify(campaignData),
    }, token);
  }

  async updateCampaign(campaignId: string, restaurantId: number, updateData: UpdateCampaignData, token: string): Promise<Campaign> {
    return this.makeRequest<Campaign>(`/${campaignId}?restaurant_id=${restaurantId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }, token);
  }

  async deleteCampaign(campaignId: string, restaurantId: number, token: string): Promise<{ deleted: boolean }> {
    return this.makeRequest<{ deleted: boolean }>(`/${campaignId}?restaurant_id=${restaurantId}`, {
      method: 'DELETE',
    }, token);
  }

  async updateCampaignStatus(campaignId: string, status: string, restaurantId: number, token: string): Promise<Campaign> {
    return this.makeRequest<Campaign>(`/${campaignId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, restaurant_id: restaurantId }),
    }, token);
  }

  async sendCampaign(campaignId: string, restaurantId: number, token: string): Promise<any> {
    return this.makeRequest<any>(`/${campaignId}/send`, {
      method: 'POST',
      body: JSON.stringify({ restaurant_id: restaurantId }),
    }, token);
  }

  // ===============================================
  // MÉTODOS DE TEMPLATES
  // ===============================================

  async associateTemplates(campaignId: string, templatesData: AssociateTemplatesData, token: string): Promise<CampaignTemplate[]> {
    return this.makeRequest<CampaignTemplate[]>(`/${campaignId}/templates`, {
      method: 'POST',
      body: JSON.stringify(templatesData),
    }, token);
  }

  async getCampaignTemplates(campaignId: string, token: string): Promise<CampaignTemplate[]> {
    return this.makeRequest<CampaignTemplate[]>(`/${campaignId}/templates`, {
      method: 'GET',
    }, token);
  }

  // ===============================================
  // MÉTODOS DE ESTADÍSTICAS Y ANALYTICS
  // ===============================================

  async getCampaignStats(campaignId: string, restaurantId: number, token: string): Promise<CampaignStats> {
    return this.makeRequest<CampaignStats>(`/${campaignId}/stats?restaurant_id=${restaurantId}`, {
      method: 'GET',
    }, token);
  }

  async getCampaignAnalytics(restaurantId: number, token: string): Promise<CampaignAnalytics> {
    return this.makeRequest<CampaignAnalytics>(`/analytics?restaurant_id=${restaurantId}`, {
      method: 'GET',
    }, token);
  }
}

// ===============================================
// HOOK PERSONALIZADO PARA USAR LA API
// ===============================================

export function useCampaignsApi() {
  const { getToken, userId } = useAuth();

  const makeAuthenticatedRequest = async <T>(
    requestFn: (token: string) => Promise<T>
  ): Promise<T> => {
    try {
      const token = await getToken();

      if (!token || !userId) {
        throw new Error(`User not authenticated - token: ${!!token}, userId: ${userId}`);
      }

      return await requestFn(token);
    } catch (error) {
      console.error('Authenticated campaigns request failed:', error);
      throw error;
    }
  };

  return {
    // Métodos de campañas
    getCampaigns: (restaurantId: number) =>
      makeAuthenticatedRequest((token) => campaignsApiService.getCampaigns(restaurantId, token)),

    getCampaignById: (campaignId: string, restaurantId: number) =>
      makeAuthenticatedRequest((token) => campaignsApiService.getCampaignById(campaignId, restaurantId, token)),

    createCampaign: (campaignData: CreateCampaignData) =>
      makeAuthenticatedRequest((token) => campaignsApiService.createCampaign(campaignData, token)),

    updateCampaign: (campaignId: string, restaurantId: number, updateData: UpdateCampaignData) =>
      makeAuthenticatedRequest((token) => campaignsApiService.updateCampaign(campaignId, restaurantId, updateData, token)),

    deleteCampaign: (campaignId: string, restaurantId: number) =>
      makeAuthenticatedRequest((token) => campaignsApiService.deleteCampaign(campaignId, restaurantId, token)),

    updateCampaignStatus: (campaignId: string, status: string, restaurantId: number) =>
      makeAuthenticatedRequest((token) => campaignsApiService.updateCampaignStatus(campaignId, status, restaurantId, token)),

    sendCampaign: (campaignId: string, restaurantId: number) =>
      makeAuthenticatedRequest((token) => campaignsApiService.sendCampaign(campaignId, restaurantId, token)),

    // Métodos de templates
    associateTemplates: (campaignId: string, templatesData: AssociateTemplatesData) =>
      makeAuthenticatedRequest((token) => campaignsApiService.associateTemplates(campaignId, templatesData, token)),

    getCampaignTemplates: (campaignId: string) =>
      makeAuthenticatedRequest((token) => campaignsApiService.getCampaignTemplates(campaignId, token)),

    // Métodos de estadísticas
    getCampaignStats: (campaignId: string, restaurantId: number) =>
      makeAuthenticatedRequest((token) => campaignsApiService.getCampaignStats(campaignId, restaurantId, token)),

    getCampaignAnalytics: (restaurantId: number) =>
      makeAuthenticatedRequest((token) => campaignsApiService.getCampaignAnalytics(restaurantId, token)),
  };
}

// ===============================================
// INSTANCIA EXPORTADA DEL SERVICIO
// ===============================================

export const campaignsApiService = new CampaignsApiService();
export default campaignsApiService;
