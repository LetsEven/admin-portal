import { useState, useEffect } from 'react';
import { useFlexBillApi, FlexBillFilters, FlexBillDashboardData } from '../services/flexBillService';

interface UseFlexBillDashboardResult {
  data: FlexBillDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  updateTimeRange: (timeRange: 'daily' | 'weekly' | 'monthly') => void;
  timeRange: 'daily' | 'weekly' | 'monthly';
}

export function useFlexBillDashboard(
  restaurantId: number | null,
  initialTimeRange: 'daily' | 'weekly' | 'monthly' = 'daily'
): UseFlexBillDashboardResult {
  const [data, setData] = useState<FlexBillDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(initialTimeRange);

  const flexBillApi = useFlexBillApi();

  const fetchData = async () => {
    if (!restaurantId) {
      setError('Restaurant ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const filters: FlexBillFilters = {
        restaurant_id: restaurantId,
        time_range: timeRange,
      };

      const [metrics, dinersChartData, sharedOrdersChartData, paymentAnalytics, tableUsage] = await Promise.all([
        flexBillApi.getMetrics(filters),
        flexBillApi.getDinersChartData(filters),
        flexBillApi.getChartData(filters),
        flexBillApi.getPaymentAnalytics({ restaurant_id: restaurantId }),
        flexBillApi.getTableUsage({ restaurant_id: restaurantId })
      ]);

      const dashboardData: FlexBillDashboardData = {
        success: true,
        metrics,
        chart_data: dinersChartData,
        shared_orders_chart_data: sharedOrdersChartData,
        payment_analytics: paymentAnalytics,
        table_usage: tableUsage,
        timestamp: new Date().toISOString()
      };

      setData(dashboardData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('Error fetching FlexBill dashboard data:', err);

      // En caso de error, usar datos fallback
      setData({
        success: false,
        metrics: {
          shared_orders: 965,
          avg_diners_per_order: 4.2,
          avg_ticket_per_diner: 185,
          avg_payment_time: 8.5,
          total_diners: 4053,
          growth_percentage: 14.2
        },
        chart_data: [
          { name: 'Lun', orders: 32, diners: 128 },
          { name: 'Mar', orders: 28, diners: 98 },
          { name: 'Mié', orders: 34, diners: 119 },
          { name: 'Jue', orders: 40, diners: 160 },
          { name: 'Vie', orders: 58, diners: 232 },
          { name: 'Sáb', orders: 65, diners: 325 },
          { name: 'Dom', orders: 52, diners: 208 }
        ],
        payment_analytics: {
          payment_type_distribution: { split: 65, single: 35 },
          payment_time_distribution: {
            '0-5 min': 25,
            '5-10 min': 40,
            '10-15 min': 20,
            '15-20 min': 10,
            '20+ min': 5
          },
          avg_payment_time: 8.5,
          total_transactions: 965
        },
        table_usage: [
          { name: 'Mesa 1', table_number: 1, value: 28, usage_percentage: 70 },
          { name: 'Mesa 2', table_number: 2, value: 32, usage_percentage: 80 },
          { name: 'Mesa 3', table_number: 3, value: 45, usage_percentage: 90 },
          { name: 'Mesa 4', table_number: 4, value: 22, usage_percentage: 55 },
          { name: 'Mesa 5', table_number: 5, value: 56, usage_percentage: 95 },
          { name: 'Mesa 6', table_number: 6, value: 38, usage_percentage: 85 },
          { name: 'Mesa 7', table_number: 7, value: 41, usage_percentage: 88 },
          { name: 'Mesa 8', table_number: 8, value: 30, usage_percentage: 75 }
        ],
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Effect para cargar datos cuando cambia restaurantId o timeRange
  useEffect(() => {
    if (restaurantId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, timeRange]);

  const refetch = () => {
    fetchData();
  };

  const updateTimeRange = (newTimeRange: 'daily' | 'weekly' | 'monthly') => {
    setTimeRange(newTimeRange);
  };

  return {
    data,
    isLoading,
    error,
    refetch,
    updateTimeRange,
    timeRange,
  };
}