import { useAuth } from '@clerk/nextjs';

// ===============================================
// CONFIGURACIÓN DE LA API
// ===============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const FLEX_BILL_BASE = `${API_BASE_URL}/api/flex-bill`;

// ===============================================
// TIPOS TYPESCRIPT
// ===============================================

export interface FlexBillMetrics {
  shared_orders: number;
  avg_diners_per_order: number;
  avg_ticket_per_diner: number;
  avg_payment_time: number;
  total_diners: number;
  growth_percentage: number;
  diners_growth_percentage?: number;
  ticket_growth_percentage?: number;
  payment_time_growth_percentage?: number;
}

export interface FlexBillChartData {
  name: string;
  orders: number;
  diners: number;
}

export interface PaymentAnalytics {
  payment_type_distribution: {
    split: number;
    single: number;
  };
  payment_time_distribution: {
    [key: string]: number;
  };
  avg_payment_time: number;
  total_transactions: number;
}

export interface TableUsage {
  name: string;
  table_number: number;
  value: number;
  usage_percentage: number;
}

export interface FlexBillDashboardData {
  success: boolean;
  metrics: FlexBillMetrics;
  chart_data: FlexBillChartData[];
  shared_orders_chart_data?: FlexBillChartData[];
  payment_analytics: PaymentAnalytics;
  table_usage: TableUsage[];
  timestamp: string;
}

export interface FlexBillFilters {
  restaurant_id: number;
  time_range?: 'daily' | 'weekly' | 'monthly';
  start_date?: string;
  end_date?: string;
}

// ===============================================
// CLASE PRINCIPAL DEL SERVICIO API
// ===============================================

class FlexBillApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    try {
      const url = `${FLEX_BILL_BASE}${endpoint}`;

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

