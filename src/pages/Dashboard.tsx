import React, { useState } from 'react';
import { BarChart2Icon, UsersIcon, ShoppingBagIcon, TrendingUpIcon, ChevronDownIcon, MapPinIcon, CheckIcon, XIcon, ClockIcon, DollarSignIcon, UserIcon, ShoppingCartIcon, RotateCcwIcon, CrownIcon, StarIcon } from 'lucide-react';
// Lista de sucursales de ejemplo
const sucursales = [{
  id: 1,
  nombre: 'Sucursal Centro',
  direccion: 'Av. Reforma 123'
}, {
  id: 2,
  nombre: 'Sucursal Norte',
  direccion: 'Blvd. Manuel Ávila Camacho 456'
}, {
  id: 3,
  nombre: 'Sucursal Sur',
  direccion: 'Calz. de Tlalpan 789'
}, {
  id: 4,
  nombre: 'Sucursal Poniente',
  direccion: 'Santa Fe 101'
}];

// Datos de ejemplo para pedidos
const pedidosEjemplo = [{
  id: 1123,
  numeropedido: '#1123',
  cliente: 'Juan Pérez',
  canal: 'Tap Order & Pay',
  tiempo: 'Hace 15 minutos',
  estado: 'Completado',
  items: [
    { nombre: 'Hamburguesa Clásica', cantidad: 2, precio: 12.99 },
    { nombre: 'Papas Fritas', cantidad: 1, precio: 6.99 },
    { nombre: 'Coca Cola', cantidad: 2, precio: 3.50 }
  ],
  subtotal: 36.47,
  propina: 5.00,
  total: 41.47
}, {
  id: 1246,
  numeropedido: '#1246',
  cliente: 'María González',
  canal: 'Pick N Go',
  tiempo: 'Hace 25 minutos',
  estado: 'Completado',
  items: [
    { nombre: 'Pizza Margherita', cantidad: 1, precio: 18.99 },
    { nombre: 'Ensalada César', cantidad: 1, precio: 8.99 },
    { nombre: 'Agua Mineral', cantidad: 1, precio: 2.50 }
  ],
  subtotal: 30.48,
  propina: 4.50,
  total: 34.98
}, {
  id: 1369,
  numeropedido: '#1369',
  cliente: 'Carlos Mendoza',
  canal: 'Pick N Go',
  tiempo: 'Hace 35 minutos',
  estado: 'Completado',
  items: [
    { nombre: 'Tacos al Pastor', cantidad: 3, precio: 4.99 },
    { nombre: 'Guacamole', cantidad: 1, precio: 5.99 },
    { nombre: 'Cerveza Corona', cantidad: 2, precio: 4.50 }
  ],
  subtotal: 29.96,
  propina: 6.00,
  total: 35.96
}, {
  id: 1492,
  numeroPedido: '#1492',
  cliente: 'Ana López',
  canal: 'Tap Order & Pay',
  tiempo: 'Hace 45 minutos',
  estado: 'Completado',
  items: [
    { nombre: 'Sushi Roll', cantidad: 2, precio: 15.99 },
    { nombre: 'Sopa Miso', cantidad: 1, precio: 6.99 },
    { nombre: 'Té Verde', cantidad: 1, precio: 3.50 }
  ],
  subtotal: 42.47,
  propina: 8.00,
  total: 50.47
}, {
  id: 1615,
  numeroPedido: '#1615',
  cliente: 'Roberto Silva',
  canal: 'Pick N Go',
  tiempo: 'Hace 55 minutos',
  estado: 'Completado',
  items: [
    { nombre: 'Pasta Carbonara', cantidad: 1, precio: 16.99 },
    { nombre: 'Pan de Ajo', cantidad: 1, precio: 4.99 },
    { nombre: 'Vino Tinto', cantidad: 1, precio: 22.00 }
  ],
  subtotal: 43.98,
  propina: 7.50,
  total: 51.48
}];

// Datos específicos por sucursal
const datosPorSucursal = {
  1: { // Sucursal Centro
    ventasTotales: '$24,500',
    clientesNuevos: 38,
    pedidos: 156,
    tasaConversion: '24.5%',
    pedidosRecientes: pedidosEjemplo
  },
  2: { // Sucursal Norte
    ventasTotales: '$31,200',
    clientesNuevos: 45,
    pedidos: 189,
    tasaConversion: '28.3%',
    pedidosRecientes: [{
      id: 2001,
      numeropedido: '#2001',
      cliente: 'Sofia Herrera',
      canal: 'Tap Order & Pay',
      tiempo: 'Hace 12 minutos',
      estado: 'Completado',
      items: [
        { nombre: 'Ensalada Griega', cantidad: 1, precio: 14.99 },
        { nombre: 'Agua con Gas', cantidad: 2, precio: 3.00 }
      ],
      subtotal: 20.99,
      propina: 4.00,
      total: 24.99
    }, {
      id: 2002,
      numeropedido: '#2002',
      cliente: 'Miguel Torres',
      canal: 'Pick N Go',
      tiempo: 'Hace 18 minutos',
      estado: 'Completado',
      items: [
        { nombre: 'Wrap de Pollo', cantidad: 1, precio: 11.99 },
        { nombre: 'Jugo Natural', cantidad: 1, precio: 4.50 }
      ],
      subtotal: 16.49,
      propina: 2.50,
      total: 18.99
    }]
  },
  3: { // Sucursal Sur
    ventasTotales: '$18,750',
    clientesNuevos: 29,
    pedidos: 134,
    tasaConversion: '22.1%',
    pedidosRecientes: [{
      id: 3001,
      numeropedido: '#3001',
      cliente: 'Carmen Ruiz',
      canal: 'Tap Order & Pay',
      tiempo: 'Hace 8 minutos',
      estado: 'Completado',
      items: [
        { nombre: 'Quesadillas', cantidad: 2, precio: 8.99 },
        { nombre: 'Refresco', cantidad: 1, precio: 2.50 }
      ],
      subtotal: 20.48,
      propina: 3.00,
      total: 23.48
    }]
  },
  4: { // Sucursal Poniente
    ventasTotales: '$27,900',
    clientesNuevos: 52,
    pedidos: 178,
    tasaConversion: '26.8%',
    pedidosRecientes: [{
      id: 4001,
      numeropedido: '#4001',
      cliente: 'Fernando López',
      canal: 'Pick N Go',
      tiempo: 'Hace 5 minutos',
      estado: 'Completado',
      items: [
        { nombre: 'Club Sandwich', cantidad: 1, precio: 13.99 },
        { nombre: 'Café Americano', cantidad: 2, precio: 3.50 },
        { nombre: 'Muffin', cantidad: 1, precio: 4.99 }
      ],
      subtotal: 22.48,
      propina: 4.50,
      total: 26.98
    }, {
      id: 4002,
      numeropedido: '#4002',
      cliente: 'Lucia Mendez',
      canal: 'Tap Order & Pay',
      tiempo: 'Hace 22 minutos',
      estado: 'Completado',
      items: [
        { nombre: 'Smoothie Bowl', cantidad: 1, precio: 12.99 },
        { nombre: 'Té Verde', cantidad: 1, precio: 2.99 }
      ],
      subtotal: 15.98,
      propina: 3.20,
      total: 19.18
    }]
  }
};

