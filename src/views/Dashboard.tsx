import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BarChart2Icon,
  UsersIcon,
  ShoppingBagIcon,
  ChevronDownIcon,
  MapPinIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  DollarSignIcon,
  UserIcon,
  ShoppingCartIcon,
  RotateCcwIcon,
  CrownIcon,
  InfoIcon,
  NotepadText,
  TrendingUpIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Joyride, { STATUS } from "react-joyride";
import {
  useAnalytics,
  type AnalyticsFilters,
  type RecentTransaction,
  type ActiveOrder,
  type CustomField,
  type CustomFieldOption,
} from "../hooks/useAnalytics";
import { useRealtimeDashboard } from "../hooks/useRealtimeDashboard";
import { useRestaurant } from "../hooks/useRestaurant";
import { useAdminPortalApi, Branch } from "../services/adminPortalApi";
import { useUser, useAuth } from "@clerk/nextjs";
import {
  useOnboarding,
  joyrideTheme,
  joyrideResponsiveCSS,
} from "../hooks/useOnboarding";
import toast from "react-hot-toast";

// Estilos CSS en línea para los sliders
const sliderStyles = `
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #10b981;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  input[type="range"]::-moz-range-thumb {
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #10b981;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

// Opciones de filtros
const opcionesGenero = [
  { id: "todos", label: "Todos" },
  { id: "hombre", label: "Hombre" }, // ✅ Corregido: envía 'hombre'
  { id: "mujer", label: "Mujer" }, // ✅ Corregido: envía 'mujer'
];

const opcionesEdad = [
  { id: "todos", label: "Todos" },
  { id: "14-17", label: "14 - 17" },
  { id: "18-25", label: "18 - 25" },
  { id: "26-35", label: "26 - 35" },
  { id: "36-45", label: "36 - 45" },
  { id: "46+", label: "46 +" },
];

const opcionesGranularidad = [
  { id: "hora", label: "Hora" },
  { id: "dia", label: "Día" },
  { id: "mes", label: "Mes" },
  { id: "ano", label: "Año" },
];

// Opciones de servicios para el filtro
const opcionesServicio = [
  { id: "todos", label: "Todos" },
  { id: "flex-bill", label: "Flex Bill" },
  { id: "pick-n-go", label: "Pick & Go" },
  { id: "tap-order-pay", label: "Tap Order & Pay" },
  { id: "tap-pay", label: "Tap & Pay" },
  { id: "room-service", label: "Room Service" },
];

// Tipo para sucursal seleccionada (compatible con Branch y estado inicial)
interface SucursalSeleccionada {
  id: string | null;
  name: string;
  active: boolean;
}

// Esta será reemplazada por datos reales del hook
const sucursalesDefault: SucursalSeleccionada[] = [
  {
    id: null, // ✅ CAMBIO: null en lugar de 1 para evitar UUID inválido
    name: "Cargando...",
    active: true,
  },
];

const CustomTooltip = ({
  active,
  payload,
  label,
  granularidad,
  mesSeleccionado,
  diaSeleccionado,
}: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];

    const obtenerTextoPeriodo = () => {
      switch (granularidad) {
        case "hora":
          if (diaSeleccionado) {
            const [dia, mes, año] = diaSeleccionado.split("/");
            const fechaSeleccionada = new Date(
              parseInt(año),
              parseInt(mes) - 1,
              parseInt(dia),
            );
            const fechaFormateada = fechaSeleccionada.toLocaleDateString(
              "es-ES",
              {
                day: "numeric",
                month: "long",
                year: "numeric",
              },
            );
            return `${label.toString().padStart(2, "0")}:00 del ${fechaFormateada}`;
          } else {
            const mesNombre = mesSeleccionado.toLocaleDateString("es-ES", {
              month: "long",
              year: "numeric",
            });
            return `${label.toString().padStart(2, "0")}:00 del ${label} de ${mesNombre}`;
          }
        case "dia":
          const mesNombreDia = mesSeleccionado.toLocaleDateString("es-ES", {
            month: "long",
            year: "numeric",
          });
          return `Día ${label} de ${mesNombreDia}`;
        case "mes":
          return `${label} ${mesSeleccionado.getFullYear()}`;
        case "ano":
          return `Año ${label}`;
        default:
          return `Día ${label}`;
      }
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[200px]">
        <div className="text-sm font-medium text-gray-900 mb-2">
          {obtenerTextoPeriodo()}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Ingresos:</span>
          <span className="text-lg font-bold text-custom-green-600">
            ${data.value.toLocaleString()}
          </span>
        </div>
        {/* <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Sucursal Centro
          </div>
        </div> */}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  // Hook para analytics
  const {
    dashboardData,
    allServicesData,
    userRestaurants,
    isLoading,
    isLoadingAllServices,
    isLoadingTransactions,
    transactionsPagination,
    recentTransactions,
    error,
    getDashboardMetricsAllServices,
    getActiveOrders,
    getAllSellingItems,
    sellingItemsRanking,
    isLoadingRanking,
    getRecentTransactions,
    getOrderItems,
    updateDishDeliveryStatus,
    updatePickAndGoOrderCookingStatus,
  } = useAnalytics();

  // Hook para onboarding
  const {
    run: runTour,
    steps: tourSteps,
    stepIndex: tourStepIndex,
    handleJoyrideCallback,
    startOnboarding,
    skipOnboarding,
    resetOnboarding,
  } = useOnboarding();

  const { restaurant } = useRestaurant();

  // Estado para disparar refresh desde eventos de socket
  const [socketRefreshTrigger, setSocketRefreshTrigger] = useState(0);
  const socketDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sucursalSeleccionada, setSucursalSeleccionada] =
    useState<SucursalSeleccionada>(sucursalesDefault[0]);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  // Estados para branches/sucursales
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [pedidoSeleccionado, setPedidoSeleccionado] =
    useState<RecentTransaction | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [itemsPedido, setItemsPedido] = useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Estados para modal de cambio de estado de platillo
  const [itemSeleccionado, setItemSeleccionado] = useState<any | null>(null);
  const [mostrarModalEstado, setMostrarModalEstado] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [nuevoEstadoSeleccionado, setNuevoEstadoSeleccionado] = useState<
    string | null
  >(null);

  // Estados para filtros
  const [generoSeleccionado, setGeneroSeleccionado] = useState(
    opcionesGenero[0],
  );
  const [edadSeleccionada, setEdadSeleccionada] = useState(opcionesEdad[0]);
  const [dropdownGeneroAbierto, setDropdownGeneroAbierto] = useState(false);
  const [dropdownEdadAbierto, setDropdownEdadAbierto] = useState(false);

  // Estados para granularidad
  const [granularidadSeleccionada, setGranularidadSeleccionada] = useState(
    opcionesGranularidad[1],
  ); // Día por defecto
  const [dropdownGranularidadAbierto, setDropdownGranularidadAbierto] =
    useState(false);

  const [mostrarRankingModal, setMostrarRankingModal] = useState(false);
  const [lastUsedFilters, setLastUsedFilters] = useState<any>(null);

  // Estado para controlar toasts
  const [previousLoadingState, setPreviousLoadingState] = useState(false);

  // Opciones de filtro de fecha para transacciones (independiente)
  const opcionesFechaTransacciones = [
    { id: "hoy", label: "Hoy" },
    { id: "7dias", label: "Últimos 7 días" },
    { id: "mes", label: "Último mes" },
    { id: "ano", label: "Último año" },
  ];
  const [filtroFechaTransacciones, setFiltroFechaTransacciones] = useState(
    opcionesFechaTransacciones[0],
  );
  const [
    dropdownFechaTransaccionesAbierto,
    setDropdownFechaTransaccionesAbierto,
  ] = useState(false);
  const [paginaTransacciones, setPaginaTransacciones] = useState(1);
  const ITEMS_POR_PAGINA = 5;

  const fechaActual = new Date();
  const diaActual = fechaActual.getDate().toString().padStart(2, "0");
  const mesActualStr = (fechaActual.getMonth() + 1).toString().padStart(2, "0");
  const añoActual = fechaActual.getFullYear();
  const [diaSeleccionado, setDiaSeleccionado] = useState(
    `${diaActual}/${mesActualStr}/${añoActual}`,
  );
  const [rangoHoras, setRangoHoras] = useState([0, 23]);

  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const [mesActual, setMesActual] = useState(new Date()); // Fecha actual del sistema
  const [diaSeleccionadoCalendario, setDiaSeleccionadoCalendario] = useState(
    new Date().getDate(),
  );
  const [mesSeleccionadoParaGrafico, setMesSeleccionadoParaGrafico] = useState(
    new Date(),
  ); // Para granularidades que no sean Hora - Usa fecha actual
  const [selectorMesAbierto, setSelectorMesAbierto] = useState(false);

  const [selectorAnoAbierto, setSelectorAnoAbierto] = useState(false);
  const [anoSeleccionado, setAnoSeleccionado] = useState(
    new Date().getFullYear(),
  );
  const [rangoAnosInicio, setRangoAnosInicio] = useState(2017);

  // Estados para verificar servicio FlexBill
  const [isFlexBillEnabled, setIsFlexBillEnabled] = useState(false);
  const [servicesLoaded, setServicesLoaded] = useState(false);

  // Estados para filtro de servicios (todos los servicios)
  const [servicioSeleccionado, setServicioSeleccionado] = useState(
    opcionesServicio[0],
  ); // "todos" por defecto
  const [dropdownServicioAbierto, setDropdownServicioAbierto] = useState(false);
  const [enabledServices, setEnabledServices] = useState<string[]>([]); // Servicios habilitados del cliente

  // Hooks necesarios para verificar servicios
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const adminPortalApi = useAdminPortalApi();

  const datosUnificados = allServicesData
    ? {
        metricas: {
          ventasTotales: allServicesData.metricas.ventasTotales,
          propinasTotales: allServicesData.metricas.propinasTotales,
          ordenesActivas: allServicesData.metricas.ordenesActivas || 0,
          totalOrdenes: allServicesData.metricas.totalOrdenes, // Mesas/órdenes atendidas
          totalPedidos: allServicesData.metricas.totalPedidos, // Comensales individuales (difiere en FlexBill)
          pedidos: allServicesData.metricas.totalPedidos, // Alias para compatibilidad
          ticketPromedio: allServicesData.metricas.ticketPromedio,
        },
        grafico: allServicesData.grafico,
        articulo_mas_vendido: allServicesData.articulo_mas_vendido,
        tiempo_promedio_mesa: dashboardData?.tiempo_promedio_mesa || null, // No disponible en allServices
        desglose_por_servicio: allServicesData.desglose_por_servicio,
      }
    : dashboardData;

  const cambiarSucursal = (sucursal: SucursalSeleccionada) => {
    setSucursalSeleccionada(sucursal);
    setDropdownAbierto(false);
    // ✅ Ahora usamos el restaurant_id del usuario, no el branch UUID
    const restaurantId =
      userRestaurants.length > 0 ? userRestaurants[0]?.id : null;
    // ✅ CORREGIR: Pasar la sucursal directamente para evitar problema de timing
    cargarDatosDashboard(restaurantId, {}, null, null, sucursal);
  };

  const formatearFechaLocal = (fecha: Date): string => {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    const horas = String(fecha.getHours()).padStart(2, "0");
    const minutos = String(fecha.getMinutes()).padStart(2, "0");
    const segundos = String(fecha.getSeconds()).padStart(2, "0");
    const milisegundos = String(fecha.getMilliseconds()).padStart(3, "0");

    return `${año}-${mes}-${dia}T${horas}:${minutos}:${segundos}.${milisegundos}`;
  };

  // Función para cargar datos del dashboard
  const cargarDatosDashboard = (
    restaurantId: number | null = null,
    customFilters: any = {},
    customRangoHoras: number[] | null = null,
    customDiaSeleccionado: string | null = null,
    customSucursal: any = null,
    customServicio: any = null,
  ) => {
    const currentGranularity =
      customFilters.granularity || granularidadSeleccionada.id;
    let startDate = null;
    let endDate = null;

    // Si la granularidad es "hora", usar fecha y rango de horas específicos
    if (currentGranularity === "hora") {
      const rangoActual = customRangoHoras || rangoHoras;

      const fechaAUsar = customDiaSeleccionado || diaSeleccionado;

      const [dia, mes, año] = fechaAUsar.split("/");
      const fechaBase = new Date(
        parseInt(año),
        parseInt(mes) - 1,
        parseInt(dia),
      );

      const fechaBaseISO = `${año}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
      const horaInicioStr = rangoActual[0].toString().padStart(2, "0");
      const startDateISO = `${fechaBaseISO}T${horaInicioStr}:00:00.000`;
      startDate = new Date(startDateISO);

      endDate = new Date(fechaBase);
      if (rangoActual[1] < rangoActual[0]) {
        endDate.setDate(endDate.getDate() + 1);
      }
      endDate.setHours(rangoActual[1], 59, 59, 999);
    }
    // Si la granularidad es "día", usar el mes seleccionado
    else if (currentGranularity === "dia") {
      const fechaMes = mesSeleccionadoParaGrafico;

      // Primer día del mes a las 00:00:00
      startDate = new Date(
        fechaMes.getFullYear(),
        fechaMes.getMonth(),
        1,
        0,
        0,
        0,
        0,
      );

      // Último día del mes a las 23:59:59.999
      endDate = new Date(
        fechaMes.getFullYear(),
        fechaMes.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
    }
    // Si la granularidad es "mes", usar todo el año seleccionado
    else if (currentGranularity === "mes") {
      const año = mesSeleccionadoParaGrafico.getFullYear();

      // Primer día del año a las 00:00:00
      startDate = new Date(año, 0, 1, 0, 0, 0, 0);

      // Último día del año a las 23:59:59.999
      endDate = new Date(año, 11, 31, 23, 59, 59, 999);
    }

    // ✅ CORREGIR: Usar la sucursal pasada como parámetro o la del estado
    const sucursalAUtilizar = customSucursal || sucursalSeleccionada;

    const filtros: AnalyticsFilters = {
      restaurant_id: restaurantId,
      branch_id: sucursalAUtilizar?.id, // ✅ CORREGIDO: Usar la sucursal correcta
      start_date: startDate ? formatearFechaLocal(startDate) : null,
      end_date: endDate ? formatearFechaLocal(endDate) : null,
      gender: customFilters.gender || (generoSeleccionado.id as any),
      age_range: customFilters.age_range || (edadSeleccionada.id as any),
      granularity: currentGranularity as any,
    };

    console.log(
      "🔍 [cargarDatosDashboard] sucursalSeleccionada:",
      sucursalSeleccionada,
    );
    console.log("🔍 [cargarDatosDashboard] customSucursal:", customSucursal);
    console.log(
      "🔍 [cargarDatosDashboard] sucursalAUtilizar:",
      sucursalAUtilizar,
    );
    console.log("🔍 [cargarDatosDashboard] filtros enviados:", filtros);

    // Determinar qué servicio usar
    const servicioAUtilizar = customServicio || servicioSeleccionado;
    const serviceType =
      servicioAUtilizar?.id === "todos" ? null : servicioAUtilizar?.id;

    console.log(
      "🔍 [cargarDatosDashboard] servicioAUtilizar:",
      servicioAUtilizar,
    );
    console.log("🔍 [cargarDatosDashboard] serviceType:", serviceType);

    // Usar getDashboardMetricsAllServices para obtener datos de todos los servicios con filtro
    // Incluir filtros de género y edad
    const genderFilter = customFilters.gender || generoSeleccionado.id;
    const ageFilter = customFilters.age_range || edadSeleccionada.id;

    const filtersParaDashboard = {
      restaurant_id: restaurantId,
      branch_id: sucursalAUtilizar?.id || null,
      start_date: startDate ? formatearFechaLocal(startDate) : null,
      end_date: endDate ? formatearFechaLocal(endDate) : null,
      granularity: currentGranularity as any,
      service_type: serviceType,
      gender: genderFilter as any,
      age_range: ageFilter as any,
    };
    setLastUsedFilters(filtersParaDashboard);
    getDashboardMetricsAllServices(filtersParaDashboard);
    getAllSellingItems({
      restaurant_id: filtersParaDashboard.restaurant_id,
      branch_id: filtersParaDashboard.branch_id,
      start_date: filtersParaDashboard.start_date,
      end_date: filtersParaDashboard.end_date,
    });

    // Nota: Ya no llamamos a getCompleteDashboardData porque getDashboardMetricsAllServices
    // ahora soporta todos los filtros (género, edad, servicio, sucursal, etc.)

    // Cargar órdenes activas si hay restaurante seleccionado
    if (restaurantId) {
      getActiveOrders(restaurantId);
    }
  };

  const cambiarGenero = (genero: any) => {
    setGeneroSeleccionado(genero);
    setDropdownGeneroAbierto(false);
    // ✅ Usar restaurant_id correcto, no branch UUID
    const restaurantId =
      userRestaurants.length > 0 ? userRestaurants[0]?.id : null;
    cargarDatosDashboard(restaurantId, { gender: genero.id });
  };

  const cambiarEdad = (edad: any) => {
    setEdadSeleccionada(edad);
    setDropdownEdadAbierto(false);
    // ✅ Usar restaurant_id correcto, no branch UUID
    const restaurantId =
      userRestaurants.length > 0 ? userRestaurants[0]?.id : null;
    cargarDatosDashboard(restaurantId, { age_range: edad.id });
  };

  const cambiarGranularidad = (granularidad: any) => {
    setGranularidadSeleccionada(granularidad);
    setDropdownGranularidadAbierto(false);
    // ✅ Usar restaurant_id correcto, no branch UUID
    const restaurantId =
      userRestaurants.length > 0 ? userRestaurants[0]?.id : null;
    cargarDatosDashboard(restaurantId, { granularity: granularidad.id });
  };

  const cambiarServicio = (servicio: any) => {
    setServicioSeleccionado(servicio);
    setDropdownServicioAbierto(false);
    const restaurantId =
      userRestaurants.length > 0 ? userRestaurants[0]?.id : null;
    // Pasar el servicio seleccionado para filtrar los datos
    cargarDatosDashboard(restaurantId, {}, null, null, null, servicio);
  };

  // Función para calcular fechas según filtro de transacciones
  const calcularFechasTransacciones = (filtroId: string) => {
    const ahora = new Date();
    let startDate: Date;

    switch (filtroId) {
      case "hoy":
        startDate = new Date(
          ahora.getFullYear(),
          ahora.getMonth(),
          ahora.getDate(),
          0,
          0,
          0,
        );
        break;
      case "7dias":
        startDate = new Date(ahora);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "mes":
        startDate = new Date(ahora);
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "ano":
        startDate = new Date(ahora);
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        startDate = new Date(
          ahora.getFullYear(),
          ahora.getMonth(),
          ahora.getDate(),
          0,
          0,
          0,
        );
    }

    return {
      start_date: startDate.toISOString(),
      end_date: ahora.toISOString(),
    };
  };

  // Función para cargar transacciones
  const cargarTransacciones = (
    filtroFecha: any = filtroFechaTransacciones,
    pagina: number = 1,
  ) => {
    const restaurantId =
      userRestaurants.length > 0 ? userRestaurants[0]?.id : null;
    const fechas = calcularFechasTransacciones(filtroFecha.id);

    // Usar los mismos filtros de sucursal y servicio que el dashboard
    const serviceType =
      servicioSeleccionado?.id === "todos" ? null : servicioSeleccionado?.id;

    getRecentTransactions({
      restaurant_id: restaurantId,
      branch_id:
        sucursalSeleccionada?.id !== "todas" ? sucursalSeleccionada?.id : null,
      service_type: serviceType,
      start_date: fechas.start_date,
      end_date: fechas.end_date,
      limit: ITEMS_POR_PAGINA,
      offset: (pagina - 1) * ITEMS_POR_PAGINA,
    });
  };

  // Cambiar filtro de fecha de transacciones
  const cambiarFiltroFechaTransacciones = (filtro: any) => {
    setFiltroFechaTransacciones(filtro);
    setDropdownFechaTransaccionesAbierto(false);
    setPaginaTransacciones(1);
    cargarTransacciones(filtro, 1);
  };

  // Cambiar página de transacciones
  const cambiarPaginaTransacciones = (pagina: number) => {
    setPaginaTransacciones(pagina);
    cargarTransacciones(filtroFechaTransacciones, pagina);
  };

  // Calcular total de páginas
  const totalPaginasTransacciones = Math.ceil(
    transactionsPagination.total / ITEMS_POR_PAGINA,
  );

  // Hook de tiempo real - WebSockets
  const currentRestaurantId =
    userRestaurants.length > 0 ? userRestaurants[0]?.id : null;

  const handleRealtimeNewTransaction = useCallback(
    (transaction: RecentTransaction) => {
      console.log("Nueva transacción en tiempo real:", transaction);
      toast.success("Nueva transacción recibida");
      setSocketRefreshTrigger((prev) => prev + 1);
    },
    [],
  );

  const handleRealtimeMetricsUpdate = useCallback(() => {
    console.log("Métricas actualizadas en tiempo real");
    setSocketRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleRealtimeOrderUpdate = useCallback(
    (order: ActiveOrder, action: "created" | "updated" | "closed") => {
      console.log("Orden actualizada en tiempo real:", action);
      if (action === "created") {
        toast.success("Nueva orden recibida");
      }
      setSocketRefreshTrigger((prev) => prev + 1);
    },
    [],
  );

  const handleRealtimeFullRefresh = useCallback(() => {
    console.log("Refresh completo solicitado");
    setSocketRefreshTrigger((prev) => prev + 1);
  }, []);

  const { isSocketConnected } = useRealtimeDashboard({
    restaurantId: currentRestaurantId,
    enabled: true,
    onNewTransaction: handleRealtimeNewTransaction,
    onMetricsUpdate: handleRealtimeMetricsUpdate,
    onOrderUpdate: handleRealtimeOrderUpdate,
    onFullRefresh: handleRealtimeFullRefresh,
  });

  // Efecto para recargar datos cuando llega un evento de socket (debounced)
  useEffect(() => {
    if (socketRefreshTrigger > 0 && currentRestaurantId) {
      if (socketDebounceRef.current) clearTimeout(socketDebounceRef.current);
      socketDebounceRef.current = setTimeout(() => {
        cargarDatosDashboard(currentRestaurantId);
        cargarTransacciones(filtroFechaTransacciones, 1);
        setPaginaTransacciones(1);
        socketDebounceRef.current = null;
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketRefreshTrigger]);

  // Filtrar opciones de servicio según los habilitados
  const opcionesServicioFiltradas = opcionesServicio.filter(
    (servicio) =>
      servicio.id === "todos" || enabledServices.includes(servicio.id),
  );

  const cambiarMesParaGrafico = (direccion: any) => {
    const nuevaFecha = new Date(mesSeleccionadoParaGrafico);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
    setMesSeleccionadoParaGrafico(nuevaFecha);
  };

  // Funciones para el selector de años
  const obtenerAnosDelRango = () => {
    const anos = [];
    for (let i = 0; i < 12; i++) {
      // Mostrar 12 años (6 filas x 2 columnas)
      anos.push(rangoAnosInicio + i);
    }
    return anos;
  };

  const cambiarRangoAnos = (direccion: any) => {
    setRangoAnosInicio(rangoAnosInicio + direccion * 12);
  };

  const seleccionarAno = (ano: any) => {
    setAnoSeleccionado(ano);
    const nuevaFecha = new Date(mesSeleccionadoParaGrafico);
    nuevaFecha.setFullYear(ano);
    setMesSeleccionadoParaGrafico(nuevaFecha);
    setSelectorAnoAbierto(false);
  };

  const obtenerDiasDelMes = (fecha: any) => {
    const year = fecha.getFullYear();
    const month = fecha.getMonth();
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaInicioSemana = primerDia.getDay();

    const dias = [];

    for (let i = diaInicioSemana - 1; i >= 0; i--) {
      const diaAnterior = new Date(year, month, -i);
      dias.push({ dia: diaAnterior.getDate(), esOtroMes: true });
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
      dias.push({ dia, esOtroMes: false });
    }

    const diasRestantes = 42 - dias.length; // 6 semanas × 7 días = 42
    for (let dia = 1; dia <= diasRestantes; dia++) {
      dias.push({ dia, esOtroMes: true });
    }

    return dias;
  };

  const cambiarMes = (direccion: any) => {
    const nuevaFecha = new Date(mesActual);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
    setMesActual(nuevaFecha);
  };

  const seleccionarDia = (dia: any) => {
    setDiaSeleccionadoCalendario(dia);

    const fechaFormateada = `${dia.toString().padStart(2, "0")}/${(mesActual.getMonth() + 1).toString().padStart(2, "0")}/${mesActual.getFullYear()}`;
    setDiaSeleccionado(fechaFormateada);
    setCalendarioAbierto(false);

    if (granularidadSeleccionada.id === "hora" && userRestaurants.length > 0) {
      const customFilters = {
        ...(generoSeleccionado.id !== "todos" && {
          gender: generoSeleccionado.id,
        }),
        ...(edadSeleccionada.id !== "todos" && {
          age_range: edadSeleccionada.id,
        }),
      };

      const restaurantId = userRestaurants[0]?.id;
      cargarDatosDashboard(restaurantId, customFilters, null, fechaFormateada);
    }
  };

  const cambiarHoraInicio = (nuevaHora: number) => {
    const nuevoRango = [nuevaHora, rangoHoras[1]];
    setRangoHoras(nuevoRango);

    if (granularidadSeleccionada.id === "hora" && userRestaurants.length > 0) {
      const restaurantId = userRestaurants[0]?.id;
      cargarDatosDashboard(restaurantId, {}, nuevoRango);
    }
  };

  const cambiarHoraFin = (nuevaHora: number) => {
    const nuevoRango = [rangoHoras[0], nuevaHora];
    setRangoHoras(nuevoRango);

    if (granularidadSeleccionada.id === "hora" && userRestaurants.length > 0) {
      const restaurantId = userRestaurants[0]?.id;
      cargarDatosDashboard(restaurantId, {}, nuevoRango);
    }
  };

  const obtenerDatosGrafico = () => {
    if (!datosUnificados?.grafico) {
      return [];
    }

    if (granularidadSeleccionada.id === "hora") {
      const datosOriginales = datosUnificados.grafico;
      const datosCompletos = [];

      const horasSecuencia: number[] = [];
      if (rangoHoras[1] >= rangoHoras[0]) {
        for (let h = rangoHoras[0]; h <= rangoHoras[1]; h++)
          horasSecuencia.push(h);
      } else {
        for (let h = rangoHoras[0]; h <= 23; h++) horasSecuencia.push(h);
        for (let h = 0; h <= rangoHoras[1]; h++) horasSecuencia.push(h);
      }

      for (const hora of horasSecuencia) {
        const datoExistente = datosOriginales.find(
          (item) => item.hora === hora,
        );

        if (datoExistente) {
          datosCompletos.push(datoExistente);
        } else {
          datosCompletos.push({
            hora: hora,
            ingresos: 0,
          });
        }
      }

      return datosCompletos;
    }

    if (granularidadSeleccionada.id === "dia") {
      const datosOriginales = datosUnificados.grafico;
      const datosCompletos = [];

      const diasEnMes = new Date(
        mesSeleccionadoParaGrafico.getFullYear(),
        mesSeleccionadoParaGrafico.getMonth() + 1,
        0,
      ).getDate();

      for (let dia = 1; dia <= diasEnMes; dia++) {
        const datoExistente = datosOriginales.find((item) => item.dia === dia);

        if (datoExistente) {
          datosCompletos.push(datoExistente);
        } else {
          datosCompletos.push({
            dia: dia,
            ingresos: 0,
          });
        }
      }

      return datosCompletos;
    }

    if (granularidadSeleccionada.id === "mes") {
      const datosOriginales = datosUnificados.grafico;
      const datosCompletos = [];

      // Array con los nombres de los meses en español
      const nombresMeses = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ];

      for (let mes = 1; mes <= 12; mes++) {
        const datoExistente = datosOriginales.find((item) => item.mes === mes);

        if (datoExistente) {
          datosCompletos.push({
            ...datoExistente,
            mes: nombresMeses[mes - 1], // Usar nombre del mes en lugar del número
          });
        } else {
          datosCompletos.push({
            mes: nombresMeses[mes - 1],
            ingresos: 0,
          });
        }
      }

      return datosCompletos;
    }

    return datosUnificados.grafico;
  };

  const obtenerTituloGrafico = () => {
    switch (granularidadSeleccionada.id) {
      case "hora":
        const fechaSeleccionada = new Date(
          mesActual.getFullYear(),
          mesActual.getMonth(),
          diaSeleccionadoCalendario,
        );
        const fechaFormateada = fechaSeleccionada.toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        return `Ingresos Totales por hora (${fechaFormateada})`;

      case "dia":
        const mesAnio = mesSeleccionadoParaGrafico.toLocaleDateString("es-ES", {
          month: "long",
          year: "numeric",
        });
        return `Ingresos Totales por día (${mesAnio})`;

      case "mes":
        return `Ingresos Totales por mes (${mesSeleccionadoParaGrafico.getFullYear()})`;

      case "ano":
        return `Ingresos Totales por año`;

      default:
        return `Ingresos Totales por día (${mesSeleccionadoParaGrafico.toLocaleDateString("es-ES", { month: "long", year: "numeric" })})`;
    }
  };

  const obtenerConfiguracionEjeX = () => {
    switch (granularidadSeleccionada.id) {
      case "hora":
        return {
          dataKey: "hora",
          tickFormatter: (value: any) =>
            `${value.toString().padStart(2, "0")}:00`,
          interval: 2,
        };
      case "dia":
        const diasEnMes = new Date(
          mesSeleccionadoParaGrafico.getFullYear(),
          mesSeleccionadoParaGrafico.getMonth() + 1,
          0,
        ).getDate();
        return {
          dataKey: "dia",
          tickFormatter: (value: any) => value.toString(),
          interval: diasEnMes > 31 ? 3 : diasEnMes > 29 ? 2 : 1,
        };
      case "mes":
        return {
          dataKey: "mes",
          tickFormatter: (value: any) => value,
          interval: 0,
        };
      case "ano":
        return {
          dataKey: "ano",
          tickFormatter: (value: any) => value.toString(),
          interval: 0,
        };
      default:
        return {
          dataKey: "dia",
          tickFormatter: (value: any) => value.toString(),
          interval: 2,
        };
    }
  };

  const abrirDetallesPedido = async (pedido: any) => {
    setPedidoSeleccionado(pedido);
    setMostrarModal(true);
    setItemsPedido([]);
    setIsLoadingItems(true);
    try {
      const items = await getOrderItems(
        pedido.id,
        pedido.orderStatus,
        pedido.serviceType,
      );
      setItemsPedido(items);
    } catch (e) {
      console.error("Error cargando items:", e);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setPedidoSeleccionado(null);
    setItemsPedido([]);
  };

  // Funciones para modal de cambio de estado de platillo
  const abrirModalEstado = (item: any) => {
    setItemSeleccionado(item);
    setNuevoEstadoSeleccionado(item.estadoEntrega || "preparing");
    setMostrarModalEstado(true);
  };

  const cerrarModalEstado = () => {
    setMostrarModalEstado(false);
    setItemSeleccionado(null);
    setNuevoEstadoSeleccionado(null);
  };

  const confirmarCambioEstado = async () => {
    if (!itemSeleccionado || !pedidoSeleccionado || !nuevoEstadoSeleccionado)
      return;

    const isPickAndGo = pedidoSeleccionado.serviceType === "pick-n-go";
    const currentStatus = itemSeleccionado.estadoEntrega || "preparing";

    // No hacer nada si el estado es el mismo
    if (nuevoEstadoSeleccionado === currentStatus) {
      cerrarModalEstado();
      return;
    }

    setIsUpdatingStatus(true);
    try {
      let success: boolean;

      if (isPickAndGo) {
        // Para Pick & Go: actualizar cooking_status del pedido completo
        success = await updatePickAndGoOrderCookingStatus(
          pedidoSeleccionado.id,
          nuevoEstadoSeleccionado,
        );
        if (success) {
          // Actualizar todos los items del pedido con el nuevo estado
          setItemsPedido((prevItems) =>
            prevItems.map((item) => ({
              ...item,
              estadoEntrega: nuevoEstadoSeleccionado,
            })),
          );
        }
      } else {
        // Para otros servicios: actualizar status del platillo individual
        success = await updateDishDeliveryStatus(
          itemSeleccionado.id.toString(),
          nuevoEstadoSeleccionado,
          pedidoSeleccionado.serviceType,
        );
        if (success) {
          setItemsPedido((prevItems) =>
            prevItems.map((item) =>
              item.id === itemSeleccionado.id
                ? { ...item, estadoEntrega: nuevoEstadoSeleccionado }
                : item,
            ),
          );
        }
      }

      if (success) {
        const statusLabel =
          nuevoEstadoSeleccionado === "delivered"
            ? "Entregado"
            : nuevoEstadoSeleccionado === "ready"
              ? "Listo"
              : "Preparando";
        toast.success(`Estado actualizado a "${statusLabel}"`);
        // Recargar transacciones para actualizar el badge de entrega
        cargarTransacciones(filtroFechaTransacciones, paginaTransacciones);
        // Recargar métricas del dashboard para actualizar Órdenes Activas
        const restaurantId =
          userRestaurants.length > 0 ? userRestaurants[0]?.id : null;
        if (restaurantId) {
          cargarDatosDashboard(restaurantId);
        }
        cerrarModalEstado();
      } else {
        toast.error("Error al actualizar el estado");
      }
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      toast.error("Error al actualizar el estado");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Función para cargar branches/sucursales
  const loadBranches = async () => {
    try {
      setBranchesLoading(true);
      console.log("🔍 [Dashboard] Loading branches...");

      const response = await adminPortalApi.getBranches();
      console.log("✅ [Dashboard] Branches loaded:", response);

      setBranches(response.branches || []);

      // Si hay branches y aún está en "Cargando...", seleccionar el primero
      if (
        response.branches &&
        response.branches.length > 0 &&
        sucursalSeleccionada.name === "Cargando..."
      ) {
        const firstBranch = response.branches[0];
        setSucursalSeleccionada(firstBranch);
        // 🔄 Solo cargar datos si userRestaurants ya está disponible
        if (userRestaurants.length > 0) {
          const restaurantId = userRestaurants[0]?.id;
          console.log(
            "🎯 [Dashboard] Auto-loading data with branch:",
            firstBranch.id,
            "and restaurant:",
            restaurantId,
          );
          cargarDatosDashboard(restaurantId);
        } else {
          console.log(
            "⏳ [Dashboard] Waiting for userRestaurants to load before calling dashboard...",
          );
        }
      }
    } catch (error) {
      console.error("❌ [Dashboard] Error loading branches:", error);
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  };

  // Cargar branches al montar el componente
  useEffect(() => {
    loadBranches();
  }, []);

  // ✅ NUEVO: Cargar datos cuando tanto userRestaurants como sucursal real estén disponibles
  useEffect(() => {
    if (
      userRestaurants.length > 0 &&
      sucursalSeleccionada.name !== "Cargando..." &&
      sucursalSeleccionada.id &&
      !dashboardData // Solo si aún no hay datos cargados
    ) {
      const restaurantId = userRestaurants[0]?.id;
      console.log(
        "🚀 [Dashboard] Both userRestaurants and branch ready, loading dashboard data...",
      );
      console.log(
        "🎯 [Dashboard] Using restaurant:",
        restaurantId,
        "and branch:",
        sucursalSeleccionada.id,
      );
      cargarDatosDashboard(restaurantId);
      cargarTransacciones(); // Cargar transacciones también
    }
  }, [userRestaurants, sucursalSeleccionada, dashboardData]);

  // Recargar transacciones cuando cambien filtros de sucursal o servicio
  useEffect(() => {
    if (
      userRestaurants.length > 0 &&
      sucursalSeleccionada?.id &&
      recentTransactions.length >= 0
    ) {
      setPaginaTransacciones(1);
      cargarTransacciones(filtroFechaTransacciones, 1);
    }
  }, [sucursalSeleccionada?.id, servicioSeleccionado?.id]);

  useEffect(() => {
    if (error) {
      // Ignorar errores relacionados con falta de datos (no son errores reales)
      const errorLower = error.toLowerCase();
      const isNoDataError =
        errorLower.includes("no hay") ||
        errorLower.includes("sin datos") ||
        errorLower.includes("no data") ||
        errorLower.includes("not found") ||
        errorLower.includes("no se encontr");

      if (isNoDataError) {
        console.log("ℹ️ [Dashboard] Sin datos disponibles:", error);
        toast.dismiss("dashboard-loading");
        return;
      }

      console.error("Error en analytics:", error);
      // Mostrar toast de error y cerrar el de carga
      toast.dismiss("dashboard-loading");
      toast.error(`Error al cargar datos: ${error}`);
    }
  }, [error]);

  // Mostrar toast de éxito cuando los datos se cargen correctamente

  useEffect(() => {
    if (previousLoadingState && !isLoading && dashboardData) {
      // Solo mostrar toast si acabamos de terminar de cargar
      /*toast.dismiss("dashboard-loading");
      toast.success("Datos actualizados correctamente", {
        duration: 2000,
        icon: "✅",
      });*/
    }
    setPreviousLoadingState(isLoading);
  }, [isLoading, dashboardData]);

  // Recargar datos cuando cambia el mes/año seleccionado para granularidad "día" o "mes"
  useEffect(() => {
    if (
      (granularidadSeleccionada.id === "dia" ||
        granularidadSeleccionada.id === "mes") &&
      sucursalSeleccionada?.id &&
      userRestaurants.length > 0
    ) {
      const restaurantId = userRestaurants[0]?.id;
      cargarDatosDashboard(restaurantId);
    }
  }, [
    mesSeleccionadoParaGrafico,
    anoSeleccionado,
    granularidadSeleccionada.id,
  ]);

  // Verificar servicios habilitados
  useEffect(() => {
    const loadEnabledServices = async () => {
      if (!user || !isSignedIn || servicesLoaded) return;

      try {
        const response = await adminPortalApi.getEnabledServices();
        const enabledServiceIds = response.enabled_services;
        setEnabledServices(enabledServiceIds); // Guardar todos los servicios habilitados
        setIsFlexBillEnabled(enabledServiceIds.includes("flex-bill"));
        setServicesLoaded(true);
      } catch (error) {
        console.error("Error al cargar servicios habilitados:", error);
        setServicesLoaded(true);
      }
    };

    loadEnabledServices();
  }, [user?.id, isSignedIn]);

  // Iniciar onboarding cuando los datos estén cargados
  useEffect(() => {
    if (!isLoading && dashboardData && userRestaurants.length > 0 && user) {
      // Esperar un poco para que los elementos del DOM estén disponibles
      setTimeout(() => {
        startOnboarding();
      }, 1000);
    }
  }, [isLoading, dashboardData, userRestaurants, user, startOnboarding]);

  return (
    <div className="w-full">
      {/* Componente Joyride para onboarding */}
      <Joyride
        steps={tourSteps}
        run={runTour}
        stepIndex={tourStepIndex}
        callback={handleJoyrideCallback}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        spotlightClicks={false}
        disableOverlayClose={true}
        disableScrollParentFix={true}
        styles={joyrideTheme}
        locale={{
          back: "Atrás",
          close: "Cerrar",
          last: "Finalizar",
          next: "Siguiente",
          nextLabelWithProgress: `Siguiente {step} of {steps}`,
          skip: "Saltar",
        }}
      />

      {/* Estilos para los sliders */}
      <style dangerouslySetInnerHTML={{ __html: sliderStyles }} />

      {/* Estilos responsive para onboarding */}
      <style dangerouslySetInnerHTML={{ __html: joyrideResponsiveCSS }} />

      {/* Filtros superiores y header del restaurante */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-6">
        {/* Filtros superiores  */}
        <div
          className="flex flex-wrap gap-2 sm:gap-4"
          data-tour="filtros-avanzados"
        >
          {/* Filtro Género */}
          <div className="relative">
            <button
              onClick={() => setDropdownGeneroAbierto(!dropdownGeneroAbierto)}
              className="flex items-center space-x-1 sm:space-x-2 bg-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:ring-offset-2"
            >
              <UsersIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
              <span className="text-xs sm:text-sm text-gray-600 hidden xs:inline">
                Género:
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-800">
                {generoSeleccionado.label}
              </span>
              <ChevronDownIcon
                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 transition-transform duration-200 ${dropdownGeneroAbierto ? "transform rotate-180" : ""}`}
              />
            </button>
            {dropdownGeneroAbierto && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1 animate-in fade-in duration-100 ease-out">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Seleccionar género
                  </p>
                </div>
                <ul className="py-1">
                  {opcionesGenero.map((genero) => (
                    <li key={genero.id}>
                      <button
                        onClick={() => cambiarGenero(genero)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-800">
                          {genero.label}
                        </span>
                        {generoSeleccionado.id === genero.id && (
                          <CheckIcon className="h-4 w-4 text-custom-green-600" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Filtro Edad */}
          <div className="relative">
            <button
              onClick={() => setDropdownEdadAbierto(!dropdownEdadAbierto)}
              className="flex items-center space-x-1 sm:space-x-2 bg-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:ring-offset-2"
            >
              <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
              <span className="text-xs sm:text-sm text-gray-600 hidden xs:inline">
                Edad:
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-800">
                {edadSeleccionada.label}
              </span>
              <ChevronDownIcon
                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 transition-transform duration-200 ${dropdownEdadAbierto ? "transform rotate-180" : ""}`}
              />
            </button>
            {dropdownEdadAbierto && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1 animate-in fade-in duration-100 ease-out">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Seleccionar edad
                  </p>
                </div>
                <ul className="py-1">
                  {opcionesEdad.map((edad) => (
                    <li key={edad.id}>
                      <button
                        onClick={() => cambiarEdad(edad)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-800">
                          {edad.label}
                        </span>
                        {edadSeleccionada.id === edad.id && (
                          <CheckIcon className="h-4 w-4 text-custom-green-600" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Filtro Sucursal */}
          <div className="relative">
            <button
              onClick={() => setDropdownAbierto(!dropdownAbierto)}
              className="flex items-center space-x-1 sm:space-x-2 bg-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:ring-offset-2"
            >
              <MapPinIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
              <span className="text-xs sm:text-sm text-gray-600 hidden xs:inline">
                Sucursal:
              </span>
              <span className="text-xs sm:text-sm font-medium text-gray-800 truncate max-w-[80px] sm:max-w-none">
                {sucursalSeleccionada.name}
              </span>
              <ChevronDownIcon
                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 transition-transform duration-200 ${dropdownAbierto ? "transform rotate-180" : ""}`}
              />
            </button>
            {dropdownAbierto && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1 animate-in fade-in duration-100 ease-out">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Seleccionar sucursal
                  </p>
                </div>
                <ul className="max-h-64 overflow-y-auto py-1">
                  {branchesLoading ? (
                    <li className="px-4 py-2 text-sm text-gray-500">
                      Cargando sucursales...
                    </li>
                  ) : branches.length > 0 ? (
                    branches.map((branch) => (
                      <li key={branch.id}>
                        <button
                          onClick={() => cambiarSucursal(branch)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {branch.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {branch.address || "Sin dirección"}
                            </p>
                          </div>
                          {sucursalSeleccionada.id === branch.id && (
                            <CheckIcon className="h-4 w-4 text-custom-green-600" />
                          )}
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="px-4 py-2 text-sm text-gray-500">
                      No hay sucursales disponibles
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Filtro Servicio - Solo mostrar si hay más de 1 servicio habilitado */}
          <div className="relative">
            <button
              onClick={() =>
                setDropdownServicioAbierto(!dropdownServicioAbierto)
              }
              className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:ring-offset-2"
            >
              <span className="text-sm text-gray-600">Servicio:</span>
              <span className="text-sm font-medium text-gray-800">
                {servicioSeleccionado.label}
              </span>
              <ChevronDownIcon
                className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${dropdownServicioAbierto ? "transform rotate-180" : ""}`}
              />
            </button>
            {dropdownServicioAbierto && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1 animate-in fade-in duration-100 ease-out">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Filtrar por servicio
                  </p>
                </div>
                <ul className="py-1">
                  {opcionesServicioFiltradas.map((servicio) => (
                    <li key={servicio.id}>
                      <button
                        onClick={() => cambiarServicio(servicio)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-800">
                          {servicio.label}
                        </span>
                        {servicioSeleccionado.id === servicio.id && (
                          <CheckIcon className="h-4 w-4 text-custom-green-600" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Header del restaurante */}
        <div className="hidden sm:flex items-center mr-4 sm:mr-8">
          {restaurant?.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={`Logo de ${restaurant.name}`}
              className="w-10 h-10 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gray-200 mr-2 sm:mr-4"
            />
          ) : (
            <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-custom-green-100 flex items-center justify-center mr-2 sm:mr-4">
              <span className="text-custom-green-600 text-base sm:text-xl font-bold">
                {restaurant?.name?.charAt(0) ||
                  sucursalSeleccionada?.name?.charAt(0) ||
                  "R"}
              </span>
            </div>
          )}
          {/* <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {restaurant?.name || sucursalSeleccionada?.name || 'Cargando...'}
            </h1>
          </div> */}
        </div>
      </div>

      {/* Selector de granularidad y controles específicos */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-3 sm:mb-4">
          {/* Selector de Granularidad + Desde/Hasta a la izquierda */}
          <div className="flex items-end gap-2 sm:gap-3">
            <div className="relative">
              <button
                onClick={() =>
                  setDropdownGranularidadAbierto(!dropdownGranularidadAbierto)
                }
                className="flex items-center space-x-1 sm:space-x-2 bg-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:ring-offset-2"
              >
                <ClockIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                <span className="text-xs sm:text-sm text-gray-600">
                  Granularidad:
                </span>
                <span className="text-xs sm:text-sm font-medium text-gray-800">
                  {granularidadSeleccionada.label}
                </span>
                <ChevronDownIcon
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 transition-transform duration-200 ${dropdownGranularidadAbierto ? "transform rotate-180" : ""}`}
                />
              </button>
              {dropdownGranularidadAbierto && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1 animate-in fade-in duration-100 ease-out">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase">
                      Seleccionar granularidad
                    </p>
                  </div>
                  <ul className="py-1">
                    {opcionesGranularidad.map((granularidad) => (
                      <li key={granularidad.id}>
                        <button
                          onClick={() => cambiarGranularidad(granularidad)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between"
                        >
                          <span className="text-sm text-gray-800">
                            {granularidad.label}
                          </span>
                          {granularidadSeleccionada.id === granularidad.id && (
                            <CheckIcon className="h-4 w-4 text-custom-green-600" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Selectores Desde/Hasta inline junto a granularidad */}
            {granularidadSeleccionada.id === "hora" && (
              <div className="flex items-end gap-2">
                <div>
                  <label className="text-[10px] sm:text-xs text-gray-500 block mb-1">
                    Desde
                  </label>
                  <select
                    value={rangoHoras[0]}
                    onChange={(e) => cambiarHoraInicio(Number(e.target.value))}
                    className="text-xs sm:text-sm p-1 sm:p-1.5 border border-gray-200 rounded bg-white"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs text-gray-500 block mb-1">
                    Hasta
                  </label>
                  <select
                    value={rangoHoras[1]}
                    onChange={(e) => cambiarHoraFin(Number(e.target.value))}
                    className="text-xs sm:text-sm p-1 sm:p-1.5 border border-gray-200 rounded bg-white"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, "0")}:00
                      </option>
                    ))}
                  </select>
                </div>
                {rangoHoras[1] < rangoHoras[0] && (
                  <span className="text-[10px] sm:text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full mb-1">
                    +1 día
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Botón de actualizar y selector de mes/año a la derecha */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Botón de actualizar */}
            <button
              onClick={() => {
                const restaurantId =
                  userRestaurants.length > 0 ? userRestaurants[0]?.id : null;
                cargarDatosDashboard(restaurantId);
                cargarTransacciones(filtroFechaTransacciones, 1);
                setPaginaTransacciones(1);
              }}
              disabled={isLoading}
              className="flex items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
              data-tour="actualizar-datos"
            >
              <RotateCcwIcon
                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              <span className="hidden xs:inline">
                {isLoading ? "Actualizando..." : "Actualizar"}
              </span>
              <span className="xs:hidden">{isLoading ? "..." : ""}</span>
            </button>

            {/* Indicador de conexión en tiempo real */}
            <div
              className="flex items-center ml-2"
              title={
                isSocketConnected
                  ? "Conectado en tiempo real"
                  : "Sin conexión en tiempo real"
              }
            >
              <div
                className={`w-2 h-2 rounded-full ${isSocketConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
              />
              <span className="hidden sm:inline ml-1 text-xs text-gray-500">
                {isSocketConnected ? "En vivo" : ""}
              </span>
            </div>

            {/* Selector de día (para granularidad Hora) */}
            {granularidadSeleccionada.id === "hora" && (
              <div className="relative">
                <button
                  onClick={() => setCalendarioAbierto(!calendarioAbierto)}
                  className="flex items-center space-x-1 sm:space-x-2 bg-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:ring-offset-2"
                >
                  <span className="text-xs sm:text-sm text-gray-600">Día:</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-800">
                    {diaSeleccionado}
                  </span>
                  <ChevronDownIcon
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 transition-transform duration-200 ${calendarioAbierto ? "transform rotate-180" : ""}`}
                  />
                </button>

                {calendarioAbierto && (
                  <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-20 p-4 w-64">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => cambiarMes(-1)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <ChevronDownIcon className="h-4 w-4 transform rotate-90 text-gray-600" />
                      </button>
                      <h3 className="text-sm font-medium text-gray-900">
                        {mesActual.toLocaleDateString("es-ES", {
                          month: "long",
                          year: "numeric",
                        })}
                      </h3>
                      <button
                        onClick={() => cambiarMes(1)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <ChevronDownIcon className="h-4 w-4 transform -rotate-90 text-gray-600" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dia) => (
                        <div
                          key={dia}
                          className="text-xs font-medium text-gray-500 text-center p-2"
                        >
                          {dia}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {obtenerDiasDelMes(mesActual).map((diaInfo, index) => (
                        <button
                          key={index}
                          onClick={() =>
                            !diaInfo.esOtroMes && seleccionarDia(diaInfo.dia)
                          }
                          disabled={diaInfo.esOtroMes}
                          className={`
                            p-2 text-sm rounded transition-colors
                            ${
                              diaInfo.esOtroMes
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-gray-700 hover:bg-gray-100 cursor-pointer"
                            }
                            ${
                              diaInfo.dia === diaSeleccionadoCalendario &&
                              !diaInfo.esOtroMes
                                ? "bg-custom-green-500 text-white hover:bg-custom-green-600"
                                : ""
                            }
                          `}
                        >
                          {diaInfo.dia}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selector de mes (para granularidad Día) */}
            {granularidadSeleccionada.id === "dia" && (
              <div className="relative">
                <button
                  onClick={() => setSelectorMesAbierto(!selectorMesAbierto)}
                  className="flex items-center space-x-1 sm:space-x-2 bg-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:ring-offset-2"
                >
                  <span className="text-xs sm:text-sm text-gray-600">Mes:</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-800">
                    {(mesSeleccionadoParaGrafico.getMonth() + 1)
                      .toString()
                      .padStart(2, "0")}
                    /{mesSeleccionadoParaGrafico.getFullYear()}
                  </span>
                  <ChevronDownIcon
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 transition-transform duration-200 ${selectorMesAbierto ? "transform rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown para seleccionar mes/año */}
                {selectorMesAbierto && (
                  <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-20 p-4 w-64">
                    {/* Navegación de mes/año */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => cambiarMesParaGrafico(-1)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <ChevronDownIcon className="h-4 w-4 transform rotate-90 text-gray-600" />
                      </button>
                      <h3 className="text-sm font-medium text-gray-900">
                        {mesSeleccionadoParaGrafico.toLocaleDateString(
                          "es-ES",
                          {
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </h3>
                      <button
                        onClick={() => cambiarMesParaGrafico(1)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <ChevronDownIcon className="h-4 w-4 transform -rotate-90 text-gray-600" />
                      </button>
                    </div>

                    {/* Botón para cerrar */}
                    <div className="text-center">
                      <button
                        onClick={() => setSelectorMesAbierto(false)}
                        className="px-4 py-2 bg-custom-green-600 text-white rounded-lg hover:bg-custom-green-700 transition-colors text-sm"
                      >
                        Seleccionar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selector de año (para granularidad Mes) */}
            {granularidadSeleccionada.id === "mes" && (
              <div className="relative">
                <button
                  onClick={() => setSelectorAnoAbierto(!selectorAnoAbierto)}
                  className="flex items-center space-x-1 sm:space-x-2 bg-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:ring-offset-2"
                >
                  <span className="text-xs sm:text-sm text-gray-600">Año:</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-800">
                    {anoSeleccionado}
                  </span>
                  <ChevronDownIcon
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 transition-transform duration-200 ${selectorAnoAbierto ? "transform rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown para seleccionar año */}
                {selectorAnoAbierto && (
                  <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-20 p-4 w-64">
                    {/* Header del selector de años */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => cambiarRangoAnos(-1)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <ChevronDownIcon className="h-4 w-4 transform rotate-90 text-gray-600" />
                      </button>
                      <h3 className="text-sm font-medium text-gray-900">
                        {rangoAnosInicio} - {rangoAnosInicio + 11}
                      </h3>
                      <button
                        onClick={() => cambiarRangoAnos(1)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <ChevronDownIcon className="h-4 w-4 transform -rotate-90 text-gray-600" />
                      </button>
                    </div>

                    {/* Grid de años */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {obtenerAnosDelRango().map((ano) => (
                        <button
                          key={ano}
                          onClick={() => seleccionarAno(ano)}
                          className={`
                          p-2 text-sm rounded transition-colors text-center
                          ${
                            ano === anoSeleccionado
                              ? "bg-blue-500 text-white hover:bg-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }
                        `}
                        >
                          {ano}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gráfico de Ingresos Totales */}
      <div
        className="bg-white rounded-lg shadow-md border border-gray-100 p-3 sm:p-6 mb-4 sm:mb-6"
        data-tour="consumo-activity"
      >
        <h3 className="text-sm sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
          {obtenerTituloGrafico()}
        </h3>

        {/* Gráfico de líneas con Recharts */}
        <div className="h-48 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={obtenerDatosGrafico()}
              margin={{
                top: 10,
                right: 10,
                left: 15,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey={obtenerConfiguracionEjeX().dataKey}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={obtenerConfiguracionEjeX().tickFormatter}
                interval={obtenerConfiguracionEjeX().interval}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(value) => {
                  if (value >= 1000) {
                    return `$${(value / 1000).toFixed(1)}k`;
                  }
                  return `$${value}`;
                }}
              />
              <Tooltip
                content={(props) => (
                  <CustomTooltip
                    {...props}
                    granularidad={granularidadSeleccionada.id}
                    mesSeleccionado={
                      granularidadSeleccionada.id === "hora"
                        ? mesActual
                        : mesSeleccionadoParaGrafico
                    }
                    diaSeleccionado={
                      granularidadSeleccionada.id === "hora"
                        ? diaSeleccionado
                        : null
                    }
                  />
                )}
              />
              <Line
                type="monotone"
                dataKey="ingresos"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#10b981" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tarjetas de métricas */}
      <div data-tour="indicadores-clave">
        <div
          className={`grid grid-cols-2 gap-3 sm:gap-5 mb-4 sm:mb-6 ${servicesLoaded && !enabledServices.includes("flex-bill") && !enabledServices.includes("tap-pay") ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}
        >
          {/* Ventas totales */}
          <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
            <div className="p-3 sm:p-8">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-custom-green-100 p-2 sm:p-3 rounded-full">
                  <BarChart2Icon className="h-4 w-4 sm:h-6 sm:w-6 text-custom-green-600" />
                </div>
                <div className="ml-2 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Ventas totales
                    </dt>
                    <dd>
                      <div className="text-sm sm:text-lg font-medium text-gray-900">
                        {isLoading || isLoadingAllServices
                          ? "..."
                          : `$${datosUnificados?.metricas?.ventasTotales?.toLocaleString() || "0"}`}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Órdenes Activas */}
          <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
            <div className="p-3 sm:p-8">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 p-2 sm:p-3 rounded-full">
                  <ShoppingCartIcon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="ml-2 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Órdenes Activas
                    </dt>
                    <dd>
                      <div className="text-sm sm:text-lg font-medium text-gray-900">
                        {isLoading || isLoadingAllServices
                          ? "..."
                          : datosUnificados?.metricas?.ordenesActivas || "0"}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Pedidos — solo para FlexBill o Tap & Pay */}
          {(!servicesLoaded ||
            enabledServices.includes("flex-bill") ||
            enabledServices.includes("tap-pay")) && (
            <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
              <div className="p-3 sm:p-8">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-amber-100 p-2 sm:p-3 rounded-full">
                    <ShoppingBagIcon className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600" />
                  </div>
                  <div className="ml-2 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                        Pedidos
                      </dt>
                      <dd>
                        <div className="text-sm sm:text-lg font-medium text-gray-900">
                          {isLoading || isLoadingAllServices
                            ? "..."
                            : datosUnificados?.metricas?.pedidos || "0"}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Órdenes Totales */}
          <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
            <div className="p-3 sm:p-8">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-custom-green-100 p-1.5 sm:p-2 rounded-full">
                  <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-custom-green-600" />
                </div>
                <div className="ml-2 sm:ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Órdenes Totales
                    </dt>
                    <dd>
                      <div className="text-sm sm:text-base font-medium text-gray-900">
                        {isLoading || isLoadingAllServices
                          ? "..."
                          : datosUnificados?.metricas?.totalOrdenes || "0"}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Secciones adicionales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6 lg:grid-cols-3">
          {/* Propina */}
          <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
            <div className="p-3 sm:p-8">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 p-2 sm:p-3 rounded-full">
                  <DollarSignIcon className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div className="ml-2 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Propinas
                    </dt>
                    <dd>
                      <div className="text-sm sm:text-lg font-medium text-gray-900">
                        {isLoading || isLoadingAllServices
                          ? "..."
                          : `$${datosUnificados?.metricas?.propinasTotales?.toLocaleString() || "0"}`}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Artículo más vendido */}
          <button
            className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg  cursor-pointer text-left w-full group"
            onClick={() => {
              setMostrarRankingModal(true);
              getAllSellingItems({
                restaurant_id: lastUsedFilters?.restaurant_id,
                branch_id: lastUsedFilters?.branch_id,
                start_date: lastUsedFilters?.start_date,
                end_date: lastUsedFilters?.end_date,
              });
            }}
          >
            <div className="p-3 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-amber-100 p-1.5 sm:p-2 rounded-full transition-colors">
                  <CrownIcon className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                </div>
                <div className="ml-2 sm:ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate flex items-center gap-1">
                      Ventas por platillo
                    </dt>
                    <dd>
                      <div className="text-sm sm:text-lg font-medium text-gray-900">
                        {isLoadingRanking || isLoadingAllServices
                          ? "..."
                          : sellingItemsRanking
                              .reduce(
                                (sum, item) =>
                                  sum + (item.unidades_vendidas || 0),
                                0,
                              )
                              .toLocaleString()}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                        {isLoadingRanking || isLoadingAllServices
                          ? ""
                          : "Ver más"}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </button>

          {/* Ticket Promedio */}
          <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
            <div className="p-3 sm:p-8">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 p-2 sm:p-3 rounded-full">
                  <DollarSignIcon className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                </div>
                <div className="ml-2 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Ticket Promedio
                    </dt>
                    <dd>
                      <div className="text-sm sm:text-lg font-medium text-gray-900">
                        {isLoading || isLoadingAllServices
                          ? "..."
                          : `$${datosUnificados?.metricas?.ticketPromedio?.toLocaleString() || "0"}`}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Tiempo Promedio x cuenta - Solo mostrar si FlexBill está habilitado */}
          {/*}
          {servicesLoaded && isFlexBillEnabled && (
            <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
              <div className="p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className="flex-shrink-0 bg-red-100 p-1.5 sm:p-2 rounded-full">
                      <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    </div>
                    <div className="ml-2 sm:ml-4 flex-1">
                      <dl>
                        <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                          Tiempo Prom.
                        </dt>
                        <dd>
                          <div className="text-sm sm:text-base font-medium text-gray-900">
                            {isLoading || isLoadingAllServices
                              ? "..."
                              : (dashboardData as any)?.tiempo_promedio_mesa
                                  ?.tiempo_promedio_formateado || "Sin datos"}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                  <span className="bg-gray-800 text-white text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ml-2 sm:ml-3">
                    Flex Bill
                  </span>
                </div>
              </div>
            </div>
          )}*/}
        </div>
      </div>

      {/* Recent Activity - Transacciones */}
      <div className="mt-7" data-tour="actividad-reciente">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h2 className="text-base sm:text-lg font-medium text-gray-900 flex items-center flex-wrap gap-2 truncate">
            Actividad reciente
          </h2>
          {/* Selector de fecha independiente */}
          <div className="relative">
            <button
              onClick={() =>
                setDropdownFechaTransaccionesAbierto(
                  !dropdownFechaTransaccionesAbierto,
                )
              }
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              {filtroFechaTransacciones.label}
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </button>
            {dropdownFechaTransaccionesAbierto && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {opcionesFechaTransacciones.map((opcion) => (
                  <button
                    key={opcion.id}
                    onClick={() => cambiarFiltroFechaTransacciones(opcion)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${
                      filtroFechaTransacciones.id === opcion.id
                        ? "bg-custom-green-50 text-custom-green-700 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {opcion.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 bg-white shadow-md overflow-hidden sm:rounded-lg border border-gray-100">
          <ul className="divide-y divide-gray-200">
            {isLoadingTransactions ? (
              <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                Cargando transacciones...
              </li>
            ) : recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <li
                  key={tx.id}
                  className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                  onClick={() => abrirDetallesPedido(tx)}
                >
                  <div className="px-4 py-4 sm:px-6 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {tx.folio && (
                          <span className="text-sm text-custom-green-600">
                            #{tx.folio}
                          </span>
                        )}
                        <p className="text-sm font-medium text-custom-green-600 truncate">
                          {tx.serviceType === "flex-bill"
                            ? tx.paymentsBreakdown &&
                              tx.paymentsBreakdown.length > 0
                              ? `${tx.paymentsBreakdown.length} usuario${tx.paymentsBreakdown.length > 1 ? "s" : ""}`
                              : "Sin usuarios"
                            : tx.customerName || "Cliente"}
                        </p>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex gap-2">
                        <p
                          className={`px-2.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tx.serviceType === "flex-bill"
                              ? "bg-purple-100 text-purple-800"
                              : tx.serviceType === "tap-order-pay"
                                ? "bg-blue-100 text-blue-800"
                                : tx.serviceType === "pick-n-go"
                                  ? "bg-orange-100 text-orange-800"
                                  : tx.serviceType === "room-service"
                                    ? "bg-pink-100 text-pink-800"
                                    : tx.serviceType === "tap-pay"
                                      ? "bg-cyan-100 text-cyan-800"
                                      : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {tx.serviceType === "flex-bill"
                            ? "Flex Bill"
                            : tx.serviceType === "tap-order-pay"
                              ? "Tap Order & Pay"
                              : tx.serviceType === "pick-n-go"
                                ? "Pick & Go"
                                : tx.serviceType === "room-service"
                                  ? "Room Service"
                                  : tx.serviceType === "tap-pay"
                                    ? "Tap & Pay"
                                    : tx.serviceType}
                        </p>
                        <p
                          className={`px-2.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tx.orderStatus === "paid"
                              ? "bg-green-100 text-green-800"
                              : tx.orderStatus === "partial"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tx.orderStatus === "paid"
                            ? "Pagado"
                            : tx.orderStatus === "partial"
                              ? "Parcial"
                              : tx.orderStatus === "not_paid"
                                ? "Pendiente"
                                : tx.orderStatus === "pending"
                                  ? "Pendiente"
                                  : tx.orderStatus}
                        </p>
                        {/* Badge de estado de entrega */}
                        <p
                          className={`px-2.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            tx.deliveryStatus === "complete"
                              ? "bg-emerald-100 text-emerald-800"
                              : tx.deliveryStatus === "partial"
                                ? "bg-amber-100 text-amber-800"
                                : tx.deliveryStatus === "ready"
                                  ? "bg-cyan-100 text-cyan-800"
                                  : tx.deliveryStatus === "partial_ready"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {tx.deliveryStatus === "complete"
                            ? "Entregado"
                            : tx.deliveryStatus === "partial"
                              ? "Entrega parcial"
                              : tx.deliveryStatus === "ready"
                                ? "Listo"
                                : tx.deliveryStatus === "partial_ready"
                                  ? "Parcialmente listo"
                                  : "Preparando"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-col sm:flex-row sm:justify-between gap-2">
                      <div className="sm:flex sm:flex-col sm:space-y-1">
                        <p className="flex items-center text-xs sm:text-sm text-gray-500">
                          <DollarSignIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          Total: ${tx.totalAmount?.toLocaleString() || 0}
                          {tx.tipAmount > 0 &&
                            ` | Propina: $${tx.tipAmount?.toLocaleString()}`}
                        </p>
                        <p className="flex items-center text-xs text-custom-green-600 font-medium">
                          <ShoppingCartIcon className="flex-shrink-0 mr-1.5 h-3 w-3 text-custom-green-500" />
                          {tx.orderIdentifier} | Venta: $
                          {tx.baseAmount?.toLocaleString() || 0}
                        </p>
                        {/* Campos adicionales para FlexBill */}
                        {tx.serviceType === "flex-bill" && (
                          <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500 mt-1">
                            {tx.noItems !== null &&
                              tx.noItems !== undefined && (
                                <span className="flex items-center">
                                  <ShoppingBagIcon className="flex-shrink-0 mr-1 h-3 w-3 text-gray-400" />
                                  {tx.noItems} items
                                </span>
                              )}
                            {tx.paidAmount !== null &&
                              tx.paidAmount !== undefined &&
                              tx.paidAmount > 0 &&
                              tx.remainingAmount !== null &&
                              tx.remainingAmount !== undefined &&
                              tx.remainingAmount > 0 && (
                                <span className="text-green-600">
                                  Pagado: ${tx.paidAmount?.toLocaleString()}
                                </span>
                              )}
                            {tx.remainingAmount !== null &&
                              tx.remainingAmount !== undefined &&
                              tx.remainingAmount > 0 && (
                                <span className="text-orange-600">
                                  Pendiente: $
                                  {tx.remainingAmount?.toLocaleString()}
                                </span>
                              )}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-xs sm:text-sm text-gray-500 sm:mt-0">
                        <svg
                          className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p>
                          {new Date(tx.createdAt).toLocaleString("es-ES", {
                            day: "numeric",
                            month: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                No hay transacciones en este periodo
              </li>
            )}
          </ul>

          {/* Paginación numérica */}
          {totalPaginasTransacciones > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-center gap-1">
              {Array.from(
                { length: totalPaginasTransacciones },
                (_, i) => i + 1,
              ).map((pagina) => (
                <button
                  key={pagina}
                  onClick={() => cambiarPaginaTransacciones(pagina)}
                  disabled={isLoadingTransactions}
                  className={`min-w-[32px] h-8 px-2 text-sm font-medium rounded transition-colors duration-200 disabled:opacity-50 ${
                    paginaTransacciones === pagina
                      ? "bg-custom-green-600 text-white"
                      : "text-custom-green-600 hover:bg-custom-green-50"
                  }`}
                >
                  {pagina}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información de paginación */}
        {transactionsPagination.total > 0 && (
          <div className="mt-2 text-center text-xs text-gray-500">
            Mostrando {recentTransactions.length} de{" "}
            {transactionsPagination.total} transacciones
          </div>
        )}
      </div>

      {/* Modal de Ranking de Artículos */}
      {mostrarRankingModal && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]"
            onClick={() => setMostrarRankingModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="bg-amber-100 p-2 rounded-full">
                  <CrownIcon className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Ventas por platillo
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {sellingItemsRanking
                      .reduce(
                        (sum, item) => sum + (item.unidades_vendidas || 0),
                        0,
                      )
                      .toLocaleString()}{" "}
                    unidades en total
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMostrarRankingModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Lista */}
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {isLoadingRanking ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <div className="animate-spin h-6 w-6 border-2 border-amber-400 border-t-transparent rounded-full mr-3" />
                  Cargando ranking...
                </div>
              ) : sellingItemsRanking.length === 0 ? (
                <p className="text-center text-gray-400 py-12">
                  Sin datos disponibles
                </p>
              ) : (
                (() => {
                  const maxUnidades =
                    sellingItemsRanking[0]?.unidades_vendidas || 1;
                  return sellingItemsRanking.map((item, index) => (
                    <div
                      key={item.nombre}
                      className="flex items-center gap-3 group"
                    >
                      <span
                        className={`text-xs font-bold w-5 text-right shrink-0 ${index === 0 ? "text-amber-500" : "text-gray-400"}`}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-800 truncate pr-2">
                            {item.nombre}
                          </span>
                          <span className="text-xs text-gray-500 shrink-0">
                            {item.unidades_vendidas} uds.
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${index === 0 ? "bg-amber-400" : "bg-gray-300"}`}
                            style={{
                              width: `${(item.unidades_vendidas / maxUnidades) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles del Pedido */}
      {mostrarModal && pedidoSeleccionado && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]"
            onClick={cerrarModal}
          ></div>
          <div className="relative bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalles del Pedido
                </h3>
                <button
                  onClick={cerrarModal}
                  className="text-gray-400 hover:text-gray-500 transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              {/* Identificador y Estado */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <ShoppingCartIcon className="h-5 w-5 text-custom-green-600 mr-2" />
                    <span className="text-lg font-semibold text-custom-green-600">
                      {pedidoSeleccionado.orderIdentifier || "Orden"}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      pedidoSeleccionado.orderStatus === "paid"
                        ? "bg-green-100 text-green-800"
                        : pedidoSeleccionado.orderStatus === "partial"
                          ? "bg-yellow-100 text-yellow-800"
                          : pedidoSeleccionado.orderStatus === "not_paid" ||
                              pedidoSeleccionado.orderStatus === "pending"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {pedidoSeleccionado.orderStatus === "paid"
                      ? "Pagado"
                      : pedidoSeleccionado.orderStatus === "partial"
                        ? "Parcial"
                        : pedidoSeleccionado.orderStatus === "not_paid" ||
                            pedidoSeleccionado.orderStatus === "pending"
                          ? "Pendiente"
                          : pedidoSeleccionado.orderStatus || "Sin estado"}
                  </span>
                </div>

                <div className="flex items-center mb-2">
                  <ShoppingBagIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">
                    {pedidoSeleccionado.serviceType === "flex-bill"
                      ? "FlexBill"
                      : pedidoSeleccionado.serviceType === "tap-order-pay"
                        ? "Tap Order & Pay"
                        : pedidoSeleccionado.serviceType === "pick-n-go"
                          ? "Pick & Go"
                          : pedidoSeleccionado.serviceType === "room-service"
                            ? "Room Service"
                            : pedidoSeleccionado.serviceType === "tap-pay"
                              ? "Tap & Pay"
                              : pedidoSeleccionado.serviceType}
                  </span>
                </div>

                {/* Nombre del cliente para Tap Order y Pick & Go */}
                {pedidoSeleccionado.customerName &&
                  (pedidoSeleccionado.serviceType === "tap-order-pay" ||
                    pedidoSeleccionado.serviceType === "pick-n-go") && (
                    <div className="flex items-center mb-2">
                      <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-700">
                        {pedidoSeleccionado.customerName}
                      </span>
                    </div>
                  )}

                <div className="flex items-center mb-2">
                  <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-500">
                    {pedidoSeleccionado.createdAt
                      ? new Date(pedidoSeleccionado.createdAt).toLocaleString(
                          "es-ES",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                      : "Tiempo no disponible"}
                  </span>
                </div>

                {/* Badge de estado de cocina para Pick & Go (nivel de orden) */}
                {pedidoSeleccionado.serviceType === "pick-n-go" &&
                  !isLoadingItems &&
                  itemsPedido.length > 0 && (
                    <div className="flex items-center mb-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium cursor-pointer ${
                          itemsPedido[0]?.estadoEntrega === "delivered"
                            ? "bg-green-100 text-green-700"
                            : itemsPedido[0]?.estadoEntrega === "ready"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                        onClick={() => abrirModalEstado(itemsPedido[0])}
                      >
                        {itemsPedido[0]?.estadoEntrega === "delivered"
                          ? "Entregado"
                          : itemsPedido[0]?.estadoEntrega === "ready"
                            ? "Listo"
                            : "Preparando"}
                      </span>
                    </div>
                  )}
              </div>

              {/* Items del Pedido */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <ShoppingBagIcon className="h-4 w-4 mr-2 text-gray-500" />
                  Items del Pedido
                </h4>
                <div className="space-y-3">
                  {isLoadingItems ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">Cargando items...</p>
                    </div>
                  ) : itemsPedido.length > 0 ? (
                    itemsPedido.map((item: any, index: number) => (
                      <div
                        key={index}
                        className={`bg-gray-50 rounded-lg p-3 transition-colors ${pedidoSeleccionado?.serviceType !== "pick-n-go" ? "cursor-pointer hover:bg-gray-100" : ""}`}
                        onClick={
                          pedidoSeleccionado?.serviceType !== "pick-n-go"
                            ? () => abrirModalEstado(item)
                            : undefined
                        }
                      >
                        <div className="flex items-center gap-3">
                          {item.imagen ? (
                            <img
                              src={item.imagen}
                              alt={item.nombre}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                              <ShoppingBagIcon className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {item.nombre || "Producto sin nombre"}
                            </p>
                            <div className="flex items-center mt-1 space-x-3">
                              <p className="text-xs text-gray-500">
                                Cantidad: {item.cantidad || 0}
                              </p>
                              <p className="text-xs text-gray-500">
                                Precio: $
                                {item.precio ? item.precio.toFixed(2) : "0.00"}
                              </p>
                            </div>
                            {/* Nombre del invitado para FlexBill */}
                            {pedidoSeleccionado?.serviceType === "flex-bill" &&
                              item.guestName && (
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                  <UserIcon className="h-3 w-3" />
                                  {item.guestName}
                                </p>
                              )}
                            {/* Custom fields */}
                            {Array.isArray(item.customFields) &&
                              item.customFields.length > 0 && (
                                <div className="mt-1">
                                  {(item.customFields as CustomField[]).flatMap(
                                    (f: CustomField) =>
                                      (f.selectedOptions ?? []).map(
                                        (o: CustomFieldOption, oi: number) => {
                                          const qty = o.quantity ?? 1;
                                          const val =
                                            f.fieldType ===
                                              "dropdown-quantity" && qty > 1
                                              ? `x${qty} ${o.optionName}`
                                              : o.optionName;
                                          return (
                                            <p
                                              key={`${f.fieldId}-${oi}`}
                                              className="text-xs text-gray-400"
                                            >
                                              {f.fieldName}: {val}
                                            </p>
                                          );
                                        },
                                      ),
                                  )}
                                </div>
                              )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-medium text-gray-900 text-sm">
                              $
                              {item.precioTotal
                                ? item.precioTotal.toFixed(2)
                                : (item.precio * item.cantidad).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">Total</p>
                            {/* Estado de entrega del item (solo para servicios con status por platillo) */}
                            {pedidoSeleccionado?.serviceType !==
                              "pick-n-go" && (
                              <span
                                className={`mt-1 inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                                  item.estadoEntrega === "delivered"
                                    ? "bg-green-100 text-green-700"
                                    : item.estadoEntrega === "ready"
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {item.estadoEntrega === "delivered"
                                  ? "Entregado"
                                  : item.estadoEntrega === "ready"
                                    ? "Listo"
                                    : "Preparando"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">
                        No se encontraron items para esta orden
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Resumen de Pago */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <DollarSignIcon className="h-4 w-4 mr-2 text-gray-500" />
                  Resumen de Pago
                </h4>

                <div className="space-y-2">
                  {/* Consumo */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Consumo:</span>
                    <span className="font-medium">
                      $
                      {pedidoSeleccionado.baseAmount?.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "0.00"}
                    </span>
                  </div>

                  {/* Pagado y Pendiente para FlexBill - entre consumo y propina */}
                  {pedidoSeleccionado.serviceType === "flex-bill" && (
                    <>
                      {pedidoSeleccionado.paidAmount !== null &&
                        pedidoSeleccionado.paidAmount !== undefined && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Pagado:</span>
                            <span className="font-medium text-green-600">
                              $
                              {pedidoSeleccionado.paidAmount?.toLocaleString(
                                "es-MX",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              ) || "0.00"}
                            </span>
                          </div>
                        )}
                      {pedidoSeleccionado.remainingAmount !== null &&
                        pedidoSeleccionado.remainingAmount !== undefined &&
                        pedidoSeleccionado.remainingAmount > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Pendiente:</span>
                            <span className="font-medium text-orange-600">
                              $
                              {pedidoSeleccionado.remainingAmount?.toLocaleString(
                                "es-MX",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              ) || "0.00"}
                            </span>
                          </div>
                        )}
                    </>
                  )}

                  {/* Propina - solo si hay transacciones */}
                  {pedidoSeleccionado.tipAmount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Propina:</span>
                      <span className="font-medium text-blue-600">
                        $
                        {pedidoSeleccionado.tipAmount?.toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) || "0.00"}
                      </span>
                    </div>
                  )}

                  {/* Comisiones - solo si hay transacciones */}
                  {pedidoSeleccionado.commission > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Comisión:</span>
                      <span className="font-medium text-gray-600">
                        $
                        {pedidoSeleccionado.commission?.toLocaleString(
                          "es-MX",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        ) || "0.00"}
                      </span>
                    </div>
                  )}

                  {/* Total cobrado */}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <div className="relative inline-flex items-center gap-1 group/neto cursor-default">
                        <span className="text-base font-semibold text-gray-900">
                          Total cobrado:
                        </span>

                        {pedidoSeleccionado.restaurantNet > 0 && (
                          <>
                            <InfoIcon className="size-3.5 text-gray-900" />

                            <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover/neto:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                              Neto restaurante: $
                              {pedidoSeleccionado.restaurantNet?.toLocaleString(
                                "es-MX",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        $
                        {pedidoSeleccionado.totalAmount?.toLocaleString(
                          "es-MX",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        ) || "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={cerrarModal}
                className="w-full bg-custom-green-600 text-white py-2 px-4 rounded-lg hover:bg-custom-green-700 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cambio de Estado de Platillo */}
      {mostrarModalEstado && itemSeleccionado && (
        <div className="fixed inset-0 overflow-y-auto z-[60] flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]"
            onClick={cerrarModalEstado}
          ></div>
          <div className="relative bg-white rounded-xl max-w-xs w-full mx-4 shadow-2xl">
            {/* Header del Modal */}
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  {pedidoSeleccionado?.serviceType === "pick-n-go"
                    ? "Cambiar Estado del Pedido"
                    : "Cambiar Estado"}
                </h3>
                <button
                  onClick={cerrarModalEstado}
                  className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="px-4 py-3">
              {/* Info del platillo (solo para servicios con status por platillo) */}
              {pedidoSeleccionado?.serviceType !== "pick-n-go" && (
                <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
                  {itemSeleccionado.imagen ? (
                    <img
                      src={itemSeleccionado.imagen}
                      alt={itemSeleccionado.nombre}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <ShoppingBagIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {itemSeleccionado.nombre || "Producto sin nombre"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Cantidad: {itemSeleccionado.cantidad || 0}
                    </p>
                  </div>
                </div>
              )}

              {/* Opciones de estado */}
              <div className="space-y-2">
                {/* Preparando */}
                <button
                  onClick={() => setNuevoEstadoSeleccionado("preparing")}
                  disabled={isUpdatingStatus}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                    nuevoEstadoSeleccionado === "preparing"
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-gray-200 hover:border-yellow-300 hover:bg-yellow-50"
                  } ${isUpdatingStatus ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-yellow-100 flex items-center justify-center">
                      <NotepadText className="h-4 w-4 text-yellow-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      Preparando
                    </p>
                  </div>
                  {nuevoEstadoSeleccionado === "preparing" && (
                    <CheckIcon className="h-4 w-4 text-yellow-600" />
                  )}
                </button>

                {/* Listo */}
                <button
                  onClick={() => setNuevoEstadoSeleccionado("ready")}
                  disabled={isUpdatingStatus}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                    nuevoEstadoSeleccionado === "ready"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                  } ${isUpdatingStatus ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                      <ClockIcon className="h-4 w-4 text-orange-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">Listo</p>
                  </div>
                  {nuevoEstadoSeleccionado === "ready" && (
                    <CheckIcon className="h-4 w-4 text-orange-600" />
                  )}
                </button>

                {/* Entregado */}
                <button
                  onClick={() => setNuevoEstadoSeleccionado("delivered")}
                  disabled={isUpdatingStatus}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                    nuevoEstadoSeleccionado === "delivered"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-green-300 hover:bg-green-50"
                  } ${isUpdatingStatus ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckIcon className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      Entregado
                    </p>
                  </div>
                  {nuevoEstadoSeleccionado === "delivered" && (
                    <CheckIcon className="h-4 w-4 text-green-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="px-4 py-3 border-t border-gray-200">
              <button
                onClick={confirmarCambioEstado}
                disabled={isUpdatingStatus}
                className={`w-full bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium ${
                  isUpdatingStatus ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isUpdatingStatus ? "Actualizando..." : "Actualizar estatus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
