import { getAuthToken } from './adminPortalApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export interface SegmentFilters {
  gender?: 'all' | 'male' | 'female' | 'other';
  age_range?: 'all' | '18-25' | '26-35' | '36-45' | '46-55' | '56+';
  number_of_visits?: 'all' | '1' | '2-5' | 'more_than_5' | 'more_than_10';
  single_purchase_total?: 'all' | 'less_than_200' | '200-500' | 'greater_than_500' | 'greater_than_1000';
  last_visit?: 'all' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'more_than_90_days';
}

export interface CustomerSegment {
  id: string;
  restaurant_id: number;
  segment_name: string;
  filters: SegmentFilters;
  active_filters_count: number;
  estimated_customers: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSegmentData {
  restaurant_id: number;
  segment_name: string;
  filters: SegmentFilters;
  active_filters_count: number;
}

export interface SegmentPreviewData {
  restaurant_id: number;
  filters: SegmentFilters;
}

export interface SegmentPreviewResponse {
  customer_count: number;
  filters_applied: SegmentFilters;
}

class SegmentsAPI {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  private getCacheKey(method: string, params: any): string {
    return `${method}_${JSON.stringify(params)}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log('Returning cached data for:', key);
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private clearCache(): void {
    this.cache.clear();
  }
  /**
   * Obtener todos los segmentos de un restaurante
   */
  async getSegments(restaurantId: number): Promise<CustomerSegment[]> {
    const cacheKey = this.getCacheKey('getSegments', { restaurantId });

    // Check cache first
    const cachedResult = this.getFromCache<CustomerSegment[]>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      console.log('Fetching segments from API for restaurant:', restaurantId);
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/rewards/segments?restaurant_id=${restaurantId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error fetching segments');
      }

      const data = await response.json();
      const segments = data.data || [];

      // Cache the result
      this.setCache(cacheKey, segments);

      return segments;
    } catch (error) {
      console.error('Error fetching segments:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo segmento
   */
  async createSegment(segmentData: CreateSegmentData): Promise<CustomerSegment> {
    try {
      console.log('Creating new segment:', segmentData.segment_name);
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/rewards/segments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(segmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creating segment');
      }

      const data = await response.json();

      // Clear cache after creating a new segment
      this.clearCache();

      return data.data;
    } catch (error) {
      console.error('Error creating segment:', error);
      throw error;
    }
  }

  /**
   * Actualizar un segmento existente
   */
  async updateSegment(segmentId: string, updateData: Partial<CreateSegmentData>): Promise<CustomerSegment> {
    try {
      console.log('Updating segment:', segmentId);
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/rewards/segments/${segmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error updating segment');
      }

      const data = await response.json();

      // Clear cache after updating a segment
      this.clearCache();

      return data.data;
    } catch (error) {
      console.error('Error updating segment:', error);
      throw error;
    }
  }

  /**
   * Eliminar un segmento
   */
  async deleteSegment(segmentId: string): Promise<void> {
    try {
      console.log('Deleting segment:', segmentId);
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/rewards/segments/${segmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error deleting segment');
      }

      // Clear cache after deleting a segment
      this.clearCache();
    } catch (error) {
      console.error('Error deleting segment:', error);
      throw error;
    }
  }

  /**
   * Obtener un segmento por ID
   */
  async getSegmentById(segmentId: string): Promise<CustomerSegment> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/rewards/segments/${segmentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error fetching segment');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching segment by ID:', error);
      throw error;
    }
  }

  /**
   * Preview de segmento - calcular cuántos clientes coinciden
   */
  async previewSegment(previewData: SegmentPreviewData): Promise<SegmentPreviewResponse> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/rewards/segments/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(previewData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error previewing segment');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error previewing segment:', error);
      throw error;
    }
  }

  /**
   * Validar filtros de segmentación (cliente-side)
   */
  validateFilters(filters: SegmentFilters): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    const validValues = {
      gender: ['all', 'male', 'female', 'other'],
      age_range: ['all', '18-25', '26-35', '36-45', '46-55', '56+'],
      number_of_visits: ['all', '1', '2-5', 'more_than_5', 'more_than_10'],
      single_purchase_total: ['all', 'less_than_200', '200-500', 'greater_than_500', 'greater_than_1000'],
      last_visit: ['all', 'last_7_days', 'last_30_days', 'last_90_days', 'more_than_90_days']
    };

    Object.entries(filters).forEach(([filterKey, filterValue]) => {
      const validOptions = validValues[filterKey as keyof typeof validValues];
      if (validOptions && !validOptions.includes(filterValue as any)) {
        errors.push(`Valor no válido para ${filterKey}: ${filterValue}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const segmentsApi = new SegmentsAPI();