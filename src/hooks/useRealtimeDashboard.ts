import { useEffect, useCallback, useRef } from "react";
import { useSocketContext } from "../contexts/SocketContext";
import type {
  RecentTransaction,
  ActiveOrder,
  AllServicesMetrics,
  ChartDataPoint,
} from "./useAnalytics";

interface MetricsUpdatePayload {
  metrics: Partial<AllServicesMetrics>;
  timestamp: string;
}

interface NewTransactionPayload {
  transaction: RecentTransaction;
  timestamp: string;
}

interface OrderUpdatePayload {
  order: ActiveOrder;
  action: "created" | "updated" | "closed";
  timestamp: string;
}

interface ChartUpdatePayload {
  dataPoint: ChartDataPoint;
  granularity: string;
  timestamp: string;
}

interface UseRealtimeDashboardOptions {
  restaurantId: number | null;
  enabled?: boolean;
  onMetricsUpdate?: (metrics: Partial<AllServicesMetrics>) => void;
  onNewTransaction?: (transaction: RecentTransaction) => void;
  onOrderUpdate?: (
    order: ActiveOrder,
    action: "created" | "updated" | "closed",
  ) => void;
  onChartUpdate?: (dataPoint: ChartDataPoint, granularity: string) => void;
  onFullRefresh?: () => void;
}

export function useRealtimeDashboard(options: UseRealtimeDashboardOptions) {
  const {
    restaurantId,
    enabled = true,
    onMetricsUpdate,
    onNewTransaction,
    onOrderUpdate,
    onChartUpdate,
    onFullRefresh,
  } = options;

  const {
    socket,
    isConnected,
    joinRestaurant,
    leaveRestaurant,
    requestRefresh,
    reconnect,
  } = useSocketContext();
  const previousRestaurantId = useRef<number | null>(null);

  // Unirse/abandonar sala del restaurante
  useEffect(() => {
    if (!enabled || !isConnected || !restaurantId) return;

    // Si cambió el restaurante, abandonar el anterior
    if (
      previousRestaurantId.current &&
      previousRestaurantId.current !== restaurantId
    ) {
      leaveRestaurant(previousRestaurantId.current);
    }

    // Unirse al nuevo restaurante
    joinRestaurant(restaurantId);
    previousRestaurantId.current = restaurantId;

    return () => {
      if (restaurantId) {
        leaveRestaurant(restaurantId);
      }
    };
  }, [enabled, isConnected, restaurantId, joinRestaurant, leaveRestaurant]);

  // Escuchar eventos del socket
  useEffect(() => {
    if (!socket || !enabled) return;

    const handleMetricsUpdate = (data: MetricsUpdatePayload) => {
      console.log("Received metrics update:", data);
      onMetricsUpdate?.(data.metrics);
    };

    const handleNewTransaction = (data: NewTransactionPayload) => {
      console.log("Received new transaction:", data);
      onNewTransaction?.(data.transaction);
    };

    const handleOrderUpdate = (data: OrderUpdatePayload) => {
      console.log("Received order update:", data);
      onOrderUpdate?.(data.order, data.action);
    };

    const handleChartUpdate = (data: ChartUpdatePayload) => {
      console.log("Received chart update:", data);
      onChartUpdate?.(data.dataPoint, data.granularity);
    };

    const handleFullRefresh = () => {
      console.log("Received full refresh signal");
      onFullRefresh?.();
    };

    socket.on("dashboard:metrics-update", handleMetricsUpdate);
    socket.on("dashboard:new-transaction", handleNewTransaction);
    socket.on("dashboard:order-update", handleOrderUpdate);
    socket.on("dashboard:chart-update", handleChartUpdate);
    socket.on("dashboard:full-refresh", handleFullRefresh);

    return () => {
      socket.off("dashboard:metrics-update", handleMetricsUpdate);
      socket.off("dashboard:new-transaction", handleNewTransaction);
      socket.off("dashboard:order-update", handleOrderUpdate);
      socket.off("dashboard:chart-update", handleChartUpdate);
      socket.off("dashboard:full-refresh", handleFullRefresh);
    };
  }, [
    socket,
    enabled,
    onMetricsUpdate,
    onNewTransaction,
    onOrderUpdate,
    onChartUpdate,
    onFullRefresh,
  ]);

  // Función para solicitar actualización manual
  const refreshData = useCallback(
    (dataType: "all" | "metrics" | "transactions" | "orders" = "all") => {
      if (restaurantId) {
        requestRefresh(restaurantId, dataType);
      }
    },
    [restaurantId, requestRefresh],
  );

  return {
    isSocketConnected: isConnected,
    refreshData,
    reconnectSocket: reconnect,
  };
}
