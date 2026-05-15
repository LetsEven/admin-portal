import React, { useState } from "react";
import {
  XIcon,
  DownloadIcon,
  RefreshCwIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  DollarSignIcon,
  UsersIcon,
  ShoppingCartIcon,
  CalendarIcon,
  StarIcon,
  InstagramIcon,
  FacebookIcon,
  GlobeIcon,
  ExternalLinkIcon,
  ClipboardIcon,
  CheckIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
// Mock data for the Pick N Go dashboard
const dailyOrdersData = [
  {
    name: "Lun",
    orders: 25,
    completed: 23,
  },
  {
    name: "Mar",
    orders: 22,
    completed: 20,
  },
  {
    name: "Mié",
    orders: 28,
    completed: 26,
  },
  {
    name: "Jue",
    orders: 30,
    completed: 29,
  },
  {
    name: "Vie",
    orders: 42,
    completed: 40,
  },
  {
    name: "Sáb",
    orders: 48,
    completed: 45,
  },
  {
    name: "Dom",
    orders: 35,
    completed: 32,
  },
];
const weeklyOrdersData = [
  {
    name: "Sem 1",
    orders: 180,
    completed: 168,
  },
  {
    name: "Sem 2",
    orders: 195,
    completed: 185,
  },
  {
    name: "Sem 3",
    orders: 210,
    completed: 200,
  },
  {
    name: "Sem 4",
    orders: 230,
    completed: 220,
  },
];
const monthlyOrdersData = [
  {
    name: "Ene",
    orders: 750,
    completed: 705,
  },
  {
    name: "Feb",
    orders: 820,
    completed: 780,
  },
  {
    name: "Mar",
    orders: 880,
    completed: 840,
  },
  {
    name: "Abr",
    orders: 950,
    completed: 910,
  },
  {
    name: "May",
    orders: 1020,
    completed: 980,
  },
  {
    name: "Jun",
    orders: 1100,
    completed: 1050,
  },
];
const pickupTimeData = [
  {
    name: "0-5 min",
    value: 10,
  },
  {
    name: "5-10 min",
    value: 25,
  },
  {
    name: "10-15 min",
    value: 45,
  },
  {
    name: "15-20 min",
    value: 15,
  },
  {
    name: "20+ min",
    value: 5,
  },
];
const channelData = [
  {
    name: "Instagram",
    value: 35,
  },
  {
    name: "Facebook",
    value: 25,
  },
  {
    name: "Sitio Web",
    value: 40,
  },
];
const topPickupTimesData = [
  {
    name: "12:00-13:00",
    value: 22,
  },
  {
    name: "13:00-14:00",
    value: 28,
  },
  {
    name: "18:00-19:00",
    value: 20,
  },
  {
    name: "19:00-20:00",
    value: 25,
  },
  {
    name: "20:00-21:00",
    value: 18,
  },
];
const feedbackData = [
  {
    name: "5 estrellas",
    value: 55,
  },
  {
    name: "4 estrellas",
    value: 30,
  },
  {
    name: "3 estrellas",
    value: 10,
  },
  {
    name: "2 estrellas",
    value: 3,
  },
  {
    name: "1 estrella",
    value: 2,
  },
];
const COLORS = ["#00C896", "#0EA5E9", "#FACC15", "#F97316", "#EF4444"];
const CHANNEL_COLORS = {
  Instagram: "#E1306C",
  Facebook: "#1877F2",
  "Sitio Web": "#10B981",
};
const PickNGoDashboardModal = ({ isOpen, onClose }) => {
  const [timeRange, setTimeRange] = useState("daily");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuLink = "https://even.link/pickngo-mx-qr";
  const handleRefreshData = () => {
    setIsLoading(true);
    // Simulate data refresh
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };
  const handleExportData = () => {
    alert("Datos exportados a CSV");
  };
  const handleCopyLink = () => {
    navigator.clipboard.writeText(menuLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const handleOpenDigitalMenu = () => {
    window.open("https://menu.even.com/pickup", "_blank");
  };
  // Select data based on time range
  const getChartData = () => {
    switch (timeRange) {
      case "weekly":
        return weeklyOrdersData;
      case "monthly":
        return monthlyOrdersData;
      default:
        return dailyOrdersData;
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black bg-opacity-35 backdrop-blur-[6px]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal container */}
      <div className="relative w-full max-w-6xl h-[90vh] mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-200 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-full mr-3">
              <ShoppingCartIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Dashboard: Pick N Go
              </h2>
              <p className="text-sm text-gray-500">
                Métricas y análisis del servicio de órdenes anticipadas
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Link field with copy button */}
            <div className="flex items-center bg-gray-100 rounded-md overflow-hidden border border-gray-200">
              <input
                type="text"
                value={menuLink}
                readOnly
                className="bg-transparent py-2 px-3 text-sm text-gray-700 focus:outline-none w-56"
              />
              <button
                onClick={handleCopyLink}
                className="p-2 bg-gray-200 hover:bg-gray-300 transition-colors duration-200 focus:outline-none"
                title="Copiar enlace"
              >
                {copied ? (
                  <CheckIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <ClipboardIcon className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>
            <button
              onClick={handleRefreshData}
              className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              disabled={isLoading}
            >
              <RefreshCwIcon
                className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={handleExportData}
              className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <DownloadIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
                onClick={() => setTimeRange("daily")}
                className={`px-4 py-2 text-sm font-medium rounded-l-md ${timeRange === "daily" ? "bg-green-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"} border border-gray-300 focus:z-10 focus:outline-none focus:ring-1 focus:ring-green-500`}
              >
                Diario
              </button>
              <button
                onClick={() => setTimeRange("weekly")}
                className={`px-4 py-2 text-sm font-medium ${timeRange === "weekly" ? "bg-green-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"} border-t border-b border-gray-300 focus:z-10 focus:outline-none focus:ring-1 focus:ring-green-500`}
              >
                Semanal
              </button>
              <button
                onClick={() => setTimeRange("monthly")}
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${timeRange === "monthly" ? "bg-green-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"} border border-gray-300 focus:z-10 focus:outline-none focus:ring-1 focus:ring-green-500`}
              >
                Mensual
              </button>
            </div>
          </div>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {/* Card 1 - Total Anticipated Orders */}
            <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 p-3 rounded-full">
                    <ShoppingCartIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Órdenes anticipadas
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          845
                        </div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                          <span className="sr-only">Incremento</span>
                          15.3%
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                <div className="text-sm">
                  <span className="font-medium text-green-600">
                    vs. mes anterior
                  </span>
                </div>
              </div>
            </div>
            {/* Card 2 - Pickup Success Rate */}
            <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
                    <UsersIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Tasa de recogida
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          95.8%
                        </div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                          <span className="sr-only">Incremento</span>
                          2.4%
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                <div className="text-sm">
                  <span className="font-medium text-green-600">exitosa</span>
                </div>
              </div>
            </div>
            {/* Card 3 - Average Order Value */}
            <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-amber-100 p-3 rounded-full">
                    <DollarSignIcon className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Ticket promedio
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          $175
                        </div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                          <span className="sr-only">Incremento</span>
                          8.2%
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                <div className="text-sm">
                  <span className="font-medium text-green-600">
                    órdenes anticipadas
                  </span>
                </div>
              </div>
            </div>
            {/* Card 4 - Average Pickup Time */}
            <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 p-3 rounded-full">
                    <ClockIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Tiempo de recogida
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          12.5 min
                        </div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                          <span className="sr-only">Reducción</span>
                          10.8%
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                <div className="text-sm">
                  <span className="font-medium text-green-600">
                    desde orden hasta recogida
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Orders Chart */}
            <div className="bg-white p-5 rounded-lg shadow border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Órdenes por{" "}
                  {timeRange === "daily"
                    ? "día"
                    : timeRange === "weekly"
                      ? "semana"
                      : "mes"}
                </h3>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <ArrowUpIcon className="h-3 w-3 mr-1" />
                    15.3%
                  </span>
                </div>
              </div>
              <div className="h-80">
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
                      formatter={(value) => [`${value} órdenes`, "Órdenes"]}
                    />
                    <Legend />
                    <Bar
                      dataKey="orders"
                      name="Órdenes creadas"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="completed"
                      name="Órdenes recogidas"
                      fill="#0EA5E9"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Pickup Time Chart */}
            <div className="bg-white p-5 rounded-lg shadow border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Tiempo entre creación y recogida
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pickupTimeData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
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
                      formatter={(value) => [`${value}%`, "Porcentaje"]}
                    />
                    <Legend />
                    <Bar
                      dataKey="value"
                      name="Porcentaje de órdenes"
                      fill="#8B5CF6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Tiempo promedio:{" "}
                  <span className="font-medium text-purple-600">
                    12.5 minutos
                  </span>
                </p>
              </div>
            </div>
          </div>
          {/* Ordering Channels and Top Pickup Times */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Ordering Channels */}
            <div className="bg-white p-5 rounded-lg shadow border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Canales utilizados para ordenar
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                      >
                        {channelData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHANNEL_COLORS[entry.name]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "0.5rem",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value) => [`${value}%`, "Porcentaje"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <InstagramIcon className="h-5 w-5 text-pink-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">
                          Instagram
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        35%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-pink-600 h-2.5 rounded-full"
                        style={{
                          width: "35%",
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <FacebookIcon className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">
                          Facebook
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        25%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{
                          width: "25%",
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <GlobeIcon className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">
                          Sitio Web
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        40%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-600 h-2.5 rounded-full"
                        style={{
                          width: "40%",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Top Pickup Times */}
            <div className="bg-white p-5 rounded-lg shadow border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Horarios de mayor recogida
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topPickupTimesData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
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
                      formatter={(value) => [`${value}%`, "Porcentaje"]}
                    />
                    <Legend />
                    <Bar
                      dataKey="value"
                      name="Porcentaje de recogidas"
                      fill="#FACC15"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Horario de mayor demanda:{" "}
                  <span className="font-medium text-amber-600">
                    13:00-14:00
                  </span>
                </p>
              </div>
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
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {feedbackData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.5rem",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      formatter={(value) => [`${value} clientes`, "Cantidad"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                      <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                      <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                      <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                      <StarIcon className="h-5 w-5 text-yellow-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      55%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full"
                      style={{
                        width: "55%",
                      }}
                    ></div>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                      <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                      <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                      <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                      <StarIcon className="h-5 w-5 text-gray-300" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      30%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full"
                      style={{
                        width: "30%",
                      }}
                    ></div>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                      <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                      <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                      <StarIcon className="h-5 w-5 text-gray-300 mr-1" />
                      <StarIcon className="h-5 w-5 text-gray-300" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      10%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-yellow-500 h-2.5 rounded-full"
                      style={{
                        width: "10%",
                      }}
                    ></div>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                      <StarIcon className="h-5 w-5 text-gray-300 mr-1" />
                      <StarIcon className="h-5 w-5 text-gray-300 mr-1" />
                      <StarIcon className="h-5 w-5 text-gray-300 mr-1" />
                      <StarIcon className="h-5 w-5 text-gray-300" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      3%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-orange-500 h-2.5 rounded-full"
                      style={{
                        width: "3%",
                      }}
                    ></div>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                      <StarIcon className="h-5 w-5 text-gray-300 mr-1" />
                      <StarIcon className="h-5 w-5 text-gray-300 mr-1" />
                      <StarIcon className="h-5 w-5 text-gray-300 mr-1" />
                      <StarIcon className="h-5 w-5 text-gray-300" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      2%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-red-500 h-2.5 rounded-full"
                      style={{
                        width: "2%",
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">4.3</div>
                  <div className="text-sm text-gray-500">
                    Calificación promedio
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Common Feedback */}
          <div className="bg-white p-5 rounded-lg shadow border border-gray-100 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Comentarios frecuentes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                  <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                  <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                  <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                  <StarIcon className="h-5 w-5 text-yellow-400" />
                </div>
                <p className="text-gray-700">
                  "¡Excelente servicio! Muy conveniente poder ordenar antes y
                  solo pasar a recoger."
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                  <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                  <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                  <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                  <StarIcon className="h-5 w-5 text-yellow-400" />
                </div>
                <p className="text-gray-700">
                  "Me encanta poder ordenar desde Instagram y pasar a recoger mi
                  comida sin esperar."
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                  <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                  <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                  <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                  <StarIcon className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-gray-700">
                  "El proceso es muy claro y la comida siempre está lista cuando
                  llego."
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                  <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                  <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                  <StarIcon className="h-5 w-5 text-gray-300 mr-1" />
                  <StarIcon className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-gray-700">
                  "A veces tengo que esperar unos minutos aunque haya ordenado
                  con anticipación."
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                  <StarIcon className="h-5 w-5 text-gray-300 mr-1" />
                  <StarIcon className="h-5 w-5 text-gray-300 mr-1" />
                  <StarIcon className="h-5 w-5 text-gray-300 mr-1" />
                  <StarIcon className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-gray-700">
                  "El sistema de pedidos en la web es un poco confuso, podría
                  ser más intuitivo."
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                  <StarIcon className="h-5 w-5 text-gray-300 mr-1" />
                  <StarIcon className="h-5 w-5 text-gray-300 mr-1" />
                  <StarIcon className="h-5 w-5 text-gray-300 mr-1" />
                  <StarIcon className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-gray-700">
                  "Mi pedido no estaba completo cuando llegué y tuve que esperar
                  a que lo prepararan."
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={handleExportData}
            className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <DownloadIcon className="h-5 w-5 mr-2 text-gray-400" />
            Exportar datos
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
export default PickNGoDashboardModal;
