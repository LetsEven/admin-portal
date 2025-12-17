import { useAuth } from '@clerk/nextjs';

// ===============================================
// CONFIGURACIÓN DE LA API DE SMS TEMPLATES
// ===============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const SMS_TEMPLATE_BASE = `${API_BASE_URL}/api/sms-templates`;

// ===============================================
// TIPOS
// ===============================================

export interface SmsTemplate {
  id: string;  // UUID from backend
  restaurant_id: number;
  name: string;
  blocks: Array<{
    id: string;
    type: 'title' | 'text' | 'image' | 'button' | 'separator';
    content: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface CreateSmsTemplateRequest {
  name: string;
  blocks: SmsTemplate['blocks'];
}

export interface UpdateSmsTemplateRequest {
  name?: string;
  blocks?: SmsTemplate['blocks'];
}

// ===============================================
// SERVICIO DE API PARA SMS TEMPLATES
// ===============================================

class SmsTemplateApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    try {
      const url = `${SMS_TEMPLATE_BASE}${endpoint}`;

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
      console.error(`SMS Template API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ===============================================
  // OPERACIONES DE SMS TEMPLATES
  // ===============================================

  async getByRestaurant(token: string): Promise<SmsTemplate[]> {
    return this.makeRequest<SmsTemplate[]>(
      '',
      { method: 'GET' },
      token
    );
  }

  async getById(id: string, token: string): Promise<SmsTemplate> {
    return this.makeRequest<SmsTemplate>(
      `/${id}`,
      { method: 'GET' },
      token
    );
  }

  async create(templateData: CreateSmsTemplateRequest, token: string): Promise<SmsTemplate> {
    return this.makeRequest<SmsTemplate>(
      '/',
      {
        method: 'POST',
        body: JSON.stringify(templateData)
      },
      token
    );
  }

  async update(id: string, updateData: UpdateSmsTemplateRequest, token: string): Promise<SmsTemplate> {
    return this.makeRequest<SmsTemplate>(
      `/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(updateData)
      },
      token
    );
  }

  async delete(id: string, token: string): Promise<void> {
    return this.makeRequest<void>(
      `/${id}`,
      { method: 'DELETE' },
      token
    );
  }
}

export const smsTemplateApiService = new SmsTemplateApiService();

// ===============================================
// CUSTOM HOOK PARA REQUESTS AUTENTICADOS
// ===============================================

export function useSmsTemplateApi() {
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
      console.error('SMS template API request failed:', error);
      throw error;
    }
  };

  return {
    getByRestaurant: () =>
      makeAuthenticatedRequest((token) =>
        smsTemplateApiService.getByRestaurant(token)
      ),

    getById: (id: string) =>
      makeAuthenticatedRequest((token) =>
        smsTemplateApiService.getById(id, token)
      ),

    create: (data: CreateSmsTemplateRequest) =>
      makeAuthenticatedRequest((token) =>
        smsTemplateApiService.create(data, token)
      ),

    update: (id: string, data: UpdateSmsTemplateRequest) =>
      makeAuthenticatedRequest((token) =>
        smsTemplateApiService.update(id, data, token)
      ),

    delete: (id: string) =>
      makeAuthenticatedRequest((token) =>
        smsTemplateApiService.delete(id, token)
      ),
  };
}