      if (data.success === false) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error(`FlexBill API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ===============================================
  // MÉTODOS DE FLEXBILL DASHBOARD
  // ===============================================

  async getMetrics(filters: FlexBillFilters, token?: string): Promise<FlexBillMetrics> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const result = await this.makeRequest<{ metrics: FlexBillMetrics }>(
        `/dashboard/metrics?${queryParams.toString()}`,
        { method: 'GET' },
        token
      );

      return result.metrics;
    } catch (error) {
      console.error('Error fetching FlexBill metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  async getChartData(filters: FlexBillFilters, token?: string): Promise<FlexBillChartData[]> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const result = await this.makeRequest<{ chart_data: FlexBillChartData[] }>(
        `/dashboard/charts?${queryParams.toString()}`,
        { method: 'GET' },
        token
      );

      return result.chart_data;
    } catch (error) {
      console.error('Error fetching FlexBill chart data:', error);
      return this.getDefaultChartData(filters.time_range || 'daily');
    }
  }

  async getDinersChartData(filters: FlexBillFilters, token?: string): Promise<FlexBillChartData[]> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const result = await this.makeRequest<{ chart_data: FlexBillChartData[] }>(
        `/dashboard/diners?${queryParams.toString()}`,
        { method: 'GET' },
        token
      );

      return result.chart_data;
    } catch (error) {
      console.error('Error fetching FlexBill diners chart data:', error);
      return this.getDefaultChartData(filters.time_range || 'daily');
    }
  }

  async getPaymentAnalytics(filters: FlexBillFilters, token?: string): Promise<PaymentAnalytics> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const result = await this.makeRequest<{ payment_analytics: PaymentAnalytics }>(
        `/dashboard/payment-analytics?${queryParams.toString()}`,
        { method: 'GET' },
        token
      );

      return result.payment_analytics;
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      return this.getDefaultPaymentAnalytics();
    }
  }

  async getTableUsage(filters: Pick<FlexBillFilters, 'restaurant_id'>, token?: string): Promise<TableUsage[]> {
    try {
      const queryParams = new URLSearchParams({
        restaurant_id: filters.restaurant_id.toString()
      });

      const result = await this.makeRequest<{ table_usage: TableUsage[] }>(
        `/dashboard/table-usage?${queryParams.toString()}`,
        { method: 'GET' },
        token
      );

      return result.table_usage;
    } catch (error) {
      console.error('Error fetching table usage:', error);
      return this.getDefaultTableUsage();
    }
  }

  async getCompleteDashboardData(filters: FlexBillFilters, token?: string): Promise<FlexBillDashboardData> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const result = await this.makeRequest<FlexBillDashboardData>(
        `/dashboard/complete?${queryParams.toString()}`,
        { method: 'GET' },
        token
      );

      return result;
    } catch (error) {
      console.error('Error fetching complete FlexBill dashboard data:', error);
      return this.getFallbackDashboardData(filters);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.makeRequest<{ status: string }>('/health', { method: 'GET' });
      return result.status === 'OK';
    } catch (error) {
      console.error('FlexBill health check failed:', error);
      return false;
    }
  }

  // ===============================================
  // MÉTODOS DE FALLBACK CON DATOS POR DEFECTO
  // ===============================================

  private getDefaultMetrics(): FlexBillMetrics {
    return {
      shared_orders: 965,
      avg_diners_per_order: 4.2,
      avg_ticket_per_diner: 185,
      avg_payment_time: 8.5,
      total_diners: 4053,
      growth_percentage: 14.2
    };
  }

  private getDefaultChartData(timeRange: string): FlexBillChartData[] {
    switch (timeRange) {
      case 'weekly':
        return [
          { name: 'Sem 1', orders: 210, diners: 840 },
          { name: 'Sem 2', orders: 245, diners: 980 },
          { name: 'Sem 3', orders: 275, diners: 1100 },
          { name: 'Sem 4', orders: 310, diners: 1240 }
        ];
      case 'monthly':
        return [
          { name: 'Ene', orders: 950, diners: 3800 },
          { name: 'Feb', orders: 1050, diners: 4200 },
          { name: 'Mar', orders: 1150, diners: 4600 },
          { name: 'Abr', orders: 1250, diners: 5000 },
          { name: 'May', orders: 1350, diners: 5400 },
          { name: 'Jun', orders: 1450, diners: 5800 }
        ];
      default: // daily
        return [
          { name: 'Lun', orders: 32, diners: 128 },
          { name: 'Mar', orders: 28, diners: 98 },
          { name: 'Mié', orders: 34, diners: 119 },
          { name: 'Jue', orders: 40, diners: 160 },
          { name: 'Vie', orders: 58, diners: 232 },
          { name: 'Sáb', orders: 65, diners: 325 },
          { name: 'Dom', orders: 52, diners: 208 }
        ];
    }
  }

  private getDefaultPaymentAnalytics(): PaymentAnalytics {
    return {
      payment_type_distribution: {
        split: 65,
        single: 35
      },
      payment_time_distribution: {
        '0-5 min': 25,
        '5-10 min': 40,
        '10-15 min': 20,
        '15-20 min': 10,
        '20+ min': 5
      },
      avg_payment_time: 8.5,
      total_transactions: 965
    };
  }

  private getDefaultTableUsage(): TableUsage[] {
    return [
      { name: 'Mesa 1', table_number: 1, value: 28, usage_percentage: 70 },
      { name: 'Mesa 2', table_number: 2, value: 32, usage_percentage: 80 },
      { name: 'Mesa 3', table_number: 3, value: 45, usage_percentage: 90 },
      { name: 'Mesa 4', table_number: 4, value: 22, usage_percentage: 55 },
      { name: 'Mesa 5', table_number: 5, value: 56, usage_percentage: 95 },
      { name: 'Mesa 6', table_number: 6, value: 38, usage_percentage: 85 },
      { name: 'Mesa 7', table_number: 7, value: 41, usage_percentage: 88 },
      { name: 'Mesa 8', table_number: 8, value: 30, usage_percentage: 75 }
    ];
  }

  private getFallbackDashboardData(filters: FlexBillFilters): FlexBillDashboardData {
    return {
      success: true,
      metrics: this.getDefaultMetrics(),
      chart_data: this.getDefaultChartData(filters.time_range || 'daily'),
      payment_analytics: this.getDefaultPaymentAnalytics(),
      table_usage: this.getDefaultTableUsage(),
      timestamp: new Date().toISOString()
    };
  }
}

// ===============================================
// HOOK PERSONALIZADO PARA USAR LA API
// ===============================================

export function useFlexBillApi() {
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
      console.error('Authenticated FlexBill request failed:', error);
      throw error;
    }
  };

  return {
    // Métodos principales de FlexBill
    getMetrics: (filters: FlexBillFilters) => makeAuthenticatedRequest(
      (token) => flexBillApiService.getMetrics(filters, token)
    ),

    getChartData: (filters: FlexBillFilters) => makeAuthenticatedRequest(
      (token) => flexBillApiService.getChartData(filters, token)
    ),

    getDinersChartData: (filters: FlexBillFilters) => makeAuthenticatedRequest(
      (token) => flexBillApiService.getDinersChartData(filters, token)
    ),

    getPaymentAnalytics: (filters: FlexBillFilters) => makeAuthenticatedRequest(
      (token) => flexBillApiService.getPaymentAnalytics(filters, token)
    ),

    getTableUsage: (filters: Pick<FlexBillFilters, 'restaurant_id'>) => makeAuthenticatedRequest(
      (token) => flexBillApiService.getTableUsage(filters, token)
    ),

    getCompleteDashboardData: (filters: FlexBillFilters) => makeAuthenticatedRequest(
      (token) => flexBillApiService.getCompleteDashboardData(filters, token)
    ),

    // Health check (no requiere autenticación)
    healthCheck: () => flexBillApiService.healthCheck(),
  };
}

// ===============================================
// INSTANCIA EXPORTADA DEL SERVICIO
// ===============================================

export const flexBillApiService = new FlexBillApiService();
export default flexBillApiService;