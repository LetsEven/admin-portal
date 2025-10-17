import React, { useState, useEffect } from 'react';
import { BarChart2Icon, UsersIcon, ShoppingBagIcon, TrendingUpIcon, ChevronDownIcon, MapPinIcon, CheckIcon, XIcon, ClockIcon, DollarSignIcon, UserIcon, ShoppingCartIcon, RotateCcwIcon, CrownIcon, StarIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAnalytics, type AnalyticsFilters } from '../hooks/useAnalytics';

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

// Datos para el gráfico de ingresos
// const datosGrafico = [
//   { dia: 1, ingresos: 16500 },
//   { dia: 2, ingresos: 17000 },
//   { dia: 3, ingresos: 18500 },
//   { dia: 4, ingresos: 19200 },
//   { dia: 5, ingresos: 19800 },
//   { dia: 6, ingresos: 20500 },
//   { dia: 7, ingresos: 21200 },
//   { dia: 8, ingresos: 21800 },
//   { dia: 9, ingresos: 22500 },
//   { dia: 10, ingresos: 22800 },
//   { dia: 11, ingresos: 23200 },
//   { dia: 12, ingresos: 23800 },
//   { dia: 13, ingresos: 24200 },
//   { dia: 14, ingresos: 25000 },
//   { dia: 15, ingresos: 25300 },
//   { dia: 16, ingresos: 24800 },
//   { dia: 17, ingresos: 24500 },
//   { dia: 18, ingresos: 24200 },
//   { dia: 19, ingresos: 24000 },
//   { dia: 20, ingresos: 23800 },
//   { dia: 21, ingresos: 24200 },
//   { dia: 22, ingresos: 24600 },
//   { dia: 23, ingresos: 25100 },
//   { dia: 24, ingresos: 25800 },
//   { dia: 25, ingresos: 26200 },
//   { dia: 26, ingresos: 26800 },
//   { dia: 27, ingresos: 27200 },
//   { dia: 28, ingresos: 27800 },
//   { dia: 29, ingresos: 28200 },
//   { dia: 30, ingresos: 29500 },
//   { dia: 31, ingresos: 30200 }
// ];

// Opciones de filtros
const opcionesGenero = [
  { id: 'todos', label: 'Todos' },
  { id: 'male', label: 'Hombre' },
  { id: 'female', label: 'Mujer' },
  { id: 'non-binary', label: 'No binario' },
  { id: 'prefer-not-to-say', label: 'Prefiero no decir' }
];

const opcionesEdad = [
  { id: 'todos', label: 'Todos' },
  { id: '14-17', label: '14 - 17' },
  { id: '18-25', label: '18 - 25' },
  { id: '26-35', label: '26 - 35' },
  { id: '36-45', label: '36 - 45' },
  { id: '46+', label: '46 +' }
];

const opcionesGranularidad = [
  { id: 'hora', label: 'Hora' },
  { id: 'dia', label: 'Día' },
  { id: 'mes', label: 'Mes' },
  { id: 'ano', label: 'Año' }
];

// Esta será reemplazada por datos reales del hook
const sucursalesDefault = [{
  id: 1,
  name: 'Cargando...',
  is_active: true
}];

// Datos de ejemplo para pedidos
// const pedidosEjemplo = [{
//   id: 1123,
//   numeropedido: '#1123',
//   cliente: 'Juan Pérez',
//   canal: 'Tap Order & Pay',
//   tiempo: 'Hace 15 minutos',
//   estado: 'Completado',
//   items: [
//     { nombre: 'Hamburguesa Clásica', cantidad: 2, precio: 12.99 },
//     { nombre: 'Papas Fritas', cantidad: 1, precio: 6.99 },
//     { nombre: 'Coca Cola', cantidad: 2, precio: 3.50 }
//   ],
//   subtotal: 36.47,
//   propina: 5.00,
//   total: 41.47
// }, {
//   id: 1246,
//   numeropedido: '#1246',
//   cliente: 'María González',
//   canal: 'Pick N Go',
//   tiempo: 'Hace 25 minutos',
//   estado: 'Completado',
//   items: [
//     { nombre: 'Pizza Margherita', cantidad: 1, precio: 18.99 },
//     { nombre: 'Ensalada César', cantidad: 1, precio: 8.99 },
//     { nombre: 'Agua Mineral', cantidad: 1, precio: 2.50 }
//   ],
//   subtotal: 30.48,
//   propina: 4.50,
//   total: 34.98
// }, {
//   id: 1369,
//   numeropedido: '#1369',
//   cliente: 'Carlos Mendoza',
//   canal: 'Pick N Go',
//   tiempo: 'Hace 35 minutos',
//   estado: 'Completado',
//   items: [
//     { nombre: 'Tacos al Pastor', cantidad: 3, precio: 4.99 },
//     { nombre: 'Guacamole', cantidad: 1, precio: 5.99 },
//     { nombre: 'Cerveza Corona', cantidad: 2, precio: 4.50 }
//   ],
//   subtotal: 29.96,
//   propina: 6.00,
//   total: 35.96
// }, {
//   id: 1492,
//   numeroPedido: '#1492',
//   cliente: 'Ana López',
//   canal: 'Tap Order & Pay',
//   tiempo: 'Hace 45 minutos',
//   estado: 'Completado',
//   items: [
//     { nombre: 'Sushi Roll', cantidad: 2, precio: 15.99 },
//     { nombre: 'Sopa Miso', cantidad: 1, precio: 6.99 },
//     { nombre: 'Té Verde', cantidad: 1, precio: 3.50 }
//   ],
//   subtotal: 42.47,
//   propina: 8.00,
//   total: 50.47
// }, {
//   id: 1615,
//   numeroPedido: '#1615',
//   cliente: 'Roberto Silva',
//   canal: 'Pick N Go',
//   tiempo: 'Hace 55 minutos',
//   estado: 'Completado',
//   items: [
//     { nombre: 'Pasta Carbonara', cantidad: 1, precio: 16.99 },
//     { nombre: 'Pan de Ajo', cantidad: 1, precio: 4.99 },
//     { nombre: 'Vino Tinto', cantidad: 1, precio: 22.00 }
//   ],
//   subtotal: 43.98,
//   propina: 7.50,
//   total: 51.48
// }];

