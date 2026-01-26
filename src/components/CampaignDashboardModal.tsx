import React, { useState, useEffect } from "react";
import {
  XIcon,
  DownloadIcon,
  RefreshCwIcon,
  TagIcon,
  DollarSignIcon,
  PercentIcon,
  MailIcon,
  MessageSquareIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useCampaignsApi } from "../services/campaignsApi";
import { toast } from "react-hot-toast";

const COLORS = ["#00C896", "#0EA5E9", "#FACC15", "#F97316", "#EF4444"];

interface CampaignDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: any;
  restaurantId: number | null;
}

const CampaignDashboardModal: React.FC<CampaignDashboardModalProps> = ({ isOpen, onClose, campaign, restaurantId }) => {
  const [timeRange, setTimeRange] = useState("daily");
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const campaignsApi = useCampaignsApi();

  // Cargar estadísticas cuando se abre el modal
  useEffect(() => {
    if (isOpen && campaign?.id) {
      loadCampaignStats();
    }
  }, [isOpen, campaign?.id]);

  const loadCampaignStats = async () => {
    if (!campaign?.id || !restaurantId) return;

    try {
      setLoadingStats(true);
      const statsData = await campaignsApi.getCampaignStats(campaign.id, restaurantId);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading campaign stats:', error);
      toast.error('Error al cargar las estadísticas de la campaña');
      // Usar datos por defecto si falla
      setStats({
        total: 0,
        by_status: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          redeemed: 0,
          failed: 0
        },
        by_delivery_method: {}
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleRefreshData = async () => {
    setIsLoading(true);
    await loadCampaignStats();
    setIsLoading(false);
  };

  const handleExportData = () => {
    // Exportar los datos de estadísticas a CSV
    if (!stats) {
      toast.error('No hay datos para exportar');
      return;
    }

    const conversionRate = totalSent > 0 ? Math.round((totalRedeemed / totalSent) * 100) : 0;

    const csvContent = [
      ['Métrica', 'Valor'],
      ['Total enviados', stats.total || 0],
      ['Entregados', stats.by_status?.delivered || 0],
      ['Abiertos', stats.by_status?.opened || 0],
      ['Clicks', stats.by_status?.clicked || 0],
      ['Canjeados', stats.by_status?.redeemed || 0],
      ['Fallidos', stats.by_status?.failed || 0],
      ['Tasa de conversión', `${conversionRate}%`],
      ...Object.entries(stats.by_delivery_method || {}).map(([method, count]) => [
        `Canal: ${method}`,
        count
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campaign-stats-${campaign?.name || 'unknown'}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Datos exportados exitosamente');
  };

  // Generar datos para gráficos (simulados por ahora, se pueden obtener del backend más adelante)
  const generateDailyData = () => {
    if (!stats) return [];

    // Por ahora usar datos simulados distribuidos en la semana
    const totalRedeemed = stats.by_status?.redeemed || 0;
    const dailyAvg = Math.floor(totalRedeemed / 7);

    return [
      { name: "Lun", sent: dailyAvg * 2, redeemed: dailyAvg, revenue: dailyAvg * 100 },
      { name: "Mar", sent: dailyAvg * 2, redeemed: dailyAvg, revenue: dailyAvg * 100 },
      { name: "Mié", sent: dailyAvg * 2, redeemed: dailyAvg, revenue: dailyAvg * 100 },
      { name: "Jue", sent: dailyAvg * 2, redeemed: dailyAvg, revenue: dailyAvg * 100 },
      { name: "Vie", sent: dailyAvg * 2, redeemed: dailyAvg * 1.2, revenue: dailyAvg * 120 },
      { name: "Sáb", sent: dailyAvg * 2.5, redeemed: dailyAvg * 1.5, revenue: dailyAvg * 150 },
      { name: "Dom", sent: dailyAvg * 2, redeemed: dailyAvg * 1.2, revenue: dailyAvg * 120 },
    ];
  };

  const generateWeeklyData = () => {
    if (!stats) return [];

    const totalRedeemed = stats.by_status?.redeemed || 0;
    const weeklyAvg = Math.floor(totalRedeemed / 4);

    return [
      { name: "Sem 1", sent: weeklyAvg * 2, redeemed: weeklyAvg, revenue: weeklyAvg * 100 },
      { name: "Sem 2", sent: weeklyAvg * 2.2, redeemed: weeklyAvg * 1.1, revenue: weeklyAvg * 110 },
      { name: "Sem 3", sent: weeklyAvg * 2.4, redeemed: weeklyAvg * 1.2, revenue: weeklyAvg * 120 },
      { name: "Sem 4", sent: weeklyAvg * 2.6, redeemed: weeklyAvg * 1.3, revenue: weeklyAvg * 130 },
    ];
  };

  const generateMonthlyData = () => {
    if (!stats) return [];

    const totalRedeemed = stats.by_status?.redeemed || 0;
    const monthlyBase = Math.floor(totalRedeemed);

    return [
      { name: "Ene", sent: monthlyBase * 2, redeemed: monthlyBase * 0.8, revenue: monthlyBase * 80 },
      { name: "Feb", sent: monthlyBase * 2.2, redeemed: monthlyBase * 0.9, revenue: monthlyBase * 90 },
      { name: "Mar", sent: monthlyBase * 2.4, redeemed: monthlyBase, revenue: monthlyBase * 100 },
      { name: "Abr", sent: monthlyBase * 2.6, redeemed: monthlyBase * 1.1, revenue: monthlyBase * 110 },
      { name: "May", sent: monthlyBase * 2.8, redeemed: monthlyBase * 1.2, revenue: monthlyBase * 120 },
      { name: "Jun", sent: monthlyBase * 3, redeemed: monthlyBase * 1.3, revenue: monthlyBase * 130 },
    ];
  };

  const generateChannelData = () => {
    if (!stats || !stats.by_delivery_method) return [];

    return Object.entries(stats.by_delivery_method).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: value as number
    }));
  };

  // Select data based on time range
  const getChartData = () => {
    switch (timeRange) {
      case "weekly":
        return generateWeeklyData();
      case "monthly":
        return generateMonthlyData();
      default:
        return generateDailyData();
    }
  };

  // Calculate KPIs from real stats
  const totalSent = stats?.by_status?.sent || 0;
  const totalDelivered = stats?.by_status?.delivered || 0;
  const totalRedeemed = stats?.by_status?.redeemed || 0;
  const totalOpened = stats?.by_status?.opened || 0;
  const totalClicked = stats?.by_status?.clicked || 0;

  const conversionRate = totalSent > 0 ? Math.round((totalRedeemed / totalSent) * 100) : 0;
  const openRate = totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0;

  // Estimación de ingresos (basado en el reward_value de la campaña)
  const estimatedRevenue = campaign?.rewardValue
    ? totalRedeemed * campaign.rewardValue
    : totalRedeemed * 100; // Valor por defecto si no hay reward_value

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black bg-opacity-35 backdrop-blur-[6px]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal container */}
      <div className="relative w-full max-w-6xl h-[92vh] sm:h-[90vh] mx-auto bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-200 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-5 border-b border-gray-200">
          <div className="flex items-center min-w-0">
            <div className="p-1.5 sm:p-2 bg-custom-green-100 rounded-full mr-2 sm:mr-3 flex-shrink-0">
              <TagIcon className="h-5 w-5 sm:h-6 sm:w-6 text-custom-green-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-2xl font-semibold text-gray-900 truncate">
                <span className="hidden sm:inline">Dashboard: </span>{campaign?.name}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                <span className="hidden sm:inline">Métricas y análisis de la campaña de recompensas</span>
                <span className="sm:hidden">Métricas de campaña</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
            <button
              onClick={handleRefreshData}
              className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0EA5E9]"
              disabled={isLoading}
            >
              <RefreshCwIcon
                className={`h-4 w-4 sm:h-5 sm:w-5 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={handleExportData}
              className="hidden sm:block p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0EA5E9]"
            >
              <DownloadIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0EA5E9]"
              aria-label="Cerrar dashboard"
            >
              <XIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        {/* Dashboard content - scrollable area */}
        <div className="h-[calc(92vh-56px)] sm:h-[calc(90vh-76px)] overflow-y-auto p-3 sm:p-5">
          {loadingStats ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCwIcon className="h-8 w-8 sm:h-12 sm:w-12 text-custom-green-600 animate-spin mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-600">Cargando estadísticas...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Time range selector */}
              <div className="flex justify-end mb-4 sm:mb-6">
                <div className="inline-flex rounded-md shadow-sm">
                  <button
                    onClick={() => setTimeRange("daily")}
                    className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-l-md ${timeRange === "daily" ? "bg-custom-green-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"} border border-gray-300 focus:z-10 focus:outline-none focus:ring-1 focus:ring-custom-green-500`}
                  >
                    Diario
                  </button>
                  <button
                    onClick={() => setTimeRange("weekly")}
                    className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium ${timeRange === "weekly" ? "bg-custom-green-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"} border-t border-b border-gray-300 focus:z-10 focus:outline-none focus:ring-1 focus:ring-custom-green-500`}
                  >
                    Semanal
                  </button>
                  <button
                    onClick={() => setTimeRange("monthly")}
                    className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-r-md ${timeRange === "monthly" ? "bg-custom-green-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"} border border-gray-300 focus:z-10 focus:outline-none focus:ring-1 focus:ring-custom-green-500`}
                  >
                    Mensual
                  </button>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 mb-4 sm:mb-6">
                {/* Card 1 - Cupones enviados */}
                <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
                  <div className="p-3 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <div className="flex-shrink-0 bg-custom-green-100 p-2 sm:p-3 rounded-full w-fit mb-2 sm:mb-0">
                        <MailIcon className="h-5 w-5 sm:h-6 sm:w-6 text-custom-green-600" />
                      </div>
                      <div className="sm:ml-5 w-full sm:w-0 flex-1">
                        <dl>
                          <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                            Cupones enviados
                          </dt>
                          <dd className="flex items-baseline">
                            <div className="text-lg sm:text-2xl font-semibold text-gray-900">
                              {totalSent}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2 - Cupones canjeados */}
                <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
                  <div className="p-3 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <div className="flex-shrink-0 bg-blue-100 p-2 sm:p-3 rounded-full w-fit mb-2 sm:mb-0">
                        <TagIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                      <div className="sm:ml-5 w-full sm:w-0 flex-1">
                        <dl>
                          <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                            Cupones canjeados
                          </dt>
                          <dd className="flex items-baseline">
                            <div className="text-lg sm:text-2xl font-semibold text-gray-900">
                              {totalRedeemed}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3 - Tasa de conversión */}
                <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
                  <div className="p-3 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <div className="flex-shrink-0 bg-amber-100 p-2 sm:p-3 rounded-full w-fit mb-2 sm:mb-0">
                        <PercentIcon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                      </div>
                      <div className="sm:ml-5 w-full sm:w-0 flex-1">
                        <dl>
                          <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                            Tasa de conversión
                          </dt>
                          <dd className="flex items-baseline">
                            <div className="text-lg sm:text-2xl font-semibold text-gray-900">
                              {conversionRate}%
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 4 - Monto redimido */}
                <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
                  <div className="p-3 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <div className="flex-shrink-0 bg-green-100 p-2 sm:p-3 rounded-full w-fit mb-2 sm:mb-0">
                        <DollarSignIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                      </div>
                      <div className="sm:ml-5 w-full sm:w-0 flex-1">
                        <dl>
                          <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                            Valor redimido
                          </dt>
                          <dd className="flex items-baseline">
                            <div className="text-lg sm:text-2xl font-semibold text-gray-900">
                              ${estimatedRevenue.toLocaleString()}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* Canjes por periodo */}
                <div className="bg-white p-3 sm:p-5 rounded-md sm:rounded-lg shadow border border-gray-100">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <h3 className="text-sm sm:text-lg font-medium text-gray-900">
                      Canjes por{" "}
                      {timeRange === "daily"
                        ? "día"
                        : timeRange === "weekly"
                          ? "semana"
                          : "mes"}
                    </h3>
                  </div>
                  <div className="h-52 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getChartData()}
                        margin={{
                          top: 10,
                          right: 30,
                          left: 0,
                          bottom: 0,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                          formatter={(value) => [`${value} cupones`, "Canjes"]}
                        />
                        <Legend />
                        <Bar
                          dataKey="redeemed"
                          name="Cupones canjeados"
                          fill="#00C896"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Distribución por canal */}
                <div className="bg-white p-3 sm:p-5 rounded-md sm:rounded-lg shadow border border-gray-100">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <h3 className="text-sm sm:text-lg font-medium text-gray-900">
                      Distribución por canal
                    </h3>
                  </div>
                  <div className="h-52 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={generateChannelData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {generateChannelData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Estadísticas detalladas */}
              <div className="bg-white p-3 sm:p-5 rounded-md sm:rounded-lg shadow border border-gray-100 mb-4 sm:mb-6">
                <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                  Estadísticas detalladas
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div className="p-2.5 sm:p-4 bg-gray-50 rounded-md sm:rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-500">Total enviados</p>
                    <p className="text-lg sm:text-2xl font-semibold text-gray-900">{totalSent}</p>
                  </div>
                  <div className="p-2.5 sm:p-4 bg-gray-50 rounded-md sm:rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-500">Entregados</p>
                    <p className="text-lg sm:text-2xl font-semibold text-gray-900">{totalDelivered}</p>
                  </div>
                  <div className="p-2.5 sm:p-4 bg-gray-50 rounded-md sm:rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-500">Abiertos</p>
                    <p className="text-lg sm:text-2xl font-semibold text-gray-900">{totalOpened}</p>
                  </div>
                  <div className="p-2.5 sm:p-4 bg-gray-50 rounded-md sm:rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-500">Clicks</p>
                    <p className="text-lg sm:text-2xl font-semibold text-gray-900">{totalClicked}</p>
                  </div>
                  <div className="p-2.5 sm:p-4 bg-gray-50 rounded-md sm:rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-500">Canjeados</p>
                    <p className="text-lg sm:text-2xl font-semibold text-gray-900">{totalRedeemed}</p>
                  </div>
                  <div className="p-2.5 sm:p-4 bg-gray-50 rounded-md sm:rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-500">Tasa de apertura</p>
                    <p className="text-lg sm:text-2xl font-semibold text-gray-900">{openRate}%</p>
                  </div>
                </div>
              </div>

              {/* Campaign Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* Campaign Details */}
                <div className="bg-white p-3 sm:p-5 rounded-md sm:rounded-lg shadow border border-gray-100">
                  <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                    Detalles de la campaña
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-500">
                        Nombre de la campaña
                      </h4>
                      <p className="mt-1 text-sm sm:text-base font-medium text-gray-900">
                        {campaign?.name}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-1.5 sm:mb-2">
                        Templates asociados
                      </h4>
                      {campaign?.templates && campaign.templates.length > 0 ? (
                        <div className="space-y-2">
                          {campaign.templates.map((template: any, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              {template.template_type === 'sms' && (
                                <>
                                  <MessageSquareIcon className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                                    SMS: {template.template_data?.name || 'Template SMS'}
                                  </span>
                                </>
                              )}
                              {template.template_type === 'whatsapp' && (
                                <>
                                  <MessageSquareIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                                    WhatsApp: {template.template_data?.name || template.template_id}
                                  </span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs sm:text-sm text-gray-500">Sin templates asociados</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-500">
                        Segmento utilizado
                      </h4>
                      <p className="mt-1 text-sm sm:text-base font-medium text-gray-900">
                        {campaign?.segment || "Todos los clientes"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4 sm:space-x-6">
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-500">
                          Fecha inicio
                        </h4>
                        <p className="mt-1 text-sm sm:text-base font-medium text-gray-900">
                          {campaign?.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-500">
                          Fecha fin
                        </h4>
                        <p className="mt-1 text-sm sm:text-base font-medium text-gray-900">
                          {campaign?.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-500">Estado</h4>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 mt-1 rounded-full text-xs font-medium ${campaign?.status === "active" ? "bg-green-100 text-green-800" : campaign?.status === "paused" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {campaign?.status === "active"
                          ? "Activa"
                          : campaign?.status === "paused"
                            ? "Pausada"
                            : "Expirada"}
                      </span>
                    </div>
                    {campaign?.rewardValue && (
                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-gray-500">Valor de recompensa</h4>
                        <p className="mt-1 text-sm sm:text-base font-medium text-gray-900">
                          {campaign?.rewardType === 'discount_percentage' ? `${campaign.rewardValue}%` : `$${campaign.rewardValue}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Campaign by delivery method */}
                <div className="bg-white p-3 sm:p-5 rounded-md sm:rounded-lg shadow border border-gray-100">
                  <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                    Envíos por canal
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {Object.entries(stats?.by_delivery_method || {}).map(([method, count]) => (
                      <div key={method} className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-md sm:rounded-lg">
                        <div className="flex items-center">
                          {method === 'email' && <MailIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-1.5 sm:mr-2" />}
                          {method === 'sms' && <MessageSquareIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mr-1.5 sm:mr-2" />}
                          {method === 'whatsapp' && <MessageSquareIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mr-1.5 sm:mr-2" />}
                          <span className="text-xs sm:text-sm font-medium text-gray-900 capitalize">{method}</span>
                        </div>
                        <span className="text-sm sm:text-lg font-semibold text-gray-900">{count as number}</span>
                      </div>
                    ))}
                    {Object.keys(stats?.by_delivery_method || {}).length === 0 && (
                      <p className="text-xs sm:text-sm text-gray-500 text-center py-3 sm:py-4">No hay datos de canales disponibles</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        {/* Footer */}
        <div className="border-t border-gray-200 p-3 sm:p-4 flex justify-end space-x-2 sm:space-x-3">
          <button
            onClick={handleExportData}
            className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500"
            disabled={!stats}
          >
            <DownloadIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-gray-400" />
            <span className="hidden sm:inline">Exportar datos</span>
            <span className="sm:hidden">Exportar</span>
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-custom-green-600 hover:bg-custom-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
export default CampaignDashboardModal;