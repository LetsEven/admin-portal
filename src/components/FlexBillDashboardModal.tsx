import React, { useState, useEffect } from 'react';
import { XIcon, DownloadIcon, RefreshCwIcon, ArrowUpIcon, ArrowDownIcon, UsersIcon, DollarSignIcon, ClockIcon, SplitIcon, StarIcon } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useFlexBillDashboard } from '../hooks/useFlexBillDashboard';
import { useAdminPortalApi } from '../services/adminPortalApi';

// Colores para los gráficos
const COLORS = ['#00C896', '#0EA5E9', '#FACC15', '#F97316', '#EF4444'];

// Datos de feedback (mantenemos mock por ahora hasta crear tabla de reviews)
const feedbackData = [{
  name: '5 estrellas',
  value: 60
}, {
  name: '4 estrellas',
  value: 25
}, {
  name: '3 estrellas',
  value: 10
}, {
  name: '2 estrellas',
  value: 3
}, {
  name: '1 estrella',
  value: 2
}];

interface FlexBillDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FlexBillDashboardModal: React.FC<FlexBillDashboardModalProps> = ({
  isOpen,
  onClose
}) => {
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const adminPortalApi = useAdminPortalApi();

  // Hook personalizado para datos de FlexBill
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
    updateTimeRange,
    timeRange
  } = useFlexBillDashboard(restaurantId);

  // Obtener restaurant ID al abrir el modal
  useEffect(() => {
    if (isOpen && !restaurantId) {
      adminPortalApi.getRestaurant()
        .then((restaurant) => {
          setRestaurantId(restaurant.id);
        })
        .catch((error) => {
          console.error('Error fetching restaurant:', error);
        });
    }
  }, [isOpen, restaurantId, adminPortalApi]);

  const handleRefreshData = async () => {
    await refetch();
  };

  const handleExportData = () => {
    alert('Datos exportados a CSV');
  };

  // Convertir datos de analytics a formato de gráficos
  const getPaymentTypeData = () => {

    if (!dashboardData?.payment_analytics?.payment_type_distribution) {
      return [
        { name: 'Pago dividido', value: 0 },
        { name: 'Pago único', value: 0 }
      ];
    }

    const { split, single } = dashboardData.payment_analytics.payment_type_distribution;
    const result = [
      { name: 'Pago dividido', value: split },
      { name: 'Pago único', value: single }
    ];

    return result;
  };

  const getPaymentTimeData = () => {
    if (!dashboardData?.payment_analytics?.payment_time_distribution) {
      return [
        { name: '0-5 min', value: 25 },
        { name: '5-10 min', value: 40 },
        { name: '10-15 min', value: 20 },
        { name: '15-20 min', value: 10 },
        { name: '20+ min', value: 5 }
      ];
    }

    const distribution = dashboardData.payment_analytics.payment_time_distribution;
    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value: Number(value)
    }));
  };

  if (!isOpen) return null;

  // Loading state
  if (isLoading && !dashboardData) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-35 backdrop-blur-[6px]" onClick={onClose} aria-hidden="true" />
        <div className="relative w-full max-w-6xl h-[90vh] mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-200 ease-out flex items-center justify-center">
          <div className="text-center">
            <RefreshCwIcon className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando datos de FlexBill...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-35 backdrop-blur-[6px]" onClick={onClose} aria-hidden="true" />
        <div className="relative w-full max-w-6xl h-[90vh] mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-200 ease-out flex items-center justify-center">
          <div className="text-center">
            <XIcon className="h-8 w-8 text-red-600 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Error al cargar datos: {error}</p>
            <button
              onClick={handleRefreshData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const metrics = dashboardData?.metrics;
  const dinersChartData = dashboardData?.chart_data || [];
  const sharedOrdersChartData = dashboardData?.shared_orders_chart_data || [];
  const tableUsageData = dashboardData?.table_usage || [];
  const paymentTypeData = getPaymentTypeData();
  const paymentTimeData = getPaymentTimeData();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="fixed inset-0 bg-black bg-opacity-35 backdrop-blur-[6px]" onClick={onClose} aria-hidden="true" />

      {/* Modal container */}
      <div className="relative w-full max-w-6xl h-[90vh] mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-200 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-full mr-3">
              <SplitIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Dashboard: Flex Bill
                {dashboardData?.success === false && (
                  <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    Datos simulados
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-500">
                Métricas y análisis del servicio de cuentas compartidas y pagos divididos
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefreshData}
              className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <RefreshCwIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExportData}
              className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <DownloadIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Cerrar dashboard"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Dashboard content - scrollable area */}
        <div className="h-[calc(90vh-76px)] overflow-y-auto p-5">
          {/* Time range selector */}
          <div className="flex justify-end mb-6">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => updateTimeRange('daily')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                  timeRange === 'daily'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-300 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              >
                Diario
              </button>
              <button
                onClick={() => updateTimeRange('weekly')}
                className={`px-4 py-2 text-sm font-medium ${
                  timeRange === 'weekly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border-t border-b border-gray-300 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              >
                Semanal
              </button>
              <button
                onClick={() => updateTimeRange('monthly')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                  timeRange === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-300 focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              >
                Mensual
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {/* Card 1 - Total Shared Orders */}
            <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
                    <SplitIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Órdenes compartidas
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {metrics?.shared_orders?.toLocaleString() || '0'}
                        </div>
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${(metrics?.growth_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(metrics?.growth_percentage || 0) >= 0 ? (
                            <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                          )}
                          <span className="sr-only">{(metrics?.growth_percentage || 0) >= 0 ? 'Incremento' : 'Disminución'}</span>
                          {Math.abs(metrics?.growth_percentage || 0).toFixed(1)}%
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              {/* <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                <div className="text-sm">
                  <span className="font-medium text-blue-600">
                    vs. mes anterior
                  </span>
                </div>
              </div> */}
            </div>

            {/* Card 2 - Average Diners Per Account */}
            <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 p-3 rounded-full">
                    <UsersIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Comensales por cuenta
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {metrics?.avg_diners_per_order?.toFixed(1)}
                        </div>
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${(metrics?.diners_growth_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(metrics?.diners_growth_percentage || 0) >= 0 ? (
                            <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                          )}
                          <span className="sr-only">{(metrics?.diners_growth_percentage || 0) >= 0 ? 'Incremento' : 'Disminución'}</span>
                          {Math.abs(metrics?.diners_growth_percentage || 0).toFixed(1)}%
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                <div className="text-sm">
                  <span className="font-medium text-blue-600">promedio</span>
                </div>
              </div>
            </div>

            {/* Card 3 - Average Ticket Per Diner */}
            <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-amber-100 p-3 rounded-full">
                    <DollarSignIcon className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Ticket por comensal
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          ${metrics?.avg_ticket_per_diner?.toFixed(0) || '185'}
                        </div>
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${(metrics?.ticket_growth_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(metrics?.ticket_growth_percentage || 0) >= 0 ? (
                            <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                          )}
                          <span className="sr-only">{(metrics?.ticket_growth_percentage || 0) >= 0 ? 'Incremento' : 'Disminución'}</span>
                          {Math.abs(metrics?.ticket_growth_percentage || 0).toFixed(1)}%
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                <div className="text-sm">
                  <span className="font-medium text-blue-600">promedio</span>
                </div>
              </div>
            </div>

            {/* Card 4 - Average Payment Time */}
            <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 p-3 rounded-full">
                    <ClockIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Tiempo de pago
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {metrics?.avg_payment_time?.toFixed(1) || '8.5'} min
                        </div>
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${(metrics?.payment_time_growth_percentage || 0) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(metrics?.payment_time_growth_percentage || 0) <= 0 ? (
                            <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                          )}
                          <span className="sr-only">{(metrics?.payment_time_growth_percentage || 0) <= 0 ? 'Reducción' : 'Incremento'}</span>
                          {Math.abs(metrics?.payment_time_growth_percentage || 0).toFixed(1)}%
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                <div className="text-sm">
                  <span className="font-medium text-blue-600">promedio</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Shared Orders Chart */}
            <div className="bg-white p-5 rounded-lg shadow border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Órdenes compartidas por{' '}
                  {timeRange === 'daily' ? 'día' : timeRange === 'weekly' ? 'semana' : 'mes'}
                </h3>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(metrics?.growth_percentage || 0) >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {(metrics?.growth_percentage || 0) >= 0 ? (
                      <ArrowUpIcon className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(metrics?.growth_percentage || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sharedOrdersChartData} margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0
                  }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value) => [`${value} órdenes`, 'Órdenes']}
                    />
                    <Legend />
                    <Bar
                      dataKey="orders"
                      name="Órdenes compartidas"
                      fill="#0EA5E9"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Diners Chart */}
            <div className="bg-white p-5 rounded-lg shadow border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Comensales por{' '}
                  {timeRange === 'daily' ? 'día' : timeRange === 'weekly' ? 'semana' : 'mes'}
                </h3>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(metrics?.diners_growth_percentage || 0) >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {(metrics?.diners_growth_percentage || 0) >= 0 ? (
                      <ArrowUpIcon className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(metrics?.diners_growth_percentage || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dinersChartData} margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0
                  }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value) => [`${value} comensales`, 'Comensales']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="diners"
                      name="Comensales"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Payment Type and Time Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Payment Type Chart */}
            <div className="bg-white p-5 rounded-lg shadow border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tipo de pago
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        <Cell fill="#0EA5E9" />
                        <Cell fill="#94A3B8" />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value) => [`${value}%`, 'Porcentaje']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Pago dividido
                      </span>
                      <span className="text-sm font-medium text-blue-600">
                        {paymentTypeData.find(item => item.name === 'Pago dividido')?.value || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${paymentTypeData.find(item => item.name === 'Pago dividido')?.value || 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Pago único
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        {paymentTypeData.find(item => item.name === 'Pago único')?.value || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{ width: `${paymentTypeData.find(item => item.name === 'Pago único')?.value || 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-500">
                      {(() => {
                        const splitValue = paymentTypeData.find(item => item.name === 'Pago dividido')?.value || 0;
                        const singleValue = paymentTypeData.find(item => item.name === 'Pago único')?.value || 0;

                        if (splitValue === 0 && singleValue === 0) {
                          return 'No hay datos de pagos disponibles para este período';
                        } else if (splitValue > singleValue) {
                          return `El ${splitValue}% de los clientes prefiere dividir la cuenta entre los comensales`;
                        } else {
                          return `El ${singleValue}% de los clientes prefiere pago único`;
                        }
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Time Chart */}
            <div className="bg-white p-5 rounded-lg shadow border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tiempo de pago desde primer escaneo
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentTimeData} margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5
                  }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value) => [`${value}%`, 'Porcentaje']}
                    />
                    <Legend />
                    <Bar
                      dataKey="value"
                      name="Porcentaje de órdenes"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Tiempo promedio de pago:{' '}
                  <span className="font-medium text-green-600">
                    {metrics?.avg_payment_time?.toFixed(1) || '8.5'} minutos
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Table Usage Chart */}
          <div className="bg-white p-5 rounded-lg shadow border border-gray-100 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Uso por mesa
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tableUsageData} margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5
                }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [`${value} usos`, 'Usos']}
                  />
                  <Legend />
                  <Bar
                    dataKey="value"
                    name="Usos de Flex Bill"
                    fill="#FACC15"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Total de mesas que utilizan Flex Bill:{' '}
                <span className="font-medium text-blue-600">{tableUsageData.length} mesas</span>
              </p>
            </div>
          </div>

          {/* Customer Feedback */}
          <div className="bg-white p-5 rounded-lg shadow border border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Satisfacción del cliente
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={feedbackData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {feedbackData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value) => [`${value} clientes`, 'Cantidad']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center">
                {feedbackData.map((item, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, starIndex) => (
                          <StarIcon
                            key={starIndex}
                            className={`h-5 w-5 mr-1 ${
                              starIndex < (5 - index) ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {item.value}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          index === 0 ? 'bg-green-500' :
                          index === 1 ? 'bg-blue-500' :
                          index === 2 ? 'bg-yellow-500' :
                          index === 3 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">4.3</div>
                  <div className="text-sm text-gray-500">
                    Calificación promedio
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={handleExportData}
            className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <DownloadIcon className="h-5 w-5 mr-2 text-gray-400" />
            Exportar datos
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlexBillDashboardModal;