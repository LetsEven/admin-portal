import React, { useState, useEffect } from 'react';
import { ShoppingBagIcon, CreditCardIcon, LayoutGridIcon, SmartphoneIcon, ShoppingCartIcon, ReceiptIcon, ScanLineIcon, BedIcon } from 'lucide-react';
import Joyride from 'react-joyride';
import TapOrderDashboardModal from '../components/TapOrderDashboardModal';
import FlexBillDashboardModal from '../components/FlexBillDashboardModal';
import FoodHallDashboardModal from '../components/FoodHallDashboardModal';
import PickNGoDashboardModal from '../components/PickNGoDashboardModal';
import TapPayDashboardModal from '../components/TapPayDashboardModal';
import InactiveServiceModal from '../components/InactiveServiceModal';
import { useAdminPortalApi, ServiceInfo } from '../services/adminPortalApi';
import { useServicesOnboarding, joyrideTheme, joyrideResponsiveCSS } from '../hooks/useServicesOnboarding';
import toast from 'react-hot-toast';

// Mapeo de servicios del main-portal a servicios del admin-portal
const SERVICE_MAPPING: Record<string, ServiceInfo> = {
  'tap-order-pay': {
    id: 'tap-order-pay',
    name: 'Tap Order & Pay',
    description: 'Órdenes y pagos sin mesero, desde la mesa. El cliente toca con su celular la tarjeta NFC de la mesa, accede al menú digital, ordena y paga desde su dispositivo. El pedido se procesa automáticamente y se entrega. Ideal para agilizar el servicio y reducir tiempos de espera.',
    icon: 'smartphone',
    enabled: false
  },
  'flex-bill': {
    id: 'flex-bill',
    name: 'Flex Bill',
    description: 'Órdenes grupales con cuenta compartida y pagos divididos. Cada comensal hace tap en la tarjeta NFC para unirse a una cuenta compartida. Cada quien puede ordenar desde su celular y, al final, pagar solo lo que consumió o dividir la cuenta fácilmente. Perfecto para grupos y mesas grandes.',
    icon: 'receipt',
    enabled: false
  },
  'food-hall': {
    id: 'food-hall',
    name: 'Food Hall',
    description: 'Órdenes unificadas en espacios con múltiples locales. Diseñado para food courts, parques gastronómicos o mercados: el usuario puede ordenar de varios locales en una sola transacción, pagar desde su celular y recibir notificaciones cuando su pedido esté listo para recoger.',
    icon: 'layout-grid',
    enabled: false
  },
  'tap-pay': {
    id: 'tap-pay',
    name: 'Tap & Pay',
    description: 'Pago moderno, sin cambiar la experiencia tradicional. El cliente pide con el mesero como siempre, pero al pagar solo necesita acercar su celular a la tarjeta NFC para liquidar. También puede dividir la cuenta sin usar terminal ni esperar al mesero. Rápido, elegante y sin fricción.',
    icon: 'scan-line',
    enabled: false
  },
  'pick-n-go': {
    id: 'pick-n-go',
    name: 'Pick N Go',
    description: 'Órdenes anticipadas desde redes sociales o sitio web. El cliente ordena y paga desde su celular antes de llegar al local, a través de un link el cual puede ser publicado en redes sociales. Al llegar, simplemente recoge su pedido ya listo.',
    icon: 'shopping-cart',
    enabled: false
  },
  'room-service': {
    id: 'room-service',
    name: 'Room Service',
    description: 'Servicio a la habitación para hoteles. Los huéspedes pueden ordenar comida, bebidas y servicios directamente desde su habitación usando su celular. Los pedidos se procesan automáticamente y se entregan directamente a la habitación especificada. Ideal para hoteles que quieren digitalizar y agilizar su room service.',
    icon: 'bed',
    enabled: false
  }
};

const PromotionsManagement = () => {
  const adminPortalApi = useAdminPortalApi();
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Services onboarding tour
  const { run, steps, handleJoyrideCallback, startOnboarding } = useServicesOnboarding();
  const [showTapOrderDashboard, setShowTapOrderDashboard] = useState(false);
  const [showFlexBillDashboard, setShowFlexBillDashboard] = useState(false);
  const [showFoodHallDashboard, setShowFoodHallDashboard] = useState(false);
  const [showPickNGoDashboard, setShowPickNGoDashboard] = useState(false);
  const [showTapPayDashboard, setShowTapPayDashboard] = useState(false);
  const [showInactiveServiceModal, setShowInactiveServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(null);

  // Cargar servicios habilitados al montar el componente
  useEffect(() => {
    loadServices();
  }, []);

  // Iniciar tour cuando los servicios estén cargados
  useEffect(() => {
    // Tour se muestra siempre para explicar funcionalidad, sin importar estado de datos
    if (!loading) {
      // Pequeño delay para asegurar que todos los elementos están renderizados
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [loading, startOnboarding]);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminPortalApi.getEnabledServices();      

      const enabledServiceIds = response.enabled_services;
      console.log(enabledServiceIds);
      

      // Crear lista de servicios con estado enabled/disabled basado en main-portal
      const allServices = Object.values(SERVICE_MAPPING).map(service => ({
        ...service,
        enabled: enabledServiceIds.includes(service.id)
      }));    
      console.log(allServices);  

      // Ordenar: habilitados primero, luego por nombre
      const sortedServices = allServices.sort((a, b) => {
        if (a.enabled && !b.enabled) return -1;
        if (!a.enabled && b.enabled) return 1;
        return a.name.localeCompare(b.name);
      });

      setServices(sortedServices);

      toast.success(`${enabledServiceIds.length} servicios disponibles`, {
        duration: 2000,
        icon: '⚙️'
      });

    } catch (error) {
      console.error('❌ Error loading services:', error);
      setError('Error al cargar servicios habilitados');

      // Fallback: mostrar todos los servicios como deshabilitados
      const fallbackServices = Object.values(SERVICE_MAPPING);
      setServices(fallbackServices);

      toast.error('Error al cargar servicios. Contacta al administrador.', {
        duration: 4000,
        icon: '⚠️'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = (service: ServiceInfo) => {
    setSelectedService(service);

    if (!service.enabled) {
      setShowInactiveServiceModal(true);
      return;
    }

    // Acceso directo al dashboard si el servicio está habilitado
    switch (service.id) {
      case 'tap-order-pay':
        setShowTapOrderDashboard(true);
        break;
      case 'flex-bill':
        setShowFlexBillDashboard(true);
        break;
      case 'food-hall':
        setShowFoodHallDashboard(true);
        break;
      case 'pick-n-go':
        setShowPickNGoDashboard(true);
        break;
      case 'tap-pay':
        setShowTapPayDashboard(true);
        break;
      default:
        break;
    }
  };
  // Función para obtener el icono correspondiente
  const getIcon = iconName => {
    switch (iconName) {
      case 'smartphone':
        return <SmartphoneIcon className="h-7 w-7 text-custom-green-600 group-hover:text-custom-green-600 transition-colors duration-200" />;
      case 'receipt':
        return <ReceiptIcon className="h-7 w-7 text-custom-green-600 group-hover:text-custom-green-600 transition-colors duration-200" />;
      case 'layout-grid':
        return <LayoutGridIcon className="h-7 w-7 text-custom-green-600 group-hover:text-custom-green-600 transition-colors duration-200" />;
      case 'scan-line':
        return <ScanLineIcon className="h-7 w-7 text-custom-green-600 group-hover:text-custom-green-600 transition-colors duration-200" />;
      case 'shopping-cart':
        return <ShoppingCartIcon className="h-7 w-7 text-custom-green-600 group-hover:text-custom-green-600 transition-colors duration-200" />;
      case 'bed':
        return <BedIcon className="h-7 w-7 text-custom-green-600 group-hover:text-custom-green-600 transition-colors duration-200" />;
      default:
        return <ShoppingBagIcon className="h-7 w-7 text-custom-green-600 group-hover:text-custom-green-600 transition-colors duration-200" />;
    }
  };
  return <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mt-5 mb-2">
            Gestión de Dine
          </h1>
          <p className="text-sm text-gray-500">
            Gestiona los servicios clave de tu restaurante u hotel para ofrecer una
            operación más eficiente y moderna
          </p>
        </div>
      </div>

      {/* Estados de carga y error */}
      {loading && (
        <div className="mt-6 text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-custom-green-600"></div>
          <p className="text-gray-500 mt-2">Cargando servicios...</p>
        </div>
      )}

      {error && !loading && (
        <div className="mt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={loadServices}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Lista de servicios */}
      {!loading && !error && (
        <div className="mt-6 flex flex-col space-y-4">
          {services.map((service, index) => {
            const isEnabled = service.enabled;

            return (
              <div
                key={service.id}
                className={`group bg-white overflow-hidden shadow rounded-lg border transition-all duration-200 ease-out ${
                  isEnabled
                    ? 'border-custom-green-200'  // Removido hover effects y cursor-pointer temporalmente
                    : 'border-gray-200 opacity-60 cursor-not-allowed'
                }`}
                data-tour={index === 0 ? "service-status" : undefined}
                // onClick={() => handleServiceClick(service)} // Temporalmente deshabilitado
              >
                <div className="p-4 flex">
                  <div className={`flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full transition-colors duration-200 ${
                    isEnabled
                      ? 'bg-custom-green-100 group-hover:bg-white'
                      : 'bg-gray-50'
                  }`}>
                    {getIcon(service.icon)}
                  </div>

                  <div className="ml-4 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-medium text-gray-900 group-hover:text-gray-900 transition-colors duration-200">
                        {service.name}
                      </h3>
                    </div>
                    <p className="mt-1.5 text-sm text-gray-500 group-hover:text-gray-500 transition-colors duration-200 line-clamp-2">
                      {service.description}
                    </p>
                  </div>

                  <div className="ml-3 flex items-center self-end">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      isEnabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isEnabled ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {services.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay servicios configurados.</p>
            </div>
          )}
        </div>
      )}
      {/* Dashboard Modals */}
      <TapOrderDashboardModal isOpen={showTapOrderDashboard} onClose={() => setShowTapOrderDashboard(false)} />
      <FlexBillDashboardModal isOpen={showFlexBillDashboard} onClose={() => setShowFlexBillDashboard(false)} />
      <FoodHallDashboardModal isOpen={showFoodHallDashboard} onClose={() => setShowFoodHallDashboard(false)} />
      <PickNGoDashboardModal isOpen={showPickNGoDashboard} onClose={() => setShowPickNGoDashboard(false)} />
      <TapPayDashboardModal isOpen={showTapPayDashboard} onClose={() => setShowTapPayDashboard(false)} />
      {/* Inactive Service Modal */}
      <InactiveServiceModal
        isOpen={showInactiveServiceModal}
        onClose={() => setShowInactiveServiceModal(false)}
        serviceName={selectedService?.name || ''}
      />

      {/* Estilos responsive para onboarding */}
      <style dangerouslySetInnerHTML={{ __html: joyrideResponsiveCSS }} />
      {/* Tour guiado para gestión de servicios */}
      <Joyride
        callback={handleJoyrideCallback}
        continuous
        hideCloseButton
        run={run}
        scrollToFirstStep
        showProgress
        showSkipButton
        steps={steps}
        styles={joyrideTheme}
        locale={{
          back: 'Atrás',
          close: 'Cerrar',
          last: 'Finalizar',
          next: 'Siguiente',
          nextLabelWithProgress: `Siguiente {step} de {steps}`,
          skip: 'Saltar tour',
        }}
      />
    </div>;
};
export default PromotionsManagement;