const Dashboard = () => {
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(sucursales[0]);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalPro, setMostrarModalPro] = useState(false);
  
  // Obtener datos de la sucursal seleccionada
  const datosActuales = datosPorSucursal[sucursalSeleccionada.id];
  const cambiarSucursal = sucursal => {
    setSucursalSeleccionada(sucursal);
    setDropdownAbierto(false);
  };

  const abrirDetallesPedido = (pedido) => {
    setPedidoSeleccionado(pedido);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setPedidoSeleccionado(null);
  };
  return <div className="w-full">
      <div className="flex justify-between items-center mb-9">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2 mt-4">
            Xquisito Administrador
          </h1>
          <p className="text-sm text-gray-500">
            Bienvenido al panel de administración
          </p>
        </div>
        {/* Selector de sucursales */}
        <div className="relative">
          <button onClick={() => setDropdownAbierto(!dropdownAbierto)} className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:ring-offset-2">
            <MapPinIcon className="h-5 w-5 text-custom-green-600" />
            <span className="text-sm font-medium text-gray-700">
              Sucursal actual: {sucursalSeleccionada.nombre}
            </span>
            <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${dropdownAbierto ? 'transform rotate-180' : ''}`} />
          </button>
          {dropdownAbierto && <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-10 py-1 animate-in fade-in duration-100 ease-out">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Seleccionar sucursal
                </p>
              </div>
              <ul className="max-h-64 overflow-y-auto py-1">
                {sucursales.map(sucursal => <li key={sucursal.id}>
                    <button onClick={() => cambiarSucursal(sucursal)} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {sucursal.nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                          {sucursal.direccion}
                        </p>
                      </div>
                      {sucursalSeleccionada.id === sucursal.id && <CheckIcon className="h-4 w-4 text-custom-green-600" />}
                    </button>
                  </li>)}
              </ul>
            </div>}
        </div>
      </div>
      <div className="mt-1">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 - Ventas Totales (Pro) */}
          <div
            className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg cursor-pointer"
            onClick={() => setMostrarModalPro(true)}
          >
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
                      <div className="flex items-center justify-center">
                        <div className="bg-gradient-to-r from-purple-500/20 to-yellow-500/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 shadow-lg">
                          <div className="flex items-center space-x-2">
                            <CrownIcon className="h-5 w-5 text-yellow-600" />
                            <span className="text-lg font-semibold text-gray-800">Pro</span>
                          </div>
                        </div>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
              <div className="text-sm">
                <button className="font-medium text-custom-green-600 hover:text-custom-green-800 flex items-center w-full">
                  Ver Planes
                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          {/* Card 2 */}
          <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
                  <UsersIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Clientes nuevos
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {datosActuales.clientesNuevos}
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
          {/* Card 3 */}
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
                        {datosActuales.pedidos}
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
          {/* Card 4 */}
          <div className="bg-white overflow-hidden shadow-md rounded-lg border border-gray-100 transition-all duration-200 hover:shadow-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 p-3 rounded-full">
                  <TrendingUpIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tasa de conversión
                    </dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {datosActuales.tasaConversion}
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
            onClick={() => {
              // Simular actualización de datos
              window.location.reload();
            }}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <RotateCcwIcon className="h-4 w-4 mr-2" />
            Actualizar
          </button>
        </div>
        <div className="mt-4 bg-white shadow-md overflow-hidden sm:rounded-lg border border-gray-100">
          <ul className="divide-y divide-gray-200">
            {datosActuales.pedidosRecientes.map(pedido => <li key={pedido.id} className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer" onClick={() => abrirDetallesPedido(pedido)}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-custom-green-600 truncate">
                      Pedido {pedido.numeropedido}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {pedido.estado}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex sm:flex-col sm:space-y-1">
                      <p className="flex items-center text-sm text-gray-500">
                        <UsersIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        Cliente: {pedido.cliente}
                      </p>
                      <p className="flex items-center text-xs text-custom-green-600 font-medium">
                        <ShoppingCartIcon className="flex-shrink-0 mr-1.5 h-3 w-3 text-custom-green-500" />
                        {pedido.canal}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>{pedido.tiempo}</p>
                    </div>
                  </div>
                </div>
              </li>)}
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