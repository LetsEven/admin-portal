import React, { useEffect, useState, useRef, Component, useCallback } from 'react';
import SegmentModal from '../components/SegmentModal';
import NewCampaignModal from '../components/NewCampaignModal';
import TemplateDesignerModal from '../components/TemplateDesignerModal';
import CampaignDetailsModal from '../components/CampaignDetailsModal';
import CampaignDashboardModal from '../components/CampaignDashboardModal';
import { segmentsApi, CustomerSegment } from '../services/segmentsApi';
import { setAuthHook, useAdminPortalApi } from '../services/adminPortalApi';
import { useAuth } from '@clerk/nextjs';
import { useRestaurant } from '../contexts/RestaurantContext';
import { PlusIcon, AwardIcon, CoffeeIcon, ShoppingBagIcon, XIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon, EyeIcon, TrashIcon, TargetIcon, LayoutIcon, ChevronDownIcon, FilterIcon, ImageIcon, TypeIcon, SeparatorHorizontalIcon, MousePointerIcon, GripIcon, UploadIcon, MaximizeIcon, MinimizeIcon, BookmarkIcon, ZoomInIcon, BellIcon, CalendarIcon, MailIcon, LoaderIcon } from 'lucide-react';
// Initial campaigns data
const initialCampaigns = [{
  id: 1,
  name: 'Café gratis',
  description: 'Un café americano o espresso gratis',
  pointsRequired: 100,
  expirationDays: 30,
  active: true,
  status: 'active',
  icon: 'coffee',
  image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
  emailSubject: '¡Tu café gratis te espera!',
  emailBody: 'Disfruta de un café americano o espresso completamente gratis en tu próxima visita.',
  startDate: '2023-10-01',
  endDate: '2023-12-31',
  conditions: 'Válido de lunes a viernes. No acumulable con otras promociones.',
  cta: 'Canjear ahora',
  templateName: 'Café Gratis - Template',
  sent: true
}, {
  id: 2,
  name: 'Postre gratis',
  description: 'Un postre a elección (valor máximo $8)',
  pointsRequired: 250,
  expirationDays: 30,
  active: true,
  status: 'active',
  icon: 'award',
  image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
  emailSubject: '¡Te has ganado un postre!',
  emailBody: 'Celebra con un delicioso postre gratis a tu elección en tu próxima visita.',
  startDate: '2023-10-15',
  endDate: '2023-12-15',
  conditions: 'Valor máximo $8. No acumulable con otras promociones.',
  cta: 'Ver postres',
  templateName: 'Postre Gratis - Template',
  sent: true
}, {
  id: 3,
  name: 'Descuento de $15',
  description: 'Descuento de $15 en tu próxima compra (mínimo $30)',
  pointsRequired: 400,
  expirationDays: 60,
  active: true,
  status: 'paused',
  icon: 'shopping-bag',
  image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
  emailSubject: '¡$15 de descuento en tu próxima compra!',
  emailBody: 'Te regalamos $15 de descuento en tu próxima compra de $30 o más.',
  startDate: '2023-11-01',
  endDate: '2024-01-31',
  conditions: 'Compra mínima de $30. No acumulable con otras promociones.',
  cta: 'Usar descuento',
  templateName: 'Descuento $15 - Template',
  sent: false
}, {
  id: 4,
  name: 'Papas gratis',
  description: 'Una orden de papas fritas gratis con tu hamburguesa',
  pointsRequired: 150,
  expirationDays: 30,
  active: false,
  status: 'expired',
  icon: 'shopping-bag',
  image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
  emailSubject: '¡PAPAS GRATIS con tu hamburguesa!',
  emailBody: 'Celebramos contigo con una orden de papas gratis al comprar cualquier hamburguesa.',
  startDate: '2023-08-01',
  endDate: '2023-09-30',
  conditions: 'Válido solo al comprar una hamburguesa. No acumulable con otras promociones.',
  cta: 'Ordenar ahora',
  templateName: 'Papas Gratis - Template',
  sent: true
}];
// Saved segments fallback (will be replaced by API data)
const fallbackSegments: CustomerSegment[] = [];
const savedTemplates = [{
  id: 1,
  name: 'Promoción Estándar',
  blocks: [{
    id: '1',
    type: 'title',
    content: 'Promoción exclusiva para ti'
  }, {
    id: '2',
    type: 'image',
    content: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
  }, {
    id: '3',
    type: 'text',
    content: 'Aprovecha esta oferta por tiempo limitado'
  }, {
    id: '4',
    type: 'button',
    content: 'Canjear ahora'
  }]
}, {
  id: 2,
  name: 'Recompensa de Cumpleaños',
  blocks: [{
    id: '1',
    type: 'title',
    content: '¡Feliz Cumpleaños!'
  }, {
    id: '2',
    type: 'image',
    content: 'https://images.unsplash.com/photo-1578922864601-79dca7a9ea35?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
  }, {
    id: '3',
    type: 'text',
    content: 'Te regalamos algo especial en tu día'
  }, {
    id: '4',
    type: 'button',
    content: 'Reclamar regalo'
  }]
}];
// KPI Button Component
const KpiButton = ({
  label,
  count,
  active,
  onClick,
  icon
}) => {
  return <button onClick={onClick} className={`p-4 rounded-lg border transition-all duration-200 ${active ? 'bg-custom-green-50 border-custom-green-200 text-custom-green-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className={`text-2xl font-bold ${active ? 'text-custom-green-600' : 'text-gray-900'}`}>
            {count}
          </p>
        </div>
        <div className="ml-4">{icon}</div>
      </div>
    </button>;
};
// Campaign Card Component
const CampaignCard = ({
  campaign,
  onPreview,
  onToggleActive,
  onDelete
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusMenuRef = useRef(null);
  const powerButtonRef = useRef(null);
  // Format date to dd/mm/yy
  const formatDate = dateString => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target) && powerButtonRef.current && !powerButtonRef.current.contains(event.target)) {
        setShowStatusMenu(false);
      }
    };
    const handleEscKey = event => {
      if (event.key === 'Escape') {
        setShowStatusMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);
  const handleStatusChange = status => {
    onToggleActive(campaign.id, status);
    setShowStatusMenu(false);
  };
  let IconComponent = AwardIcon;
  if (campaign.icon === 'coffee') {
    IconComponent = CoffeeIcon;
  } else if (campaign.icon === 'shopping-bag') {
    IconComponent = ShoppingBagIcon;
  }
  // Determinar el color del botón de power según el estado
  const getPowerButtonStyles = status => {
    switch (status) {
      case 'active':
        return 'bg-[#DCFCE7] border border-[#22C55E] text-[#15803D] hover:bg-[#BBF7D0]';
      case 'paused':
        return 'bg-[#FFF7CC] border border-[#FACC15] text-[#A16207] hover:bg-[#FDE68A]';
      case 'expired':
        return 'bg-gray-100 border border-gray-300 text-gray-500 hover:bg-gray-200';
      default:
        return 'bg-[#FFF7CC] border border-[#FACC15] text-[#A16207] hover:bg-[#FDE68A]';
    }
  };
  // Status indicator
  const getStatusBadge = status => {
    switch (status) {
      case 'active':
        return <span className="flex items-center text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs font-medium">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Activa
          </span>;
      case 'paused':
        return <span className="flex items-center text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-xs font-medium">
            <ClockIcon className="h-3 w-3 mr-1" />
            Pausa
          </span>;
      case 'expired':
        return <span className="flex items-center text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">
            <AlertCircleIcon className="h-3 w-3 mr-1" />
            Expirada
          </span>;
      default:
        return null;
    }
  };
  return <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 transition-all duration-200 ease-out hover:bg-[#E9F2F2] hover:border-[#D6E6E6] hover:shadow-md hover:scale-105 focus-within:outline-offset-2 focus-within:outline-[#0EA5E9] focus-within:outline-2 active:scale-[0.995]">
      <div className="relative h-36 overflow-hidden">
        <img src={campaign.image} alt={campaign.name} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2">
          {getStatusBadge(campaign.status)}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 p-2 rounded-full ${campaign.active ? 'bg-custom-green-100' : 'bg-gray-100'}`}>
            <IconComponent className={`h-5 w-5 ${campaign.active ? 'text-custom-green-600' : 'text-gray-400'}`} />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              {campaign.name}
            </h3>
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {campaign.description}
            </p>
            {campaign.templateName && <p className="mt-1 text-xs text-gray-400">
                Template: {campaign.templateName}
              </p>}
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <span className="bg-custom-green-100 text-custom-green-800 px-2 py-0.5 rounded-full font-medium">
                {campaign.pointsRequired} puntos
              </span>
              <span className="ml-2">{campaign.expirationDays} días</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
        </div>
        <div className="flex items-center space-x-2">
          {/* Botón Ver */}
          <button onClick={e => onPreview(e)} className="p-1.5 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0EA5E9]" aria-label="Ver vista previa">
            <EyeIcon className="h-4 w-4" />
          </button>
          {/* Botón Power/Estado */}
          <div className="relative">
            <button ref={powerButtonRef} onClick={e => {
            e.stopPropagation();
            setShowStatusMenu(!showStatusMenu);
          }} aria-haspopup="true" aria-expanded={showStatusMenu} aria-controls="status-menu" className={`p-1.5 flex items-center justify-center rounded-full hover:shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0EA5E9] ${getPowerButtonStyles(campaign.status)}`} aria-label="Cambiar estado">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                <line x1="12" y1="2" x2="12" y2="12"></line>
              </svg>
            </button>
            {showStatusMenu && <div ref={statusMenuRef} id="status-menu" className="absolute right-0 bottom-full mb-2 w-36 bg-white rounded-lg shadow-lg border border-gray-200 z-10" role="menu">
                <button className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center rounded-t-lg focus:outline-none focus:bg-green-50" onClick={e => {
              e.stopPropagation();
              handleStatusChange('active');
            }} role="menuitem" disabled={campaign.status === 'expired'}>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Activa
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 flex items-center focus:outline-none focus:bg-yellow-50" onClick={e => {
              e.stopPropagation();
              handleStatusChange('paused');
            }} role="menuitem" disabled={campaign.status === 'expired'}>
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Pausa
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center rounded-b-lg focus:outline-none focus:bg-gray-50" onClick={e => {
              e.stopPropagation();
              handleStatusChange('expired');
            }} role="menuitem">
                  <AlertCircleIcon className="h-4 w-4 mr-2" />
                  Expirada
                </button>
              </div>}
          </div>
          {/* Botón Eliminar */}
          <button onClick={e => {
          e.stopPropagation();
          onDelete(campaign.id);
        }} className="p-1.5 bg-red-100 rounded-full text-red-600 hover:bg-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0EA5E9]" aria-label="Eliminar campaña">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>;
};
// Email Preview Component
const EmailPreview = ({
  campaign,
  onClose
}) => {
  if (!campaign) return null;
  // Current time for the email preview
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const timeString = `${hours}:${minutes}`;
  return <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]" onClick={onClose}></div>
      <div className="relative w-full max-w-[375px] mx-auto">
        {/* Close button positioned outside frame */}
        <button onClick={onClose} className="absolute -top-8 right-4 text-white hover:text-gray-300 z-50 p-2 rounded-full hover:bg-white/20 transition-colors">
          <XIcon className="h-6 w-6" />
        </button>

        {/* Template name display */}
        {campaign.templateName && <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-40">
            <span className="inline-block bg-white/90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              {campaign.templateName}
            </span>
          </div>}

        {/* Mobile frame with image */}
        <div className="relative mx-auto w-full max-w-[375px]">
          <style jsx>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="relative">
            {/* Phone frame image */}
            <img 
              src="/frame.webp" 
              alt="Mobile Frame" 
              className="w-full h-auto relative z-10"
            />
            
            {/* Email content overlay */}
            <div className="absolute inset-0 z-20" style={{
              top: '4%',
              left: '7%',
              right: '5%',
              bottom: '1.6%'
            }}>
              <div className="bg-white rounded-[50px] overflow-hidden h-full">

                {/* App Header */}
                <div className="px-3 py-2 pt-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center">
                    <img src="/holycow-logo.png" alt="Holy Cow Logo" className="h-6 w-auto mr-2" />
                    <span className="text-sm font-medium text-gray-800">
                      Holy Cow
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="p-1 bg-gray-100 rounded-full">
                      <MailIcon className="h-3 w-3 text-gray-600" />
                    </div>
                    <div className="p-1 bg-gray-100 rounded-full">
                      <BellIcon className="h-3 w-3 text-gray-600" />
                    </div>
                  </div>
                </div>

                {/* Email content - Professional newsletter style */}
                <div 
                  className="overflow-y-auto h-[calc(100%-50px)] hide-scrollbar" 
                  style={{ 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none'
                  }}
                >
                  {/* Email Header with Logo */}
                  <div className="bg-[#2D2D2D] text-white px-4 py-3 text-center">
                    <img src="/holycow-logo.png" alt="Holy Cow Logo" className="h-10 mx-auto mb-1" />
                    <p className="text-[10px] uppercase tracking-widest mt-1">
                      BURGER & BEER JOINT
                    </p>
                  </div>

                  {/* Email Subject Line Banner */}
                  <div className="bg-[#E53935] text-white px-4 py-2 text-center">
                    <p className="text-[11px] font-bold uppercase tracking-wide">
                      ¡OFERTA ESPECIAL PARA TI!
                    </p>
                  </div>

                  {/* Campaign Image */}
                  <div className="w-full">
                    <img src={campaign.image} alt={campaign.name} className="w-full h-32 object-cover" />
                  </div>

                  {/* Main Content */}
                  <div className="px-4 py-4 bg-white">
                    {/* Headline */}
                    <h1 className="text-sm font-bold text-[#2D2D2D] text-center mb-3">
                      {campaign.emailSubject}
                    </h1>

                    {/* Body Copy */}
                    <p className="text-gray-700 mb-4 text-center text-xs">
                      {campaign.emailBody}
                    </p>

                    {/* Extended promotional content */}
                    <div className="bg-gradient-to-r from-[#E53935] to-[#FF5722] text-white p-4 rounded-lg mb-4">
                      <h2 className="text-xs font-bold mb-2 text-center">🎉 ¡Una experiencia única te espera!</h2>
                      <p className="text-[10px] text-center leading-relaxed">
                        En Holy Cow creemos que cada visita debe ser especial. Por eso hemos preparado esta promoción exclusiva 
                        que combina sabor auténtico con la mejor atención. Nuestros chefs han seleccionado los ingredientes 
                        más frescos para brindarte una experiencia gastronómica inolvidable.
                      </p>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col space-y-2 mb-4">
                      <button className="bg-[#E53935] hover:bg-[#D32F2F] text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all text-xs mx-auto">
                        {campaign.cta}
                      </button>
                      <button 
                        onClick={() => {
                          // Simulate redeem action
                          alert('¡Promoción canjeada exitosamente! 🎉\nSe ha descontado ' + campaign.pointsRequired + ' puntos de tu cuenta Xquisito.');
                        }}
                        className="bg-[#FF9800] hover:bg-[#F57C00] text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all text-xs mx-auto flex items-center"
                      >
                        🎯 Canjear {campaign.pointsRequired} puntos
                      </button>
                    </div>

                    {/* Points Badge */}
                    {campaign.pointsRequired && <div className="text-center mb-4">
                        <span className="inline-block bg-[#FFECB3] text-[#E65100] px-3 py-1 rounded-full font-medium text-[10px]">
                          {campaign.pointsRequired} puntos
                        </span>
                      </div>}

                    {/* Additional promotional information */}
                    <div className="bg-[#FFF3E0] p-3 rounded-lg mb-4 border-l-4 border-[#E53935]">
                      <h3 className="font-bold text-[#2D2D2D] text-[10px] mb-2">
                        ✨ MÁS BENEFICIOS PARA TI:
                      </h3>
                      <ul className="text-[9px] text-gray-700 space-y-1">
                        <li>• Ambiente familiar con música en vivo los fines de semana</li>
                        <li>• Estacionamiento gratuito para clientes</li>
                        <li>• WiFi de alta velocidad disponible</li>
                        <li>• Área de juegos para los más pequeños</li>
                        <li>• Terraza climatizada con vista panorámica</li>
                        <li>• Servicio de delivery disponible</li>
                      </ul>
                    </div>

                    {/* Menu highlights */}
                    <div className="mb-4">
                      <h3 className="font-bold text-[#2D2D2D] text-[10px] mb-2 text-center">
                        🍔 NUESTROS PLATILLOS MÁS POPULARES:
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 p-2 rounded text-center">
                          <p className="text-[9px] font-medium">Holy Cow Classic</p>
                          <p className="text-[8px] text-gray-600">Hamburguesa doble con queso</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded text-center">
                          <p className="text-[9px] font-medium">BBQ Ribs</p>
                          <p className="text-[8px] text-gray-600">Costillas BBQ premium</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded text-center">
                          <p className="text-[9px] font-medium">Craft Beer</p>
                          <p className="text-[8px] text-gray-600">Cerveza artesanal local</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded text-center">
                          <p className="text-[9px] font-medium">Wings Combo</p>
                          <p className="text-[8px] text-gray-600">Alitas con 4 salsas</p>
                        </div>
                      </div>
                    </div>

                    {/* Customer testimonials */}
                    <div className="bg-[#E8F5E8] p-3 rounded-lg mb-4">
                      <h3 className="font-bold text-[#2D2D2D] text-[10px] mb-2 text-center">
                        💬 LO QUE DICEN NUESTROS CLIENTES:
                      </h3>
                      <div className="space-y-2">
                        <div className="bg-white p-2 rounded shadow-sm">
                          <p className="text-[8px] text-gray-700 italic">"La mejor hamburguesa que he probado. El ambiente es increíble."</p>
                          <p className="text-[7px] text-gray-500 mt-1">- María González ⭐⭐⭐⭐⭐</p>
                        </div>
                        <div className="bg-white p-2 rounded shadow-sm">
                          <p className="text-[8px] text-gray-700 italic">"Excelente servicio y la cerveza artesanal está espectacular."</p>
                          <p className="text-[7px] text-gray-500 mt-1">- Carlos Mendoza ⭐⭐⭐⭐⭐</p>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-4"></div>

                    {/* Details Section */}
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <h3 className="font-bold text-[#2D2D2D] text-[10px] mb-1">
                        📋 DETALLES DE LA PROMOCIÓN:
                      </h3>
                      <div className="flex items-center text-[10px] text-gray-600 mb-1">
                        <CalendarIcon className="h-3 w-3 mr-1 text-[#E53935]" />
                        <span>
                          Válido hasta:{' '}
                          {new Date(campaign.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-600 mt-1">
                        <span className="font-medium">
                          Términos y condiciones:
                        </span>
                        <br />
                        {campaign.conditions}
                        <br /><br />
                        • Válido únicamente en sucursal principal
                        <br />
                        • No aplica con otras promociones vigentes
                        <br />
                        • Promoción sujeta a disponibilidad
                        <br />
                        • Reservaciones recomendadas para grupos mayores a 6 personas
                      </p>
                    </div>

                    {/* Operating hours */}
                    <div className="bg-[#F5F5F5] p-3 rounded-lg mb-4">
                      <h3 className="font-bold text-[#2D2D2D] text-[10px] mb-2 text-center">
                        🕒 HORARIOS DE ATENCIÓN:
                      </h3>
                      <div className="text-[9px] text-gray-700 space-y-1">
                        <div className="flex justify-between">
                          <span>Lunes - Jueves:</span>
                          <span>12:00 PM - 11:00 PM</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Viernes - Sábado:</span>
                          <span>12:00 PM - 12:00 AM</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Domingo:</span>
                          <span>12:00 PM - 10:00 PM</span>
                        </div>
                      </div>
                    </div>

                    {/* Social media */}
                    <div className="text-center mb-4">
                      <h3 className="font-bold text-[#2D2D2D] text-[10px] mb-2">
                        📱 SÍGUENOS EN REDES SOCIALES:
                      </h3>
                      <p className="text-[9px] text-gray-600 mb-1">
                        @HolyCowMX | #HolyCowExperience
                      </p>
                      <p className="text-[8px] text-gray-500">
                        Comparte tu experiencia y etiquétanos para aparecer en nuestras historias
                      </p>
                    </div>

                    {/* Restaurant Info */}
                    <div className="text-center text-[9px] text-gray-500">
                      <p className="font-medium text-[#2D2D2D] mb-1">
                        HOLY COW BURGER & BEER JOINT
                      </p>
                      <p>Av. Principal 123, Ciudad de México</p>
                      <p>Tel: 555-123-4567</p>
                      <p>WhatsApp: 555-987-6543</p>
                      <p>Email: info@holycow.mx</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-[#2D2D2D] text-white px-4 py-4 text-center text-[9px]">
                    <p className="mb-2 font-medium">
                      ¡Gracias por ser parte de la familia Holy Cow!
                    </p>
                    <p className="mb-2">
                      © 2023 Holy Cow. Todos los derechos reservados.
                    </p>
                    <p className="text-[8px] text-gray-300">
                      Si no deseas recibir más correos, haz clic{' '}
                      <a href="#" className="underline text-white hover:text-gray-200">
                        aquí
                      </a>{' '}
                      para darte de baja.
                    </p>
                    <p className="text-[8px] text-gray-400 mt-2">
                      Este correo fue enviado desde una dirección de solo envío. 
                      Para consultas, contáctanos en info@holycow.mx
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
// Componente para mostrar planes de precios
const RewardsPricingModal = ({
  isOpen,
  onClose,
  currentPlan = 'Básico'
}) => {
  if (!isOpen) return null;
  const plans = [{
    name: 'Básico',
    price: 'Gratis',
    features: ['1 campaña activa x mes', 'Estadísticas básicas', 'Soporte por email'],
    gradient: currentPlan === 'Básico' ? 'from-green-400/20 to-green-600/20' : 'from-gray-400/20 to-gray-600/20',
    borderColor: currentPlan === 'Básico' ? 'border-green-400/30' : 'border-gray-300/30'
  }, {
    name: 'Premium',
    price: '$20 USD',
    features: ['5 campañas x mes', 'Estadísticas avanzadas', 'Segmentación de clientes', 'Soporte prioritario'],
    gradient: currentPlan === 'Premium' ? 'from-green-400/20 to-green-600/20' : 'from-gray-400/20 to-gray-600/20',
    borderColor: currentPlan === 'Premium' ? 'border-green-400/30' : 'border-gray-300/30'
  }, {
    name: 'Ultra',
    price: '$30 USD',
    features: ['Hasta 10 campañas x mes', 'Estadísticas avanzadas', 'Segmentación avanzada', 'Soporte 24/7'],
    gradient: currentPlan === 'Ultra' ? 'from-green-400/20 to-green-600/20' : 'from-gray-400/20 to-gray-600/20',
    borderColor: currentPlan === 'Ultra' ? 'border-green-400/30' : 'border-gray-300/30'
  }];
  
  return <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]" onClick={onClose}></div>
      <div className="relative max-w-3xl w-full mx-4 p-4">
        <button onClick={onClose} className="absolute -top-6 right-2 text-white hover:text-gray-300 z-10 p-2 rounded-full hover:bg-white/20 transition-all duration-200">
          <XIcon className="h-5 w-5" />
        </button>
        
        {/* Plans Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {plans.map(plan => (
            <div key={plan.name} className={`group relative`}>
              {/* Glass morphism card */}
              <div className={`relative bg-white/10 backdrop-blur-md rounded-xl p-4 border ${plan.borderColor} shadow-xl transition-all duration-300 transform hover:scale-105 hover:bg-white/15 ${plan.name === currentPlan ? 'ring-2 ring-white/50 bg-white/15' : ''} h-80`}>
                
                {/* Background gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} rounded-xl opacity-50`}></div>
                
                {/* Current plan badge */}
                {plan.name === currentPlan && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-white text-custom-green-600 px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                      Plan Actual
                    </span>
                  </div>
                )}

                {/* Card content */}
                <div className="relative z-10 flex flex-col h-full">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {plan.name}
                    </h3>
                    <div className="text-2xl font-extrabold text-white mb-1">
                      {plan.price}
                    </div>
                    {plan.price !== 'Gratis' && (
                      <p className="text-white/70 text-xs">por mes</p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className={`space-y-2 mb-4 flex-grow ${plan.price === 'Gratis' ? 'mt-4' : ''}`}>
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0 w-4 h-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mt-0.5 mr-2">
                          <svg className="w-2 h-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-white/90 text-xs leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button 
                    className={`w-full py-2 px-4 rounded-lg text-xs font-semibold transition-all duration-300 mt-auto ${
                      plan.name === currentPlan 
                        ? 'bg-white/20 text-white cursor-default backdrop-blur-sm border border-white/30' 
                        : 'bg-white text-gray-900 hover:bg-white/90 hover:shadow-lg transform hover:-translate-y-0.5'
                    }`} 
                    disabled={plan.name === currentPlan}
                  >
                    {plan.name === currentPlan ? 'Tu Plan Actual' : 'Seleccionar Plan'}
                  </button>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-2 right-2 w-4 h-4 bg-white/10 rounded-full blur-sm"></div>
                <div className="absolute bottom-2 left-2 w-3 h-3 bg-white/5 rounded-full blur-sm"></div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>;
};
// Main Component
const RewardsManagement = () => {
  const auth = useAuth();
  const adminApi = useAdminPortalApi();
  const { restaurant, loading: restaurantLoading } = useRestaurant();

  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [activeFilter, setActiveFilter] = useState('all');
  const [previewCampaign, setPreviewCampaign] = useState(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showCampaignDashboard, setShowCampaignDashboard] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  // New campaign flow states
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCampaignDetailsModal, setShowCampaignDetailsModal] = useState(false);
  const [currentSegments, setCurrentSegments] = useState<CustomerSegment[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(true);
  const [segmentsError, setSegmentsError] = useState('');
  const [currentTemplates, setCurrentTemplates] = useState(savedTemplates);
  const [newCampaignData, setNewCampaignData] = useState({
    name: '',
    selectedSegment: null as CustomerSegment | null,
    selectedTemplate: null
  });

  // Get restaurant ID from context
  const restaurantId = restaurant?.id || null;

  // Initialize auth hook once when component mounts
  useEffect(() => {
    // Initialize auth hook for segments API
    setAuthHook(() => auth);
  }, []);

  // Load segments when restaurant is available
  useEffect(() => {
    if (restaurantId && !restaurantLoading) {
      loadSegments();
    }
  }, [restaurantId, restaurantLoading]);

  const loadSegments = async () => {
    // Validate restaurant ID before loading
    if (!restaurantId) {
      console.log('No restaurant ID available, skipping segment loading...');
      setSegmentsLoading(false);
      return;
    }

    // Prevent multiple simultaneous calls
    if (segmentsLoading) {
      console.log('Segments already loading, skipping...');
      return;
    }

    try {
      console.log('Loading segments for restaurant:', restaurantId);
      setSegmentsLoading(true);
      setSegmentsError('');
      const segments = await segmentsApi.getSegments(restaurantId);
      setCurrentSegments(segments);
      console.log('Segments loaded successfully:', segments.length);
    } catch (error: any) {
      console.error('Error loading segments:', error);
      setSegmentsError(error.message || 'Error al cargar segmentos');
      // Use fallback segments in case of error
      setCurrentSegments(fallbackSegments);
    } finally {
      setSegmentsLoading(false);
    }
  };
  // Filter campaigns based on active filter
  const filteredCampaigns = campaigns.filter(campaign => {
    if (activeFilter === 'all') return true;
    return campaign.status === activeFilter;
  });
  // Get counts for KPI buttons
  const allCount = campaigns.length;
  const activeCount = campaigns.filter(c => c.status === 'active').length;
  const pausedCount = campaigns.filter(c => c.status === 'paused').length;
  const expiredCount = campaigns.filter(c => c.status === 'expired').length;
  const handleToggleActive = (id, status) => {
    setCampaigns(prev => prev.map(campaign => campaign.id === id ? {
      ...campaign,
      status
    } : campaign));
  };
  const handleDeleteCampaign = id => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta campaña?')) {
      setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
    }
  };
  const handlePreview = campaign => {
    setPreviewCampaign(campaign);
  };
  const handleOpenDashboard = campaign => {
    setSelectedCampaign(campaign);
    setShowCampaignDashboard(true);
  };
  // New campaign flow handlers
  const handleOpenNewCampaign = () => {
    setShowNewCampaignModal(true);
  };
  const handleCloseNewCampaign = () => {
    setShowNewCampaignModal(false);
  };
  const handleCreateSegment = () => {
    console.log('handleCreateSegment called - restaurant:', restaurant, 'restaurantId:', restaurantId, 'restaurantLoading:', restaurantLoading);
    if (!restaurantId || !restaurant) {
      console.error('No restaurant ID available for creating segment');
      setSegmentsError('Error: No se puede crear segmento sin restaurant ID válido');
      return;
    }
    setShowNewCampaignModal(false);
    setShowSegmentModal(true);
  };
  const handleDesignTemplate = () => {
    setShowNewCampaignModal(false);
    setShowTemplateModal(true);
  };
  const handleCloseSegmentModal = () => {
    setShowSegmentModal(false);
    setShowNewCampaignModal(true);
  };
  const handleCloseTemplateModal = () => {
    setShowTemplateModal(false);
    setShowNewCampaignModal(true);
  };
  const handleApplySegment = (segment: CustomerSegment) => {
    // Add or update the segment in the list
    setCurrentSegments(prev => {
      const existingIndex = prev.findIndex(s => s.id === segment.id);
      if (existingIndex >= 0) {
        // Update existing segment
        const updated = [...prev];
        updated[existingIndex] = segment;
        return updated;
      } else {
        // Add new segment
        return [...prev, segment];
      }
    });
    setShowSegmentModal(false);
    setShowNewCampaignModal(true);
  };
  const handleSaveTemplate = template => {
    // Add the new template to the list
    setCurrentTemplates([...currentTemplates, template]);
    setShowTemplateModal(false);
    setShowNewCampaignModal(true);
  };
  const handleCreateCampaign = (campaignName: string, selectedSegment: CustomerSegment | null, selectedTemplate: any) => {
    // Store campaign data and proceed to details screen
    setNewCampaignData({
      name: campaignName,
      selectedSegment,
      selectedTemplate
    });
    setShowNewCampaignModal(false);
    setShowCampaignDetailsModal(true);
  };
  const handleCloseCampaignDetails = () => {
    setShowCampaignDetailsModal(false);
  };
  const handleFinalizeCampaign = campaignDetails => {
    // Create a new campaign with all the provided data
    const newCampaign = {
      id: Date.now(),
      name: newCampaignData.name,
      description: 'Nueva campaña creada',
      pointsRequired: 100,
      expirationDays: 30,
      active: true,
      status: 'active',
      icon: 'award',
      image: newCampaignData.selectedTemplate?.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
      emailSubject: newCampaignData.name,
      emailBody: 'Descripción de la campaña',
      startDate: campaignDetails.startDate,
      endDate: campaignDetails.endDate,
      conditions: campaignDetails.rewardCode ? `Usa el código ${campaignDetails.rewardCode} para obtener ${campaignDetails.discountPercentage}% de descuento` : 'Términos y condiciones aplican',
      cta: 'Ver más',
      templateName: newCampaignData.selectedTemplate ? newCampaignData.selectedTemplate.name : 'Template predeterminado',
      sent: false,
      deliveryMethods: campaignDetails.deliveryMethods,
      segment: newCampaignData.selectedSegment?.segment_name || 'Todos los clientes'
    };
    setCampaigns([...campaigns, newCampaign]);
    setShowCampaignDetailsModal(false);
  };
  return <div className="w-full bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 -mt-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mt-5 mb-2">
                Gestión de Scala 
              </h1>
              <p className="text-sm text-gray-600">
                Gestiona tus campañas de recompensas y fidelización
              </p>
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setShowPricingModal(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
                Ver Planes
              </button>
              <button onClick={handleOpenNewCampaign} className="bg-custom-green-600 text-white px-4 py-2 rounded-md hover:bg-custom-green-700 transition-colors flex items-center">
                <PlusIcon className="h-5 w-5 mr-2" />
                Nueva Campaña
              </button>
            </div>
          </div>
        </div>

        {/* KPI Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <KpiButton label="Todas" count={allCount} active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} icon={<TargetIcon className="h-6 w-6" />} />
          <KpiButton label="Activas" count={activeCount} active={activeFilter === 'active'} onClick={() => setActiveFilter('active')} icon={<CheckCircleIcon className="h-6 w-6 text-green-500" />} />
          <KpiButton label="Pausadas" count={pausedCount} active={activeFilter === 'paused'} onClick={() => setActiveFilter('paused')} icon={<ClockIcon className="h-6 w-6 text-yellow-500" />} />
          <KpiButton label="Expiradas" count={expiredCount} active={activeFilter === 'expired'} onClick={() => setActiveFilter('expired')} icon={<AlertCircleIcon className="h-6 w-6 text-gray-500" />} />
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map(campaign => <div key={campaign.id} onClick={() => handleOpenDashboard(campaign)} className="cursor-pointer">
              <CampaignCard campaign={campaign} onPreview={e => {
            e.stopPropagation();
            handlePreview(campaign);
          }} onToggleActive={(id, status) => {
            handleToggleActive(id, status);
          }} onDelete={id => {
            handleDeleteCampaign(id);
          }} />
            </div>)}
        </div>

        {/* Empty State */}
        {filteredCampaigns.length === 0 && 
          <div className="text-center py-12">
            <AwardIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay campañas
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron campañas para el filtro seleccionado.
            </p>
          </div>
        }
        
      </div>

      {/* Email Preview Modal */}
      {previewCampaign && <EmailPreview campaign={previewCampaign} onClose={() => setPreviewCampaign(null)} />}

      {/* Campaign Dashboard Modal */}
      <CampaignDashboardModal isOpen={showCampaignDashboard} onClose={() => setShowCampaignDashboard(false)} campaign={selectedCampaign} />

      {/* Pricing Modal */}
      <RewardsPricingModal 
        isOpen={showPricingModal} 
        onClose={() => setShowPricingModal(false)} 
        currentPlan="Básico" 
      />

      {/* New Campaign Modal */}
      <NewCampaignModal
        isOpen={showNewCampaignModal}
        onClose={handleCloseNewCampaign}
        onCreateSegment={handleCreateSegment}
        onDesignTemplate={handleDesignTemplate}
        onNext={handleCreateCampaign}
        savedSegments={currentSegments}
        savedTemplates={currentTemplates}
      />

      {/* Segments Error Toast */}
      {segmentsError && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center">
            <AlertCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Error al cargar segmentos</p>
              <p className="text-xs mt-1">{segmentsError}</p>
              <button
                onClick={loadSegments}
                className="text-xs underline mt-1 hover:no-underline"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Segment Modal */}
      <SegmentModal
        isOpen={showSegmentModal}
        onClose={handleCloseSegmentModal}
        onApplySegment={handleApplySegment}
        restaurantId={restaurantId!} // Non-null assertion since we validate before opening
      />

      {/* Template Designer Modal */}
      <TemplateDesignerModal 
        isOpen={showTemplateModal} 
        onClose={handleCloseTemplateModal} 
        onSave={handleSaveTemplate} 
      />

      {/* Campaign Details Modal */}
      <CampaignDetailsModal 
        isOpen={showCampaignDetailsModal} 
        onClose={handleCloseCampaignDetails} 
        onCreateCampaign={handleFinalizeCampaign} 
        campaignName={newCampaignData.name} 
        selectedSegment={newCampaignData.selectedSegment} 
        selectedTemplate={newCampaignData.selectedTemplate} 
      />

    </div>;
};
export default RewardsManagement;