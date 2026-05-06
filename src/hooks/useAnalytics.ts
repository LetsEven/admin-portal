import { useState, useEffect, useCallback } from "react";
import { useUser, useAuth } from "@clerk/nextjs";

// Tipos para los filtros de analytics
export interface AnalyticsFilters {
  restaurant_id?: number | null;
  branch_id?: string | null; // ✅ NUEVO: Filtro por sucursal
  start_date?: string | null;
  end_date?: string | null;
  gender?: "todos" | "hombre" | "mujer" | "otro";
  age_range?: "todos" | "14-17" | "18-25" | "26-35" | "36-45" | "46+";
  granularity?: "hora" | "dia" | "mes" | "ano";
}

// Tipos para filtros de todos los servicios
export interface AllServicesFilters {
  restaurant_id?: number | null;
  branch_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  granularity?: "hora" | "dia" | "mes" | "ano";
  service_type?:
    | "flex-bill"
    | "pick-n-go"
    | "tap-order-pay"
    | "tap-pay"
    | "room-service"
    | null;
  gender?: "todos" | "hombre" | "mujer" | "otro";
  age_range?: "todos" | "14-17" | "18-25" | "26-35" | "36-45" | "46+";
}

// Tipos para métricas de todos los servicios
export interface AllServicesMetrics {
  ventasTotales: number;
  propinasTotales: number;
  ingresosTotales: number;
  totalTransacciones: number;
  totalOrdenes: number; // Mesas/órdenes atendidas (table_order, tap_orders_and_pay, etc.)
  totalPedidos: number; // Comensales individuales (user_order para FlexBill, igual que órdenes para otros)
  ticketPromedio: number;
  ordenesActivas: number; // Órdenes no pagadas o con platillos no entregados
}

// Desglose por servicio
export interface ServiceBreakdown {
  [serviceName: string]: {
    ventas: number;
    transacciones: number;
  };
}

// Respuesta completa de todos los servicios
export interface AllServicesDashboardData {
  metricas: AllServicesMetrics;
  grafico: ChartDataPoint[];
  desglose_por_servicio: ServiceBreakdown;
  articulo_mas_vendido: TopSellingItem;
  filtros_aplicados: AllServicesFilters;
  servicios_disponibles: string[];
  success: boolean;
}

// Tipos para las métricas del dashboard
export interface DashboardMetrics {
  ventasTotales: number;
  propinasTotales?: number; // Opcional para compatibilidad con datos legacy
  ordenesActivas: number;
  pedidos: number;
  totalOrdenes?: number; // Opcional para compatibilidad con datos legacy
  totalPedidos?: number; // Opcional para compatibilidad con datos legacy
  ticketPromedio: number;
}

// Tipos para los datos del gráfico
export interface ChartDataPoint {
  hora?: number;
  dia?: number;
  mes?: number;
  ano?: number;
  ingresos: number;
}

// Tipos para artículo más vendido
export interface TopSellingItem {
  nombre: string;
  unidades_vendidas: number;
}

// Tipos para item de orden
export interface CustomFieldOption {
  optionId: string;
  optionName: string;
  price: number;
  quantity: number;
}

export interface CustomField {
  fieldId: string;
  fieldName: string;
  fieldType: string;
  selectedOptions?: CustomFieldOption[];
}

export interface OrderItem {
  id: number;
  nombre: string;
  cantidad: number;
  precio: number;
  precioTotal: number;
  estadoPago: string;
  estadoEntrega?: string;
  imagen?: string | null;
  guestName?: string | null;
  customFields?: CustomField[] | null;
}

// Tipos para orden activa
export interface ActiveOrder {
  id: number;
  table_number: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  created_at: string;
  closed_at?: string;
  restaurant_name: string;
  items_count: number;
  items: OrderItem[];
}

// Tipos para respuesta paginada de órdenes
export interface OrdersPaginationResponse {
  orders: ActiveOrder[];
  pagination: {
    limit: number;
    offset: number;
    returned_count: number;
    total_count: number;
    has_more: boolean;
  };
  filters: {
    restaurant_id: number;
    status: string;
  };
}

// Tipos para restaurante
export interface Restaurant {
  id: number;
  name: string;
  is_active: boolean;
}

// Tipos para transacción reciente
export interface PaymentBreakdown {
  name: string;
  amount: number;
}

export interface RecentTransaction {
  id: string;
  baseAmount: number;
  tipAmount: number;
  commission: number;
  totalAmount: number;
  restaurantNet: number;
  createdAt: string;
  serviceType: string;
  orderIdentifier: string;
  orderStatus: string;
  deliveryStatus: "none" | "preparing" | "partial_ready" | "ready" | "partial" | "complete";
  customerName?: string | null;
  paymentsBreakdown?: PaymentBreakdown[] | null;
  // Campos adicionales para FlexBill (desde table_order)
  noItems?: number | null;
  paidAmount?: number | null;
  remainingAmount?: number | null;
  // Folio de la orden (POS o interno)
  folio?: string | null;
}

// Filtros para transacciones recientes
export interface RecentTransactionsFilters {
  restaurant_id?: number | null;
  branch_id?: string | null;
  service_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  limit?: number;
  offset?: number;
}

// Respuesta de transacciones recientes
export interface RecentTransactionsResponse {
  transactions: RecentTransaction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  success: boolean;
}

// Respuesta completa del dashboard
export interface DashboardData {
  metricas: DashboardMetrics;
  grafico: ChartDataPoint[];
  filtros_aplicados: AnalyticsFilters;
  articulo_mas_vendido?: TopSellingItem;
  tiempo_promedio_mesa?: number | null;
  success: boolean;
}

// Respuesta de la API
interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  timestamp: string;
  error?: string;
}

// Hook principal para analytics
interface UseAnalyticsReturn {
  // Datos
  dashboardData: DashboardData | null;
  allServicesData: AllServicesDashboardData | null;
  activeOrders: ActiveOrder[];
  topSellingItem: TopSellingItem | null;
  userRestaurants: Restaurant[];
  recentTransactions: RecentTransaction[];

  // Estados de carga
  isLoading: boolean;
  isLoadingAllServices: boolean;
  isLoadingOrders: boolean;
  isLoadingMoreOrders: boolean;
  isLoadingTopItem: boolean;
  isLoadingRestaurants: boolean;
  isLoadingTransactions: boolean;

  // Estados de paginación
  ordersPagination: {
    hasMore: boolean;
    totalCount: number;
    currentOffset: number;
  };
  transactionsPagination: {
    hasMore: boolean;
    total: number;
    currentOffset: number;
  };

  // Errores
  error: string | null;

  // Funciones
  getDashboardMetrics: (filters: AnalyticsFilters) => Promise<void>;
  getCompleteDashboardData: (filters: AnalyticsFilters) => Promise<void>;
  getDashboardMetricsAllServices: (
    filters: AllServicesFilters,
  ) => Promise<void>;
  getActiveOrders: (restaurantId: number, reset?: boolean) => Promise<void>;
  loadMoreOrders: (restaurantId: number) => Promise<void>;
  getTopSellingItem: (
    filters: Omit<AnalyticsFilters, "gender" | "age_range" | "granularity">,
  ) => Promise<void>;
  getUserRestaurants: () => Promise<void>;
  getDashboardSummary: (restaurantId: number) => Promise<void>;
  getRecentTransactions: (
    filters: RecentTransactionsFilters,
    reset?: boolean,
  ) => Promise<void>;
  loadMoreTransactions: (filters: RecentTransactionsFilters) => Promise<void>;
  getOrderItems: (
    id: string,
    orderStatus: string,
    serviceType: string,
  ) => Promise<OrderItem[]>;
  updateDishDeliveryStatus: (
    dishId: string,
    status: string,
    serviceType: string,
  ) => Promise<boolean>;
  updatePickAndGoOrderCookingStatus: (
    orderId: string,
    status: string,
  ) => Promise<boolean>;

  // Utilidades
  clearError: () => void;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export function useAnalytics(): UseAnalyticsReturn {
  const { user } = useUser();
  const { getToken } = useAuth();

  // Estados para datos
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [allServicesData, setAllServicesData] =
    useState<AllServicesDashboardData | null>(null);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [topSellingItem, setTopSellingItem] = useState<TopSellingItem | null>(
    null,
  );
  const [userRestaurants, setUserRestaurants] = useState<Restaurant[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<
    RecentTransaction[]
  >([]);

  // Estados de carga
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAllServices, setIsLoadingAllServices] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingMoreOrders, setIsLoadingMoreOrders] = useState(false);
  const [isLoadingTopItem, setIsLoadingTopItem] = useState(false);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Estados de paginación
  const [ordersPagination, setOrdersPagination] = useState({
    hasMore: false,
    totalCount: 0,
    currentOffset: 0,
  });
  const [transactionsPagination, setTransactionsPagination] = useState({
    hasMore: false,
    total: 0,
    currentOffset: 0,
  });