const CustomTooltip = ({ active, payload, label, granularidad, mesSeleccionado, diaSeleccionado }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];

    const obtenerTextoPeriodo = () => {
      switch (granularidad) {
        case 'hora':
          if (diaSeleccionado) {
            const [dia, mes, año] = diaSeleccionado.split('/');
            const fechaSeleccionada = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
            const fechaFormateada = fechaSeleccionada.toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
            return `${label.toString().padStart(2, '0')}:00 del ${fechaFormateada}`;
          } else {
            const mesNombre = mesSeleccionado.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            return `${label.toString().padStart(2, '0')}:00 del ${label} de ${mesNombre}`;
          }
        case 'dia':
          const mesNombreDia = mesSeleccionado.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
          return `Día ${label} de ${mesNombreDia}`;
        case 'mes':
          return `${label} ${mesSeleccionado.getFullYear()}`;
        case 'ano':
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
    activeOrders,
    topSellingItem,
    userRestaurants,
    isLoading,
    isLoadingOrders,
    isLoadingTopItem,
    isLoadingRestaurants,
    error,
    getDashboardMetrics,
    getCompleteDashboardData,
    getActiveOrders,
    getTopSellingItem,
    getUserRestaurants,
    getDashboardSummary,
    clearError
  } = useAnalytics();

  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(sucursalesDefault[0]);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalPro, setMostrarModalPro] = useState(false);
  const [mostrarDebugPanel, setMostrarDebugPanel] = useState(false);

  // Estados para filtros
  const [generoSeleccionado, setGeneroSeleccionado] = useState(opcionesGenero[0]);
  const [edadSeleccionada, setEdadSeleccionada] = useState(opcionesEdad[0]);
  const [dropdownGeneroAbierto, setDropdownGeneroAbierto] = useState(false);
  const [dropdownEdadAbierto, setDropdownEdadAbierto] = useState(false);

  // Estados para granularidad
  const [granularidadSeleccionada, setGranularidadSeleccionada] = useState(opcionesGranularidad[1]); // Día por defecto
  const [dropdownGranularidadAbierto, setDropdownGranularidadAbierto] = useState(false);

  const fechaActual = new Date();
  const diaActual = fechaActual.getDate().toString().padStart(2, '0');
  const mesActualStr = (fechaActual.getMonth() + 1).toString().padStart(2, '0');
  const añoActual = fechaActual.getFullYear();
  const [diaSeleccionado, setDiaSeleccionado] = useState(`${diaActual}/${mesActualStr}/${añoActual}`);
  const [rangoHoras, setRangoHoras] = useState([0, 23]);

  const [calendarioAbierto, setCalendarioAbierto] = useState(false);
  const [mesActual, setMesActual] = useState(new Date()); // Fecha actual del sistema
  const [diaSeleccionadoCalendario, setDiaSeleccionadoCalendario] = useState(new Date().getDate());
  const [mesSeleccionadoParaGrafico, setMesSeleccionadoParaGrafico] = useState(new Date(2025, 9, 1)); // Para granularidades que no sean Hora
  const [selectorMesAbierto, setSelectorMesAbierto] = useState(false);

  const [selectorAnoAbierto, setSelectorAnoAbierto] = useState(false);
  const [anoSeleccionado, setAnoSeleccionado] = useState(2025);
  const [rangoAnosInicio, setRangoAnosInicio] = useState(2017);

  
  const cambiarSucursal = (sucursal) => {
    setSucursalSeleccionada(sucursal);
    setDropdownAbierto(false);
    cargarDatosDashboard(sucursal.id);
  };

  const formatearFechaLocal = (fecha: Date): string => {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    const segundos = String(fecha.getSeconds()).padStart(2, '0');
    const milisegundos = String(fecha.getMilliseconds()).padStart(3, '0');

    return `${año}-${mes}-${dia}T${horas}:${minutos}:${segundos}.${milisegundos}`;
  };

  // Función para cargar datos del dashboard
  const cargarDatosDashboard = (restaurantId = null, customFilters = {}, customRangoHoras = null, customDiaSeleccionado = null) => {
    const currentGranularity = customFilters.granularity || granularidadSeleccionada.id;
    let startDate = null;
    let endDate = null;

    // Si la granularidad es "hora", usar fecha y rango de horas específicos
    if (currentGranularity === 'hora') {
      const rangoActual = customRangoHoras || rangoHoras;

      const fechaAUsar = customDiaSeleccionado || diaSeleccionado;

      const [dia, mes, año] = fechaAUsar.split('/');
      const fechaBase = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));

      const fechaBaseISO = `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      const horaInicioStr = rangoActual[0].toString().padStart(2, '0');
      const startDateISO = `${fechaBaseISO}T${horaInicioStr}:00:00.000`;
      startDate = new Date(startDateISO);

      endDate = new Date(fechaBase);
      endDate.setHours(rangoActual[1], 59, 59, 999);

    }
    // Si la granularidad es "día", usar el mes seleccionado
    else if (currentGranularity === 'dia') {
      const fechaMes = mesSeleccionadoParaGrafico;

      // Primer día del mes a las 00:00:00
      startDate = new Date(fechaMes.getFullYear(), fechaMes.getMonth(), 1, 0, 0, 0, 0);

      // Último día del mes a las 23:59:59.999
      endDate = new Date(fechaMes.getFullYear(), fechaMes.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const filtros: AnalyticsFilters = {
      restaurant_id: restaurantId,
      start_date: startDate ? formatearFechaLocal(startDate) : null,
      end_date: endDate ? formatearFechaLocal(endDate) : null,
      gender: customFilters.gender || generoSeleccionado.id as any,
      age_range: customFilters.age_range || edadSeleccionada.id as any,
      granularity: currentGranularity as any
    };

    getCompleteDashboardData(filtros);

    // Cargar órdenes activas si hay restaurante seleccionado
    if (restaurantId) {
      getActiveOrders(restaurantId);
    }
  };

  const cambiarGenero = (genero: any) => {
    
    setGeneroSeleccionado(genero);
    setDropdownGeneroAbierto(false);
    cargarDatosDashboard(sucursalSeleccionada?.id, { gender: genero.id });
  };

  const cambiarEdad = (edad: any) => {
    setEdadSeleccionada(edad);
    setDropdownEdadAbierto(false);
    cargarDatosDashboard(sucursalSeleccionada?.id, { age_range: edad.id });
  };

  const cambiarGranularidad = (granularidad:any) => {
    setGranularidadSeleccionada(granularidad);
    setDropdownGranularidadAbierto(false);
    cargarDatosDashboard(sucursalSeleccionada?.id, { granularity: granularidad.id });
  };

  const cambiarMesParaGrafico = (direccion: any) => {
    const nuevaFecha = new Date(mesSeleccionadoParaGrafico);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
    setMesSeleccionadoParaGrafico(nuevaFecha);
  };

  // Funciones para el selector de años
  const obtenerAnosDelRango = () => {
    const anos = [];
    for (let i = 0; i < 12; i++) { // Mostrar 12 años (6 filas x 2 columnas)
      anos.push(rangoAnosInicio + i);
    }
    return anos;
  };

  const cambiarRangoAnos = (direccion: any) => {
    setRangoAnosInicio(rangoAnosInicio + (direccion * 12));
  };

  const seleccionarAno = (ano: any) => {
    setAnoSeleccionado(ano);
    const nuevaFecha = new Date(mesSeleccionadoParaGrafico);
    nuevaFecha.setFullYear(ano);
    setMesSeleccionadoParaGrafico(nuevaFecha);
    setSelectorAnoAbierto(false);
  };


  const obtenerDiasDelMes = (fecha:any) => {
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

  const seleccionarDia = (dia:any) => {
    setDiaSeleccionadoCalendario(dia);

    const fechaFormateada = `${dia.toString().padStart(2, '0')}/${(mesActual.getMonth() + 1).toString().padStart(2, '0')}/${mesActual.getFullYear()}`;
    setDiaSeleccionado(fechaFormateada);
    setCalendarioAbierto(false);

    if (granularidadSeleccionada.id === 'hora') {
      const customFilters = {
        ...(generoSeleccionado.id !== 'todos' && { gender: generoSeleccionado.id }),
        ...(edadSeleccionada.id !== 'todos' && { age_range: edadSeleccionada.id })
      };

      cargarDatosDashboard(sucursalSeleccionada?.id, customFilters, null, fechaFormateada);
    }
  };

  const cambiarHoraInicio = (nuevaHora: number) => {
    if (nuevaHora < rangoHoras[1]) {
      const nuevoRango = [nuevaHora, rangoHoras[1]];
      setRangoHoras(nuevoRango);

      if (granularidadSeleccionada.id === 'hora') {
        cargarDatosDashboard(sucursalSeleccionada?.id, {}, nuevoRango);
      }
    }
  };

  const cambiarHoraFin = (nuevaHora: number) => {
    if (nuevaHora > rangoHoras[0]) {
      const nuevoRango = [rangoHoras[0], nuevaHora];
      setRangoHoras(nuevoRango);

      if (granularidadSeleccionada.id === 'hora') {
        cargarDatosDashboard(sucursalSeleccionada?.id, {}, nuevoRango);
      }
    }
  };

  const obtenerDatosGrafico = () => {
    if (!dashboardData?.grafico) {
      return [];
    }

    if (granularidadSeleccionada.id === 'hora') {
      const datosOriginales = dashboardData.grafico;
      const datosCompletos = [];

      for (let hora = rangoHoras[0]; hora <= rangoHoras[1]; hora++) {
        const datoExistente = datosOriginales.find(item => item.hora === hora);

        if (datoExistente) {
          datosCompletos.push(datoExistente);
        } else {
          datosCompletos.push({
            hora: hora,
            ingresos: 0
          });
        }
      }

      return datosCompletos;
    }

    if (granularidadSeleccionada.id === 'dia') {
      const datosOriginales = dashboardData.grafico;
      const datosCompletos = [];

      const diasEnMes = new Date(
        mesSeleccionadoParaGrafico.getFullYear(),
        mesSeleccionadoParaGrafico.getMonth() + 1,
        0
      ).getDate();

      for (let dia = 1; dia <= diasEnMes; dia++) {
        const datoExistente = datosOriginales.find(item => item.dia === dia);

        if (datoExistente) {
          datosCompletos.push(datoExistente);
        } else {
          datosCompletos.push({
            dia: dia,
            ingresos: 0
          });
        }
      }

      return datosCompletos;
    }

    return dashboardData.grafico;
  };

  const obtenerTituloGrafico = () => {
    switch (granularidadSeleccionada.id) {
      case 'hora':
        const fechaSeleccionada = new Date(mesActual.getFullYear(), mesActual.getMonth(), diaSeleccionadoCalendario);
        const fechaFormateada = fechaSeleccionada.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        return `Ingresos Totales por hora (${fechaFormateada})`;

      case 'dia':
        const mesAnio = mesSeleccionadoParaGrafico.toLocaleDateString('es-ES', {
          month: 'long',
          year: 'numeric'
        });
        return `Ingresos Totales por día (${mesAnio})`;

      case 'mes':
        return `Ingresos Totales por mes (${mesSeleccionadoParaGrafico.getFullYear()})`;

      case 'ano':
        return `Ingresos Totales por año`;

      default:
        return `Ingresos Totales por día (octubre de 2025)`;
    }
  };

  const obtenerConfiguracionEjeX = () => {
    switch (granularidadSeleccionada.id) {
      case 'hora':
        return {
          dataKey: 'hora',
          tickFormatter: (value: any) => `${value.toString().padStart(2, '0')}:00`,
          interval: 2
        };
      case 'dia':
        const diasEnMes = new Date(mesSeleccionadoParaGrafico.getFullYear(), mesSeleccionadoParaGrafico.getMonth() + 1, 0).getDate();
        return {
          dataKey: 'dia',
          tickFormatter: (value: any) => value.toString(),
          interval: diasEnMes > 31 ? 3 : diasEnMes > 29 ? 2 : 1
        };
      case 'mes':
        return {
          dataKey: 'mes',
          tickFormatter: (value: any) => value,
          interval: 0
        };
      case 'ano':
        return {
          dataKey: 'ano',
          tickFormatter: (value: any) => value.toString(),
          interval: 0
        };
      default:
        return {
          dataKey: 'dia',
          tickFormatter: (value: any) => value.toString(),
          interval: 2
        };
    }
  };

  const abrirDetallesPedido = (pedido: any) => {
    setPedidoSeleccionado(pedido);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setPedidoSeleccionado(null);
  };

  useEffect(() => {
    if (userRestaurants.length > 0 && sucursalSeleccionada.name === 'Cargando...') {
      setSucursalSeleccionada(userRestaurants[0]);
      cargarDatosDashboard(userRestaurants[0].id);
    }
  }, [userRestaurants]);

  useEffect(() => {
    if (error) {
      console.error('Error en analytics:', error);
      // Aquí podrías mostrar una notificación de error al usuario
    }
  }, [error]);

  // Recargar datos cuando cambia el mes seleccionado para granularidad "día"
  useEffect(() => {
    if (granularidadSeleccionada.id === 'dia' && sucursalSeleccionada?.id) {
      cargarDatosDashboard(sucursalSeleccionada.id);
    }
  }, [mesSeleccionadoParaGrafico, granularidadSeleccionada.id]);

  // Debug: Log automático para verificar datos
  console.log('🔍 DEBUG Dashboard - Datos recibidos:', {
    dashboardData: dashboardData,
    filtroAplicados: dashboardData?.filtros_aplicados,
    activeOrders: activeOrders,
    topSellingItem: topSellingItem,
    userRestaurants: userRestaurants,
    sucursalSeleccionada: sucursalSeleccionada,
    isLoading: isLoading
  });

  return <div className="w-full">
      {/* Estilos para los sliders */}
      <style dangerouslySetInnerHTML={{ __html: sliderStyles }} />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2 mt-4">
            Xquisito Administrador
          </h1>
          <p className="text-sm text-gray-500">
            Bienvenido al panel de administración
          </p>
        </div>

        {/* Botones de Debug */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              console.log('📊 DATOS COMPLETOS DEL DASHBOARD:', {
                dashboardData,
                activeOrders,
                topSellingItem,
                userRestaurants,
                filtrosActuales: {
                  restaurante: sucursalSeleccionada,
                  genero: generoSeleccionado,
                  edad: edadSeleccionada,
                  granularidad: granularidadSeleccionada
                }
              });
              alert('✅ Datos enviados a la consola del navegador.\n\nAbre las herramientas de desarrollador (F12) y ve a la pestaña "Console" para ver los datos detallados.');
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium shadow"
          >
            🔍 Debug Consola
          </button>
          <button
            onClick={() => setMostrarDebugPanel(!mostrarDebugPanel)}
            className={`px-4 py-2 text-white rounded text-sm font-medium shadow ${
              mostrarDebugPanel
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {mostrarDebugPanel ? '❌ Ocultar Panel' : '📋 Panel Debug'}
          </button>
        </div>
      </div>

      {/* Filtros superiores */}
      <div className="flex flex-wrap gap-4 mb-6 justify-center">
        {/* Filtro Género */}
        <div className="relative">
          <button
            onClick={() => setDropdownGeneroAbierto(!dropdownGeneroAbierto)}
            className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:ring-offset-2"
          >
            <UsersIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Género:</span>
            <span className="text-sm font-medium text-gray-800">{generoSeleccionado.label}</span>
            <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${dropdownGeneroAbierto ? 'transform rotate-180' : ''}`} />
          </button>
          {dropdownGeneroAbierto && (
            <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1 animate-in fade-in duration-100 ease-out">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Seleccionar género
                </p>
              </div>
              <ul className="py-1">
                {opcionesGenero.map(genero => (
                  <li key={genero.id}>
                    <button
                      onClick={() => cambiarGenero(genero)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-800">{genero.label}</span>
                      {generoSeleccionado.id === genero.id && <CheckIcon className="h-4 w-4 text-custom-green-600" />}
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
            className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:ring-offset-2"
          >
            <UserIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Edad:</span>
            <span className="text-sm font-medium text-gray-800">{edadSeleccionada.label}</span>
            <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${dropdownEdadAbierto ? 'transform rotate-180' : ''}`} />
          </button>
          {dropdownEdadAbierto && (
            <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1 animate-in fade-in duration-100 ease-out">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Seleccionar edad
                </p>
              </div>
              <ul className="py-1">
                {opcionesEdad.map(edad => (
                  <li key={edad.id}>
                    <button
                      onClick={() => cambiarEdad(edad)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-800">{edad.label}</span>
                      {edadSeleccionada.id === edad.id && <CheckIcon className="h-4 w-4 text-custom-green-600" />}
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
            className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:ring-offset-2"
          >
            <MapPinIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Sucursal:</span>
            <span className="text-sm font-medium text-gray-800">{sucursalSeleccionada.name}</span>
            <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${dropdownAbierto ? 'transform rotate-180' : ''}`} />
          </button>
          {dropdownAbierto && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1 animate-in fade-in duration-100 ease-out">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Seleccionar sucursal
                </p>
              </div>
              <ul className="max-h-64 overflow-y-auto py-1">
                {isLoadingRestaurants ? (
                  <li className="px-4 py-2 text-sm text-gray-500">Cargando restaurantes...</li>
                ) : userRestaurants.length > 0 ? (
                  userRestaurants.map(restaurant => (
                    <li key={restaurant.id}>
                      <button
                        onClick={() => cambiarSucursal(restaurant)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {restaurant.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {restaurant.id}
                          </p>
                        </div>
                        {sucursalSeleccionada.id === restaurant.id && <CheckIcon className="h-4 w-4 text-custom-green-600" />}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-sm text-gray-500">No hay restaurantes disponibles</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Selector de granularidad y controles específicos */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="relative">
            <button
              onClick={() => setDropdownGranularidadAbierto(!dropdownGranularidadAbierto)}
              className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:ring-offset-2"
            >
              <ClockIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Granularidad:</span>
              <span className="text-sm font-medium text-gray-800">{granularidadSeleccionada.label}</span>
              <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${dropdownGranularidadAbierto ? 'transform rotate-180' : ''}`} />
            </button>
            {dropdownGranularidadAbierto && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1 animate-in fade-in duration-100 ease-out">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    Seleccionar granularidad
                  </p>
                </div>
                <ul className="py-1">
                  {opcionesGranularidad.map(granularidad => (
                    <li key={granularidad.id}>
                      <button
                        onClick={() => cambiarGranularidad(granularidad)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-800">{granularidad.label}</span>
                        {granularidadSeleccionada.id === granularidad.id && <CheckIcon className="h-4 w-4 text-custom-green-600" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Selector de mes (para granularidad Día) */}
          {granularidadSeleccionada.id === 'dia' && (
            <div className="relative">
              <button
                onClick={() => setSelectorMesAbierto(!selectorMesAbierto)}
                className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:ring-offset-2"
              >
                <span className="text-sm text-gray-600">Mes:</span>
                <span className="text-sm font-medium text-gray-800">
                  {(mesSeleccionadoParaGrafico.getMonth() + 1).toString().padStart(2, '0')}/{mesSeleccionadoParaGrafico.getFullYear()}
                </span>
                <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${selectorMesAbierto ? 'transform rotate-180' : ''}`} />
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
                      {mesSeleccionadoParaGrafico.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
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
          {granularidadSeleccionada.id === 'mes' && (
            <div className="relative">
              <button
                onClick={() => setSelectorAnoAbierto(!selectorAnoAbierto)}
                className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:ring-offset-2"
              >
                <span className="text-sm text-gray-600">Año:</span>
                <span className="text-sm font-medium text-gray-800">{anoSeleccionado}</span>
                <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${selectorAnoAbierto ? 'transform rotate-180' : ''}`} />
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
                    {obtenerAnosDelRango().map(ano => (
                      <button
                        key={ano}
                        onClick={() => seleccionarAno(ano)}
                        className={`
                          p-2 text-sm rounded transition-colors text-center
                          ${ano === anoSeleccionado
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'text-gray-700 hover:bg-gray-100'
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

        {/* Controles específicos para granularidad Hora */}
        {granularidadSeleccionada.id === 'hora' && (
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-200">
            {/* Selector de día con calendario */}
            <div className="relative">
              <button
                onClick={() => setCalendarioAbierto(!calendarioAbierto)}
                className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:ring-offset-2"
              >
                <span className="text-sm text-gray-600">Día:</span>
                <span className="text-sm font-medium text-gray-800">{diaSeleccionado}</span>
                <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${calendarioAbierto ? 'transform rotate-180' : ''}`} />
              </button>

              {/* Calendario desplegable */}
              {calendarioAbierto && (
                <div className="absolute left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-20 p-4 w-64">
                  {/* Header del calendario */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => cambiarMes(-1)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <ChevronDownIcon className="h-4 w-4 transform rotate-90 text-gray-600" />
                    </button>
                    <h3 className="text-sm font-medium text-gray-900">
                      {mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button
                      onClick={() => cambiarMes(1)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <ChevronDownIcon className="h-4 w-4 transform -rotate-90 text-gray-600" />
                    </button>
                  </div>

                  {/* Días de la semana */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(dia => (
                      <div key={dia} className="text-xs font-medium text-gray-500 text-center p-2">
                        {dia}
                      </div>
                    ))}
                  </div>

                  {/* Días del mes */}
                  <div className="grid grid-cols-7 gap-1">
                    {obtenerDiasDelMes(mesActual).map((diaInfo, index) => (
                      <button
                        key={index}
                        onClick={() => !diaInfo.esOtroMes && seleccionarDia(diaInfo.dia)}
                        disabled={diaInfo.esOtroMes}
                        className={`
                          p-2 text-sm rounded transition-colors
                          ${diaInfo.esOtroMes
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                          }
                          ${diaInfo.dia === diaSeleccionadoCalendario && !diaInfo.esOtroMes
                            ? 'bg-custom-green-500 text-white hover:bg-custom-green-600'
                            : ''
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

            {/* Range slider para horas */}
            <div className="flex-1 mx-6">
              <div className="text-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Rango de horas: {rangoHoras[0].toString().padStart(2, '0')}:00 - {rangoHoras[1].toString().padStart(2, '0')}:00
                </span>
              </div>

              {/* Controles separados para cada slider */}
              <div className="space-y-4">
                {/* Slider de hora inicio */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Hora Inicio: {rangoHoras[0].toString().padStart(2, '0')}:00
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="23"
                      value={rangoHoras[0]}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value);
                        cambiarHoraInicio(newValue);
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-inicio"
                      style={{
                        background: `linear-gradient(to right, #10b981 0%, #10b981 ${(rangoHoras[0] / 23) * 100}%, #e5e7eb ${(rangoHoras[0] / 23) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                </div>

                {/* Slider de hora final */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Hora Final: {rangoHoras[1].toString().padStart(2, '0')}:00
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="23"
                      value={rangoHoras[1]}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value);
                        cambiarHoraFin(newValue);
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-final"
                      style={{
                        background: `linear-gradient(to right, #e5e7eb 0%, #e5e7eb ${(rangoHoras[1] / 23) * 100}%, #10b981 ${(rangoHoras[1] / 23) * 100}%, #10b981 100%)`
                      }}
                    />
                  </div>
                </div>

                {/* Visualización del rango completo */}
                <div className="mt-4">
                  <div className="text-xs text-gray-500 mb-1">Rango seleccionado:</div>
                  <div className="w-full h-3 bg-gray-200 rounded-full relative">
                    <div
                      className="h-3 bg-custom-green-500 rounded-full absolute"
                      style={{
                        left: `${(rangoHoras[0] / 23) * 100}%`,
                        width: `${((rangoHoras[1] - rangoHoras[0]) / 23) * 100}%`
                      }}
                    ></div>
                  </div>
                  {/* Marcadores de tiempo */}
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>0:00</span>
                    <span>6:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>23:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gráfico de Ingresos Totales */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {obtenerTituloGrafico()}
        </h3>

        {/* Gráfico de líneas con Recharts */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={obtenerDatosGrafico()}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey={obtenerConfiguracionEjeX().dataKey}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={obtenerConfiguracionEjeX().tickFormatter}
                interval={obtenerConfiguracionEjeX().interval}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
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
                    mesSeleccionado={granularidadSeleccionada.id === 'hora' ? mesActual : mesSeleccionadoParaGrafico}
                    diaSeleccionado={granularidadSeleccionada.id === 'hora' ? diaSeleccionado : null}
                  />
                )}
              />
              <Line
                type="monotone"
                dataKey="ingresos"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Panel de Debug */}
      {mostrarDebugPanel && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-3 flex items-center">
            🔧 Panel de Debug - Datos del Dashboard
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
            {/* Métricas del Dashboard */}
            <div className="bg-white p-3 rounded border">
              <h4 className="font-medium text-gray-700 mb-2">📊 Métricas del Dashboard:</h4>
              <div className="space-y-1 text-xs">
                <div><strong>Ventas Totales:</strong> ${dashboardData?.metricas?.ventas_totales || 'Sin datos'}</div>
                <div><strong>Órdenes Activas:</strong> {dashboardData?.metricas?.ordenes_activas || 'Sin datos'}</div>
                <div><strong>Total Pedidos:</strong> {dashboardData?.metricas?.pedidos || 'Sin datos'}</div>
                <div><strong>Ticket Promedio:</strong> ${dashboardData?.metricas?.ticket_promedio || 'Sin datos'}</div>
                <div><strong>Tiempo Promedio Mesa:</strong> {dashboardData?.tiempo_promedio_mesa?.tiempo_promedio_formateado || 'Sin datos'}</div>
                <div><strong>Mesas Analizadas:</strong> {dashboardData?.tiempo_promedio_mesa?.mesas_cerradas_analizadas || '0'}</div>
              </div>
            </div>

            {/* Estado de Carga */}
            <div className="bg-white p-3 rounded border">
              <h4 className="font-medium text-gray-700 mb-2">⏳ Estados de Carga:</h4>
              <div className="space-y-1 text-xs">
                <div><strong>Dashboard:</strong> {isLoading ? '🔄 Cargando' : '✅ Listo'}</div>
                <div><strong>Órdenes:</strong> {isLoadingOrders ? '🔄 Cargando' : '✅ Listo'}</div>
                <div><strong>Top Item:</strong> {isLoadingTopItem ? '🔄 Cargando' : '✅ Listo'}</div>
                <div><strong>Restaurantes:</strong> {isLoadingRestaurants ? '🔄 Cargando' : '✅ Listo'}</div>
              </div>
            </div>

            {/* Filtros Actuales */}
            <div className="bg-white p-3 rounded border">
              <h4 className="font-medium text-gray-700 mb-2">🎛️ Filtros Actuales:</h4>
              <div className="space-y-1 text-xs">
                <div><strong>Restaurante:</strong> {sucursalSeleccionada?.name || 'Sin seleccionar'}</div>
                <div><strong>Género:</strong> {generoSeleccionado?.label || 'Sin filtro'}</div>
                <div><strong>Edad:</strong> {edadSeleccionada?.label || 'Sin filtro'}</div>
                <div><strong>Granularidad:</strong> {granularidadSeleccionada?.label || 'Sin seleccionar'}</div>
                {granularidadSeleccionada?.id === 'hora' && (
                  <>
                    <div><strong>📅 Día:</strong> {diaSeleccionado}</div>
                    <div><strong>⏰ Horas:</strong> {rangoHoras[0]}:00 - {rangoHoras[1]}:00</div>
                  </>
                )}
              </div>
            </div>

            {/* Datos de Gráfico */}
            <div className="bg-white p-3 rounded border">
              <h4 className="font-medium text-gray-700 mb-2">📈 Datos del Gráfico:</h4>
              <div className="space-y-1 text-xs">
                <div><strong>Puntos de datos:</strong> {dashboardData?.grafico?.length || 0}</div>
                <div><strong>Órdenes activas:</strong> {activeOrders?.length || 0}</div>
                <div><strong>Top Item:</strong> {topSellingItem?.nombre || 'Sin datos'}</div>
                <div><strong>Error:</strong> {error ? '❌ Sí' : '✅ No'}</div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-yellow-200">
            <p className="text-xs text-yellow-700">
              💡 <strong>Tip:</strong> Usa el botón "🔍 Debug Consola" para ver datos completos en la consola del navegador (F12)
            </p>
          </div>
        </div>
      )}

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Ventas totales */}
        <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-custom-green-100 p-3 rounded-full">
                <BarChart2Icon className="h-6 w-6 text-custom-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Ventas totales
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {isLoading ? 'Cargando...' : `$${dashboardData?.metricas?.ventasTotales?.toLocaleString() || '0'}`}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
            <div className="text-sm">
              <a href="#" className="font-medium text-custom-green-600 hover:text-custom-green-800 flex items-center">
                Ver todo
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Órdenes Activas */}
        <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
                <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Órdenes Activas
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {isLoading ? 'Cargando...' : (dashboardData?.metricas?.ordenesActivas || '0')}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
            <div className="text-sm">
              <a href="#" className="font-medium text-custom-green-600 hover:text-custom-green-800 flex items-center">
                Ver todo
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Pedidos */}
        <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-amber-100 p-3 rounded-full">
                <ShoppingBagIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pedidos
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {isLoading ? 'Cargando...' : (dashboardData?.metricas?.pedidos || '0')}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
            <div className="text-sm">
              <a href="#" className="font-medium text-custom-green-600 hover:text-custom-green-800 flex items-center">
                Ver todo
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 p-3 rounded-full">
                <DollarSignIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Ticket Promedio
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {isLoading ? 'Cargando...' : `$${dashboardData?.metricas?.ticketPromedio?.toLocaleString() || '0'}`}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
            <div className="text-sm">
              <a href="#" className="font-medium text-custom-green-600 hover:text-custom-green-800 flex items-center">
                Ver todo
                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Secciones adicionales */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
        {/* Órdenes Totales */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-custom-green-100 p-2 rounded-full">
                <CheckIcon className="h-5 w-5 text-custom-green-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Órdenes Totales</h3>
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {isLoading ? 'Cargando...' : (dashboardData?.metricas?.pedidos || '0')}
          </div>
          <div className="text-sm">
            <a href="#" className="font-medium text-custom-green-600 hover:text-custom-green-800 flex items-center">
              Ver todo
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        {/* Artículo más vendido */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-amber-100 p-2 rounded-full">
                <CrownIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Artículo más vendido</h3>
              </div>
            </div>
          </div>
          <div className="text-lg font-bold text-gray-900 mb-1">
            {isLoadingTopItem ? 'Cargando...' : (dashboardData?.articulo_mas_vendido?.nombre || topSellingItem?.nombre || 'Sin datos')}
          </div>
          <div className="text-sm text-gray-500 mb-3">
            {isLoadingTopItem ? 'Cargando...' : `${dashboardData?.articulo_mas_vendido?.unidades_vendidas || topSellingItem?.unidades_vendidas || 0} unidades`}
          </div>
          <div className="text-sm">
            <a href="#" className="font-medium text-custom-green-600 hover:text-custom-green-800 flex items-center">
              Ver todo
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        {/* Tiempo Promedio x cuenta */}
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 p-2 rounded-full">
                <ClockIcon className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Tiempo Promedio x cuenta</h3>
              </div>
            </div>
            <span className="bg-gray-800 text-white text-xs font-medium px-2 py-1 rounded">
              Flex Bill
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {isLoading ? 'Cargando...' : (dashboardData?.tiempo_promedio_mesa?.tiempo_promedio_formateado || 'Sin datos')}
          </div>
          <div className="text-sm">
            <a href="#" className="font-medium text-custom-green-600 hover:text-custom-green-800 flex items-center">
              Ver todo
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      {/* Recent Activity */}
      <div className="mt-7">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            Actividad reciente
            <span className="ml-2 bg-custom-green-100 text-custom-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              Hoy
            </span>
          </h2>
          <button
            onClick={() => cargarDatosDashboard(sucursalSeleccionada?.id)}
            disabled={isLoading}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            <RotateCcwIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
        <div className="mt-4 bg-white shadow-md overflow-hidden sm:rounded-lg border border-gray-100">
          <ul className="divide-y divide-gray-200">
            {isLoadingOrders ? (
              <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                Cargando órdenes activas...
              </li>
            ) : activeOrders.length > 0 ? (
              activeOrders.map(order => <li key={order.id} className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer" onClick={() => abrirDetallesPedido(order)}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-custom-green-600 truncate">
                      Mesa #{order.table_number}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {order.status === 'not_paid' ? 'Pendiente' : order.status === 'partial' ? 'Parcial' : order.status}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex sm:flex-col sm:space-y-1">
                      <p className="flex items-center text-sm text-gray-500">
                        <DollarSignIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        Total: ${order.total_amount} | Pagado: ${order.paid_amount}
                      </p>
                      <p className="flex items-center text-xs text-custom-green-600 font-medium">
                        <ShoppingCartIcon className="flex-shrink-0 mr-1.5 h-3 w-3 text-custom-green-500" />
                        {order.items_count} items
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>{new Date(order.created_at).toLocaleString('es-ES')}</p>
                    </div>
                  </div>
                </div>
              </li>)
            ) : (
              <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                No hay órdenes activas
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Modal de Detalles del Pedido */}
      {mostrarModal && pedidoSeleccionado && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]" onClick={cerrarModal}></div>
          <div className="relative bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalles del Pedido
                </h3>
                <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-500 transition-colors p-2 rounded-full hover:bg-gray-100">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              {/* Número de Pedido y Cliente */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <ShoppingCartIcon className="h-5 w-5 text-custom-green-600 mr-2" />
                    <span className="text-lg font-semibold text-custom-green-600">
                      {pedidoSeleccionado.numeropedido}
                    </span>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    {pedidoSeleccionado.estado}
                  </span>
                </div>
                
                <div className="flex items-center mb-2">
                  <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">
                    {pedidoSeleccionado.cliente}
                  </span>
                </div>

                <div className="flex items-center mb-2">
                  <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-500">
                    {pedidoSeleccionado.tiempo}
                  </span>
                </div>

                <div className="flex items-center">
                  <ShoppingCartIcon className="h-4 w-4 text-custom-green-500 mr-2" />
                  <span className="text-sm font-medium text-custom-green-600">
                    Canal: {pedidoSeleccionado.canal}
                  </span>
                </div>
              </div>

              {/* Items del Pedido */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <ShoppingBagIcon className="h-4 w-4 mr-2 text-gray-500" />
                  Items del Pedido
                </h4>
                <div className="space-y-3">
                  {pedidoSeleccionado.items.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {item.nombre}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Cantidad: {item.cantidad}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium text-gray-900 text-sm">
                            ${item.precio.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen de Precios */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                  <DollarSignIcon className="h-4 w-4 mr-2 text-gray-500" />
                  Resumen de Pago
                </h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">${pedidoSeleccionado.subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Propina:</span>
                    <span className="font-medium text-custom-green-600">+${pedidoSeleccionado.propina.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-custom-green-600">
                        ${pedidoSeleccionado.total.toFixed(2)}
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

      {/* Modal de Planes Pro */}
      {mostrarModalPro && (
        <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]" onClick={() => setMostrarModalPro(false)}></div>
          <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl max-w-4xl w-full mx-4 shadow-2xl border border-white/20">
            {/* Header del Modal */}
            <div className="px-8 py-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Xquisito Pro
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Desbloquea métricas avanzadas y funcionalidades exclusivas
                  </p>
                </div>
                <button
                  onClick={() => setMostrarModalPro(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors p-2 rounded-full hover:bg-white/20"
                >
                  <XIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Contenido del Modal */}
            <div className="px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Plan Básico */}
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      Básico
                    </h4>
                    <div className="flex items-center justify-center">
                      <span className="text-3xl font-bold text-gray-900">Gratis</span>
                    </div>
                    <p className="text-gray-600 mt-2">Plan actual</p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">Dashboard básico</span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">Gestión de menús</span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">Promociones básicas</span>
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">Hasta 3 sucursales</span>
                    </li>
                    <li className="flex items-center opacity-50">
                      <XIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-500">Métricas de ventas avanzadas</span>
                    </li>
                    <li className="flex items-center opacity-50">
                      <XIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-500">Análisis predictivo</span>
                    </li>
                    <li className="flex items-center opacity-50">
                      <XIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-500">Reportes personalizados</span>
                    </li>
                  </ul>

                  <button className="w-full py-3 px-4 bg-gray-200 text-gray-600 rounded-lg font-medium cursor-not-allowed">
                    Plan Actual
                  </button>
                </div>

                {/* Plan Pro */}
                <div className="bg-gradient-to-br from-purple-500/20 to-yellow-500/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg relative overflow-hidden">
                  {/* Badge Pro */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-gradient-to-r from-purple-600 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                      <CrownIcon className="h-3 w-3 mr-1" />
                      POPULAR
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2 flex items-center justify-center">
                      <CrownIcon className="h-5 w-5 text-yellow-600 mr-2" />
                      Pro
                    </h4>
                    <div className="flex items-center justify-center">
                      <span className="text-3xl font-bold text-gray-900">$299</span>
                      <span className="text-gray-600 ml-1">/mes</span>
                    </div>
                    <p className="text-gray-600 mt-2">Facturación mensual</p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">Todo del plan Básico</span>
                    </li>
                    <li className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-500 mr-3" />
                      <span className="text-gray-700 font-medium">Métricas de ventas detalladas</span>
                    </li>
                    <li className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-500 mr-3" />
                      <span className="text-gray-700 font-medium">Análisis predictivo con IA</span>
                    </li>
                    <li className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-500 mr-3" />
                      <span className="text-gray-700 font-medium">Reportes personalizados</span>
                    </li>
                    <li className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-500 mr-3" />
                      <span className="text-gray-700 font-medium">Sucursales ilimitadas</span>
                    </li>
                    <li className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-500 mr-3" />
                      <span className="text-gray-700 font-medium">Pepper AI avanzado</span>
                    </li>
                    <li className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-500 mr-3" />
                      <span className="text-gray-700 font-medium">Soporte prioritario 24/7</span>
                    </li>
                  </ul>

                  <button className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-yellow-500 text-white rounded-lg font-medium hover:from-purple-700 hover:to-yellow-600 transition-all duration-200 shadow-lg">
                    Actualizar a Pro
                  </button>
                </div>
              </div>

              {/* Nota informativa */}
              <div className="mt-8 text-center">
                <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>💡 Nota:</strong> Las métricas de ventas totales están disponibles exclusivamente en Xquisito Pro.
                    Actualiza tu plan para acceder a análisis detallados de ingresos, tendencias de ventas y proyecciones de crecimiento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>;
};
export default Dashboard;