  // Estado de error
  const [error, setError] = useState<string | null>(null);

  // Obtener token de autenticación
  const getAuthToken = useCallback(async (): Promise<string> => {
    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("No se pudo obtener el token de autenticación");
      }
      return token;
    } catch (error) {
      console.error("❌ [getAuthToken] Error obteniendo token:", error);
      throw new Error("Error de autenticación");
    }
  }, [user, getToken]);

  // Función helper para construir query params
  const buildQueryParams = (filters: any): string => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        params.append(key, String(value));
      }
    });

    return params.toString();
  };

  // Función helper para manejar respuestas de la API
  const handleApiResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Error ${response.status}: ${response.statusText}`,
      );
    }

    const result: ApiResponse<T> = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Error en la respuesta de la API");
    }

    return result.data;
  };

  // Obtener métricas del dashboard
  const getDashboardMetrics = useCallback(
    async (filters: AnalyticsFilters) => {
      try {
        setIsLoading(true);
        setError(null);

        const token = await getAuthToken();
        const queryParams = buildQueryParams(filters);

        const response = await fetch(
          `${API_BASE_URL}/api/analytics/dashboard/metrics?${queryParams}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const data = await handleApiResponse<DashboardData>(response);
        setDashboardData(data);
      } catch (error) {
        console.error("❌ Error obteniendo métricas del dashboard:", error);
        setError(error instanceof Error ? error.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    },
    [getAuthToken],
  );

  // Obtener datos completos del dashboard
  const getCompleteDashboardData = useCallback(
    async (filters: AnalyticsFilters) => {
      try {
        setIsLoading(true);
        setError(null);

        const token = await getAuthToken();
        const queryParams = buildQueryParams(filters);

        const response = await fetch(
          `${API_BASE_URL}/api/analytics/dashboard/complete?${queryParams}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const data = await handleApiResponse<DashboardData>(response);
        setDashboardData(data);
      } catch (error) {
        console.error(
          "❌ Error obteniendo datos completos del dashboard:",
          error,
        );
        setError(error instanceof Error ? error.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    },
    [getAuthToken],
  );

  // Obtener métricas de TODOS los servicios (FlexBill, Pick&Go, Room Service, Tap Order, Tap Pay)
  const getDashboardMetricsAllServices = useCallback(
    async (filters: AllServicesFilters) => {
      try {
        setIsLoadingAllServices(true);
        setError(null);

        const token = await getAuthToken();
        const queryParams = buildQueryParams(filters);

        const response = await fetch(
          `${API_BASE_URL}/api/analytics/dashboard/metrics-all-services?${queryParams}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const data =
          await handleApiResponse<AllServicesDashboardData>(response);
        setAllServicesData(data);
      } catch (error) {
        console.error(
          "❌ Error obteniendo métricas de todos los servicios:",
          error,
        );
        setError(error instanceof Error ? error.message : "Error desconocido");
      } finally {
        setIsLoadingAllServices(false);
      }
    },
    [getAuthToken],
  );

  // Obtener órdenes del dia
  const getActiveOrders = useCallback(
    async (restaurantId: number, reset: boolean = true) => {
      try {
        setIsLoadingOrders(true);
        setError(null);

        const token = await getAuthToken();
        const offset = reset ? 0 : ordersPagination.currentOffset;

        const response = await fetch(
          `${API_BASE_URL}/api/analytics/dashboard/orders/${restaurantId}?limit=5&offset=${offset}&status=todos&dateFilter=hoy`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const apiResponse =
          await handleApiResponse<OrdersPaginationResponse>(response);

        if (reset) {
          setActiveOrders(apiResponse.orders || []);
        } else {
          setActiveOrders((prev) => [...prev, ...(apiResponse.orders || [])]);
        }

        setOrdersPagination({
          hasMore: apiResponse.pagination?.has_more || false,
          totalCount: apiResponse.pagination?.total_count || 0,
          currentOffset: offset + (apiResponse.pagination?.returned_count || 0),
        });
      } catch (error) {
        console.error("❌ Error obteniendo órdenes:", error);
        setError(error instanceof Error ? error.message : "Error desconocido");
      } finally {
        setIsLoadingOrders(false);
      }
    },
    [getAuthToken, ordersPagination.currentOffset],
  );

  // Nueva función para cargar más órdenes
  const loadMoreOrders = useCallback(
    async (restaurantId: number) => {
      if (!ordersPagination.hasMore || isLoadingMoreOrders) {
        return;
      }

      try {
        setIsLoadingMoreOrders(true);
        setError(null);

        const token = await getAuthToken();

        const response = await fetch(
          `${API_BASE_URL}/api/analytics/dashboard/orders/${restaurantId}?limit=5&offset=${ordersPagination.currentOffset}&status=todos&dateFilter=hoy`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const apiResponse =
          await handleApiResponse<OrdersPaginationResponse>(response);

        setActiveOrders((prev) => [...prev, ...(apiResponse.orders || [])]);

        setOrdersPagination({
          hasMore: apiResponse.pagination?.has_more || false,
          totalCount: apiResponse.pagination?.total_count || 0,
          currentOffset:
            ordersPagination.currentOffset +
            (apiResponse.pagination?.returned_count || 0),
        });
      } catch (error) {
        console.error("❌ Error cargando más órdenes:", error);
        setError(error instanceof Error ? error.message : "Error desconocido");
      } finally {
        setIsLoadingMoreOrders(false);
      }
    },
    [getAuthToken, ordersPagination, isLoadingMoreOrders],
  );

  // Obtener artículo más vendido
  const getTopSellingItem = useCallback(
    async (
      filters: Omit<AnalyticsFilters, "gender" | "age_range" | "granularity">,
    ) => {
      try {
        setIsLoadingTopItem(true);
        setError(null);

        const token = await getAuthToken();
        const queryParams = buildQueryParams(filters);

        const response = await fetch(
          `${API_BASE_URL}/api/analytics/dashboard/top-selling-item?${queryParams}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const data = await handleApiResponse<TopSellingItem>(response);
        setTopSellingItem(data);
      } catch (error) {
        console.error("❌ Error obteniendo artículo más vendido:", error);
        setError(error instanceof Error ? error.message : "Error desconocido");
      } finally {
        setIsLoadingTopItem(false);
      }
    },
    [getAuthToken],
  );

  // Obtener restaurantes del usuario
  const getUserRestaurants = useCallback(async () => {
    try {
      setIsLoadingRestaurants(true);
      setError(null);

      const token = await getAuthToken();

      const response = await fetch(
        `${API_BASE_URL}/api/analytics/restaurants`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await handleApiResponse<Restaurant[]>(response);
      setUserRestaurants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("❌ Error obteniendo restaurantes del usuario:", error);
      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsLoadingRestaurants(false);
    }
  }, [getAuthToken]);

  // Obtener resumen del dashboard
  const getDashboardSummary = useCallback(
    async (restaurantId: number) => {
      try {
        setIsLoading(true);
        setError(null);

        const token = await getAuthToken();

        const response = await fetch(
          `${API_BASE_URL}/api/analytics/dashboard/summary/${restaurantId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const data = await handleApiResponse<DashboardData>(response);
        setDashboardData(data);
      } catch (error) {
        console.error("❌ Error obteniendo resumen del dashboard:", error);
        setError(error instanceof Error ? error.message : "Error desconocido");
      } finally {
        setIsLoading(false);
      }
    },
    [getAuthToken],
  );

  // Obtener transacciones recientes
  const getRecentTransactions = useCallback(
    async (filters: RecentTransactionsFilters, reset: boolean = true) => {
      try {
        setIsLoadingTransactions(true);
        setError(null);

        const token = await getAuthToken();
        const queryParams = buildQueryParams({
          ...filters,
          limit: filters.limit || 10,
          offset:
            filters.offset ??
            (reset ? 0 : transactionsPagination.currentOffset),
        });

        const response = await fetch(
          `${API_BASE_URL}/api/analytics/dashboard/recent-transactions?${queryParams}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const data =
          await handleApiResponse<RecentTransactionsResponse>(response);

        if (reset) {
          setRecentTransactions(data.transactions || []);
        } else {
          setRecentTransactions((prev) => [
            ...prev,
            ...(data.transactions || []),
          ]);
        }

        setTransactionsPagination({
          hasMore: data.pagination?.hasMore || false,
          total: data.pagination?.total || 0,
          currentOffset: reset
            ? filters.limit || 10
            : transactionsPagination.currentOffset + (filters.limit || 10),
        });
      } catch (error) {
        console.error("❌ Error obteniendo transacciones recientes:", error);
        setError(error instanceof Error ? error.message : "Error desconocido");
      } finally {
        setIsLoadingTransactions(false);
      }
    },
    [getAuthToken, transactionsPagination.currentOffset],
  );

  // Cargar más transacciones
  const loadMoreTransactions = useCallback(
    async (filters: RecentTransactionsFilters) => {
      if (isLoadingTransactions || !transactionsPagination.hasMore) return;

      await getRecentTransactions(
        {
          ...filters,
          offset: transactionsPagination.currentOffset,
        },
        false,
      );
    },
    [getRecentTransactions, isLoadingTransactions, transactionsPagination],
  );

  // Obtener items de una orden/transacción
  const getOrderItems = useCallback(
    async (
      id: string,
      orderStatus: string,
      serviceType: string,
    ): Promise<OrderItem[]> => {
      try {
        const token = await getToken();
        const params = new URLSearchParams({ id, orderStatus, serviceType });
        const response = await fetch(
          `${API_BASE_URL}/api/analytics/dashboard/order-items?${params}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        const data = await response.json();
        if (data.success && data.data?.items) {
          return data.data.items;
        }
        return [];
      } catch (error) {
        console.error("Error al obtener items de la orden:", error);
        return [];
      }
    },
    [getToken],
  );

  // Actualizar estado de entrega de un platillo
  const updateDishDeliveryStatus = useCallback(
    async (
      dishId: string,
      status: string,
      serviceType: string,
    ): Promise<boolean> => {
      try {
        const token = await getToken();

        // Determinar el endpoint según el tipo de servicio
        let endpoint = "";
        let method = "PUT";

        switch (serviceType) {
          case "flex-bill":
            endpoint = `${API_BASE_URL}/api/dishes/${dishId}/status`;
            break;
          case "tap-order-pay":
            endpoint = `${API_BASE_URL}/api/dish-orders/${dishId}/status`;
            method = "PATCH";
            break;
          case "tap-pay":
            endpoint = `${API_BASE_URL}/api/tap-pay/dishes/${dishId}/status`;
            break;
          case "room-service":
            endpoint = `${API_BASE_URL}/api/dish-orders/${dishId}/status`;
            method = "PATCH";
            break;
          case "pick-n-go":
            endpoint = `${API_BASE_URL}/api/pick-and-go/dishes/${dishId}/status`;
            break;
          default:
            console.error("Tipo de servicio no soportado:", serviceType);
            return false;
        }

        const response = await fetch(endpoint, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        });

        const data = await response.json();

        if (data.success) {
          console.log("✅ Estado de platillo actualizado:", dishId, status);
          return true;
        }

        console.error("Error al actualizar estado:", data.error);
        return false;
      } catch (error) {
        console.error("Error al actualizar estado de platillo:", error);
        return false;
      }
    },
    [getToken],
  );

  const updatePickAndGoOrderCookingStatus = useCallback(
    async (orderId: string, status: string): Promise<boolean> => {
      try {
        const token = await getToken();
        const response = await fetch(
          `${API_BASE_URL}/api/pick-and-go/orders/${orderId}/cooking-status`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ cooking_status: status }),
          },
        );
        const data = await response.json();
        return data.success === true;
      } catch (error) {
        console.error("Error al actualizar cooking status:", error);
        return false;
      }
    },
    [getToken],
  );

  // Cargar restaurantes al inicializar
  useEffect(() => {
    if (user) {
      getUserRestaurants();
    }
  }, [user, getUserRestaurants]);

  // Función para limpiar errores
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Datos
    dashboardData,
    allServicesData,
    activeOrders,
    topSellingItem,
    userRestaurants,
    recentTransactions,

    // Estados de carga
    isLoading,
    isLoadingAllServices,
    isLoadingOrders,
    isLoadingMoreOrders,
    isLoadingTopItem,
    isLoadingRestaurants,
    isLoadingTransactions,

    // Estados de paginación
    ordersPagination,
    transactionsPagination,

    // Error
    error,

    // Funciones
    getDashboardMetrics,
    getCompleteDashboardData,
    getDashboardMetricsAllServices,
    getActiveOrders,
    loadMoreOrders,
    getTopSellingItem,
    getUserRestaurants,
    getDashboardSummary,
    getRecentTransactions,
    loadMoreTransactions,
    getOrderItems,
    updateDishDeliveryStatus,
    updatePickAndGoOrderCookingStatus,

    // Utilidades
    clearError,
  };
}
