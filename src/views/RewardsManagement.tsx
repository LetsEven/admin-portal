import React, { useEffect, useState, useRef } from "react";
import Joyride from 'react-joyride';
import SegmentModal from "../components/SegmentModal";
import NewCampaignModal from "../components/NewCampaignModal";
import DeliveryMethodModal from "../components/DeliveryMethodModal";
import TemplateDesignerModal from "../components/TemplateDesignerModal";
import CampaignDetailsModal from "../components/CampaignDetailsModal";
import CampaignDashboardModal from "../components/CampaignDashboardModal";
import RewardsPricingModal from "../components/RewardsPricingModal";
import { segmentsApi, CustomerSegment } from "../services/segmentsApi";
import { setAuthHook, useAdminPortalApi } from "../services/adminPortalApi";
import { useCampaignsApi } from "../services/campaignsApi";
import { useSubscriptionsApi } from "../services/subscriptionsApi";
import { useAuth } from "@clerk/nextjs";
import { useRewardsOnboarding, joyrideTheme } from "../hooks/useRewardsOnboarding";
import {
  PlusIcon,
  AwardIcon,
  CoffeeIcon,
  ShoppingBagIcon,
  XIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  EyeIcon,
  TrashIcon,
  BellIcon,
  CalendarIcon,
  MailIcon,
} from "lucide-react";
import { useSmsTemplateApi, SmsTemplate } from "../services/smsTemplateApi";
import { useRestaurant } from "../contexts/RestaurantContext";
import toast from "react-hot-toast";

// Saved segments fallback (will be replaced by API data)
const fallbackSegments: CustomerSegment[] = [];

// KPI Button Component
interface KpiButtonProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

const KpiButton: React.FC<KpiButtonProps> = ({
  label,
  count,
  active,
  onClick,
  icon,
}) => {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border transition-all duration-200 ${active ? "bg-custom-green-50 border-custom-green-200 text-custom-green-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p
            className={`text-2xl font-bold ${active ? "text-custom-green-600" : "text-gray-900"}`}
          >
            {count}
          </p>
        </div>
        <div className="ml-4">{icon}</div>
      </div>
    </button>
  );
};
// Campaign Card Component
interface CampaignCardProps {
  campaign: any;
  onPreview: (campaign: any) => void;
  onToggleActive: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onPreview,
  onToggleActive,
  onDelete,
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const powerButtonRef = useRef<HTMLButtonElement>(null);
  // Format date to dd/mm/yy
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(target) &&
        powerButtonRef.current &&
        !powerButtonRef.current.contains(target)
      ) {
        setShowStatusMenu(false);
      }
    };
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowStatusMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
    };
  }, []);
  const handleStatusChange = (status: string) => {
    onToggleActive(campaign.id, status);
    setShowStatusMenu(false);
  };
  let IconComponent = AwardIcon;
  if (campaign.icon === "coffee") {
    IconComponent = CoffeeIcon;
  } else if (campaign.icon === "shopping-bag") {
    IconComponent = ShoppingBagIcon;
  }
  // Determinar el color del botón de power según el estado
  const getPowerButtonStyles = (status: string): string => {
    switch (status) {
      case "active":
        return "bg-[#DCFCE7] border border-[#22C55E] text-[#15803D] hover:bg-[#BBF7D0]";
      case "paused":
        return "bg-[#FFF7CC] border border-[#FACC15] text-[#A16207] hover:bg-[#FDE68A]";
      case "expired":
        return "bg-gray-100 border border-gray-300 text-gray-500 hover:bg-gray-200";
      default:
        return "bg-[#FFF7CC] border border-[#FACC15] text-[#A16207] hover:bg-[#FDE68A]";
    }
  };
  // Status indicator
  const getStatusBadge = (status: string): JSX.Element | null => {
    switch (status) {
      case "active":
        return (
          <span className="flex items-center text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs font-medium">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Activa
          </span>
        );
      case "paused":
        return (
          <span className="flex items-center text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-xs font-medium">
            <ClockIcon className="h-3 w-3 mr-1" />
            Pausa
          </span>
        );
      case "expired":
        return (
          <span className="flex items-center text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">
            <AlertCircleIcon className="h-3 w-3 mr-1" />
            Expirada
          </span>
        );
      default:
        return null;
    }
  };
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 transition-all duration-200 ease-out hover:bg-[#E9F2F2] hover:border-[#D6E6E6] hover:shadow-md hover:scale-105 focus-within:outline-offset-2 focus-within:outline-[#0EA5E9] focus-within:outline-2 active:scale-[0.995]">
      <div className="relative h-36 overflow-hidden">
        <img
          src={campaign.image}
          alt={campaign.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          {getStatusBadge(campaign.status)}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start">
          <div
            className={`flex-shrink-0 p-2 rounded-full ${campaign.active ? "bg-custom-green-100" : "bg-gray-100"}`}
          >
            <IconComponent
              className={`h-5 w-5 ${campaign.active ? "text-custom-green-600" : "text-gray-400"}`}
            />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              {campaign.name}
            </h3>
            {/*<p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {campaign.description}
            </p>*/}
            {campaign.deliveryMethods &&
              campaign.deliveryMethods.length > 0 && (
                <p className="mt-1 text-xs text-gray-400">
                  {campaign.deliveryMethods
                    .map((method: string) => {
                      const methodLabels: Record<string, string> = {
                        sms: "SMS",
                        whatsapp: "WhatsApp",
                        email: "Email",
                        push: "Push",
                      };
                      return methodLabels[method] || method;
                    })
                    .join(" + ")}
                </p>
              )}
            <div className="mt-2 flex items-center text-xs text-gray-500">
              {/*<span className="bg-custom-green-100 text-custom-green-800 px-2 py-0.5 rounded-full font-medium">
                {campaign.pointsRequired} puntos
              </span>*/}
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
          <button
            onClick={() => onPreview(campaign)}
            className="p-1.5 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0EA5E9]"
            aria-label="Ver vista previa"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          {/* Botón Power/Estado */}
          <div className="relative">
            <button
              ref={powerButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusMenu(!showStatusMenu);
              }}
              aria-haspopup="true"
              aria-expanded={showStatusMenu}
              aria-controls="status-menu"
              className={`p-1.5 flex items-center justify-center rounded-full hover:shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0EA5E9] ${getPowerButtonStyles(campaign.status)}`}
              aria-label="Cambiar estado"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                <line x1="12" y1="2" x2="12" y2="12"></line>
              </svg>
            </button>
            {showStatusMenu && (
              <div
                ref={statusMenuRef}
                id="status-menu"
                className="absolute right-0 bottom-full mb-2 w-36 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                role="menu"
              >
                <button
                  className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center rounded-t-lg focus:outline-none focus:bg-green-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange("active");
                  }}
                  role="menuitem"
                  disabled={campaign.status === "expired"}
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Activa
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 flex items-center focus:outline-none focus:bg-yellow-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange("paused");
                  }}
                  role="menuitem"
                  disabled={campaign.status === "expired"}
                >
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Pausa
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center rounded-b-lg focus:outline-none focus:bg-gray-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange("expired");
                  }}
                  role="menuitem"
                >
                  <AlertCircleIcon className="h-4 w-4 mr-2" />
                  Expirada
                </button>
              </div>
            )}
          </div>
          {/* Botón Eliminar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(campaign.id);
            }}
            className="p-1.5 bg-red-100 rounded-full text-red-600 hover:bg-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0EA5E9]"
            aria-label="Eliminar campaña"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
// Email Preview Component
interface EmailPreviewProps {
  campaign: any;
  onClose: () => void;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({ campaign, onClose }) => {
  if (!campaign) return null;
  // Current time for the email preview
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const timeString = `${hours}:${minutes}`;
  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-[375px] mx-auto">
        {/* Close button positioned outside frame */}
        <button
          onClick={onClose}
          className="absolute -top-8 right-4 text-white hover:text-gray-300 z-50 p-2 rounded-full hover:bg-white/20 transition-colors"
        >
          <XIcon className="h-6 w-6" />
        </button>

        {/* Template name display */}
        {campaign.templateName && (
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-40">
            <span className="inline-block bg-white/90 text-gray-800 px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              {campaign.templateName}
            </span>
          </div>
        )}

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
            <div
              className="absolute inset-0 z-20"
              style={{
                top: "4%",
                left: "7%",
                right: "5%",
                bottom: "1.6%",
              }}
            >
              <div className="bg-white rounded-[50px] overflow-hidden h-full">
                {/* App Header */}
                <div className="px-3 py-2 pt-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src="/holycow-logo.png"
                      alt="Holy Cow Logo"
                      className="h-6 w-auto mr-2"
                    />
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
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  {/* Email Header with Logo */}
                  <div className="bg-[#2D2D2D] text-white px-4 py-3 text-center">
                    <img
                      src="/holycow-logo.png"
                      alt="Holy Cow Logo"
                      className="h-10 mx-auto mb-1"
                    />
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
                    <img
                      src={campaign.image}
                      alt={campaign.name}
                      className="w-full h-32 object-cover"
                    />
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
                      <h2 className="text-xs font-bold mb-2 text-center">
                        🎉 ¡Una experiencia única te espera!
                      </h2>
                      <p className="text-[10px] text-center leading-relaxed">
                        En Holy Cow creemos que cada visita debe ser especial.
                        Por eso hemos preparado esta promoción exclusiva que
                        combina sabor auténtico con la mejor atención. Nuestros
                        chefs han seleccionado los ingredientes más frescos para
                        brindarte una experiencia gastronómica inolvidable.
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
                          alert(
                            "¡Promoción canjeada exitosamente! 🎉\nSe ha descontado " +
                              campaign.pointsRequired +
                              " puntos de tu cuenta Xquisito."
                          );
                        }}
                        className="bg-[#FF9800] hover:bg-[#F57C00] text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all text-xs mx-auto flex items-center"
                      >
                        🎯 Canjear {campaign.pointsRequired} puntos
                      </button>
                    </div>

                    {/* Points Badge */}
                    {campaign.pointsRequired && (
                      <div className="text-center mb-4">
                        <span className="inline-block bg-[#FFECB3] text-[#E65100] px-3 py-1 rounded-full font-medium text-[10px]">
                          {campaign.pointsRequired} puntos
                        </span>
                      </div>
                    )}

                    {/* Additional promotional information */}
                    <div className="bg-[#FFF3E0] p-3 rounded-lg mb-4 border-l-4 border-[#E53935]">
                      <h3 className="font-bold text-[#2D2D2D] text-[10px] mb-2">
                        ✨ MÁS BENEFICIOS PARA TI:
                      </h3>
                      <ul className="text-[9px] text-gray-700 space-y-1">
                        <li>
                          • Ambiente familiar con música en vivo los fines de
                          semana
                        </li>
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
                          <p className="text-[9px] font-medium">
                            Holy Cow Classic
                          </p>
                          <p className="text-[8px] text-gray-600">
                            Hamburguesa doble con queso
                          </p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded text-center">
                          <p className="text-[9px] font-medium">BBQ Ribs</p>
                          <p className="text-[8px] text-gray-600">
                            Costillas BBQ premium
                          </p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded text-center">
                          <p className="text-[9px] font-medium">Craft Beer</p>
                          <p className="text-[8px] text-gray-600">
                            Cerveza artesanal local
                          </p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded text-center">
                          <p className="text-[9px] font-medium">Wings Combo</p>
                          <p className="text-[8px] text-gray-600">
                            Alitas con 4 salsas
                          </p>
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
                          <p className="text-[8px] text-gray-700 italic">
                            "La mejor hamburguesa que he probado. El ambiente es
                            increíble."
                          </p>
                          <p className="text-[7px] text-gray-500 mt-1">
                            - María González ⭐⭐⭐⭐⭐
                          </p>
                        </div>
                        <div className="bg-white p-2 rounded shadow-sm">
                          <p className="text-[8px] text-gray-700 italic">
                            "Excelente servicio y la cerveza artesanal está
                            espectacular."
                          </p>
                          <p className="text-[7px] text-gray-500 mt-1">
                            - Carlos Mendoza ⭐⭐⭐⭐⭐
                          </p>
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
                          Válido hasta:{" "}
                          {new Date(campaign.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-600 mt-1">
                        <span className="font-medium">
                          Términos y condiciones:
                        </span>
                        <br />
                        {campaign.conditions}
                        <br />
                        <br />
                        • Válido únicamente en sucursal principal
                        <br />
                        • No aplica con otras promociones vigentes
                        <br />
                        • Promoción sujeta a disponibilidad
                        <br />• Reservaciones recomendadas para grupos mayores a
                        6 personas
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
                        Comparte tu experiencia y etiquétanos para aparecer en
                        nuestras historias
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
                      Si no deseas recibir más correos, haz clic{" "}
                      <a
                        href="#"
                        className="underline text-white hover:text-gray-200"
                      >
                        aquí
                      </a>{" "}
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
    </div>
  );
};
// Main Component
const RewardsManagement = () => {
  const auth = useAuth();
  const adminApi = useAdminPortalApi();
  const campaignsApi = useCampaignsApi();
  const subscriptionsApi = useSubscriptionsApi();
  const { restaurant, loading: restaurantLoading } = useRestaurant();

  // Rewards onboarding tour
  const { run, steps, handleJoyrideCallback, startOnboarding } = useRewardsOnboarding();

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignsError, setCampaignsError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Plan and limits state
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [planLimits, setPlanLimits] = useState<any>(null);
  const [campaignUsage, setCampaignUsage] = useState<number>(0);
  const [previewCampaign, setPreviewCampaign] = useState(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showCampaignDashboard, setShowCampaignDashboard] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  // New campaign flow states
  const [showDeliveryMethodModal, setShowDeliveryMethodModal] = useState(false);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCampaignDetailsModal, setShowCampaignDetailsModal] =
    useState(false);
  const [currentSegments, setCurrentSegments] = useState<CustomerSegment[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [segmentsError, setSegmentsError] = useState("");
  const [currentTemplates, setCurrentTemplates] = useState<SmsTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(
    null
  );

  // API hooks
  const smsTemplateApi = useSmsTemplateApi();
  const [newCampaignData, setNewCampaignData] = useState<{
    name: string;
    selectedSegment: any;
    selectedTemplate: any;
    selectedWhatsAppTemplate?: any;
    deliveryMethods?: { whatsapp: boolean; sms: boolean };
    promoCode?: string;
    discountPercentage?: string;
  }>({
    name: "",
    selectedSegment: null as CustomerSegment | null,
    selectedTemplate: null,
    selectedWhatsAppTemplate: undefined,
    deliveryMethods: { whatsapp: false, sms: false },
    promoCode: "",
    discountPercentage: "",
  });

  // Load SMS templates on mount
  useEffect(() => {
    if (restaurant?.id) {
      loadSmsTemplates();
    }
  }, [restaurant?.id]);

  const loadSmsTemplates = async () => {
    try {
      setTemplatesLoading(true);
      setTemplatesError(null);

      // Restaurant ID is obtained from auth in backend
      const templates = await smsTemplateApi.getByRestaurant();
      setCurrentTemplates(templates);
    } catch (error) {
      console.error("Error loading SMS templates:", error);
      setTemplatesError(
        error instanceof Error ? error.message : "Failed to load templates"
      );
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Get restaurant ID from context
  const restaurantId = restaurant?.id || null;

  // Initialize auth hook once when component mounts
  useEffect(() => {
    // Initialize auth hook for segments API
    setAuthHook(() => auth);
  }, []);

  // Load segments and campaigns when restaurant is available
  useEffect(() => {
    if (restaurantId && !restaurantLoading) {
      loadSegments();
      loadCampaigns();
      loadPlanInfo();
    }
  }, [restaurantId, restaurantLoading]);

  // Iniciar tour cuando la página esté completamente cargada
  useEffect(() => {
    // Tour se muestra siempre para explicar funcionalidad, sin importar estado de datos
    if (!restaurantLoading && restaurant?.id) {
      // Pequeño delay para asegurar que todos los elementos están renderizados
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [restaurantLoading, restaurant?.id, startOnboarding]);

  const loadPlanInfo = async () => {
    if (!restaurantId) return;

    try {
      console.log("Loading plan info for restaurant:", restaurantId);
      const [subscription, plans] = await Promise.all([
        subscriptionsApi.getCurrentSubscription(),
        subscriptionsApi.getPlans()
      ]);

      console.log("Current subscription:", subscription);
      setCurrentPlan(subscription);

      if (subscription && plans) {
        const planConfig = plans.find(p => p.id === subscription.plan_type);
        if (planConfig) {
          setPlanLimits(planConfig.limits);
          console.log("Plan limits loaded:", planConfig.limits);
          console.log(`✅ Plan: ${subscription.plan_type}, Campaigns limit: ${planConfig.limits.campaigns_per_month}`);
        }
      }
    } catch (error) {
      console.error("Error loading plan info:", error);
    }
  };

  const loadCampaigns = async () => {
    if (!restaurantId) {
      console.log("No restaurant ID available, skipping campaigns loading...");
      setCampaignsLoading(false);
      return;
    }

    if (campaignsLoading) {
      console.log("Campaigns already loading, skipping...");
      return;
    }

    try {
      console.log("Loading campaigns for restaurant:", restaurantId);
      setCampaignsLoading(true);
      setCampaignsError("");

      const campaignsData = await campaignsApi.getCampaigns(restaurantId);

      // Transform API data to match component structure
      const transformedCampaigns = campaignsData.map((campaign: any): any => {
        // Calculate duration in days from start_date to end_date
        const startDate = new Date(campaign.start_date);
        const endDate = new Date(campaign.end_date);
        const durationInMs = endDate.getTime() - startDate.getTime();
        const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24));

        return {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description || "",
          pointsRequired: campaign.points_required || 0,
          expirationDays: durationInDays,
          active: campaign.status === "running",
          status: mapCampaignStatus(campaign.status),
          icon: "award",
          image:
            "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
          emailSubject: campaign.name,
          emailBody: campaign.reward_description || campaign.description || "",
          startDate: campaign.start_date,
          endDate: campaign.end_date,
          conditions: campaign.reward_code
            ? `Usa el código ${campaign.reward_code} para obtener ${campaign.reward_value}% de descuento`
            : "Términos y condiciones aplican",
          cta: "Ver más",
          templateName:
            campaign.templates?.[0]?.template_data?.name ||
            "Template predeterminado",
          sent: campaign.total_sent > 0,
          deliveryMethods: campaign.delivery_methods,
          segment:
            campaign.customer_segments?.segment_name || "Todos los clientes",
          templates: campaign.templates || [], // Include templates array
          rewardValue: campaign.reward_value,
          rewardType: campaign.reward_type,
          restaurantId: campaign.restaurant_id,
          apiData: campaign, // Keep original data for updates
        };
      });

      setCampaigns(transformedCampaigns);
      setCampaignUsage(transformedCampaigns.length);
      console.log(
        "Campaigns loaded successfully:",
        transformedCampaigns.length
      );
    } catch (error: any) {
      console.error("Error loading campaigns:", error);
      setCampaignsError(error.message || "Error al cargar campañas");
      toast.error("Error al cargar campañas");
    } finally {
      console.log("🏁 Campaigns loading finished");
      setCampaignsLoading(false);
    }
  };

  const mapCampaignStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: "paused",
      scheduled: "paused",
      running: "active",
      paused: "paused",
      completed: "expired",
      cancelled: "expired",
    };
    return statusMap[status] || "paused";
  };

  const loadSegments = async () => {
    // Validate restaurant ID before loading
    if (!restaurantId) {
      console.log("No restaurant ID available, skipping segment loading...");
      setSegmentsLoading(false);
      return;
    }

    // Prevent multiple simultaneous calls
    if (segmentsLoading) {
      console.log("Segments already loading, skipping...");
      return;
    }

    try {
      console.log("Loading segments for restaurant:", restaurantId);
      setSegmentsLoading(true);
      setSegmentsError("");

      // Add more detailed logging
      const segments = await segmentsApi.getSegments(restaurantId);

      setCurrentSegments(segments);
      console.log("Segments loaded successfully:", segments.length);
    } catch (error: any) {
      console.error("Error loading segments:", error);
      setSegmentsError(error.message || "Error al cargar segmentos");
      // Use fallback segments in case of error
      setCurrentSegments(fallbackSegments);
    } finally {
      console.log("🏁 Segments loading finished");
      setSegmentsLoading(false);
    }
  };
  // Filter campaigns based on active filter
  const filteredCampaigns = campaigns.filter((campaign: any) => {
    if (activeFilter === "all") return true;
    return campaign.status === activeFilter;
  });
  // Get counts for KPI buttons
  const allCount = campaigns.length;
  const activeCount = campaigns.filter(
    (c: any) => c.status === "active"
  ).length;
  const pausedCount = campaigns.filter(
    (c: any) => c.status === "paused"
  ).length;
  const expiredCount = campaigns.filter(
    (c: any) => c.status === "expired"
  ).length;
  const handleToggleActive = async (id: string, status: string) => {
    if (!restaurantId) {
      toast.error("Error: No se encontró el ID del restaurante");
      return;
    }

    const loadingToast = toast.loading("Actualizando estado...");

    try {
      // Map UI status to API status
      const apiStatusMap: Record<string, string> = {
        active: "running",
        paused: "paused",
        expired: "cancelled",
      };

      const apiStatus = apiStatusMap[status] || "paused";

      // Update campaign status via API
      await campaignsApi.updateCampaignStatus(id, apiStatus, restaurantId);

      toast.success("Estado actualizado exitosamente", { id: loadingToast });

      // Reload campaigns to reflect changes
      await loadCampaigns();
    } catch (error: any) {
      console.error("Error updating campaign status:", error);
      toast.error(error.message || "Error al actualizar estado", {
        id: loadingToast,
      });
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!restaurantId) {
      toast.error("Error: No se encontró el ID del restaurante");
      return;
    }

    if (
      !window.confirm("¿Estás seguro de que quieres eliminar esta campaña?")
    ) {
      return;
    }

    const loadingToast = toast.loading("Eliminando campaña...");

    try {
      await campaignsApi.deleteCampaign(id, restaurantId);

      toast.success("Campaña eliminada exitosamente", { id: loadingToast });

      // Reload campaigns to reflect changes
      await loadCampaigns();
    } catch (error: any) {
      console.error("Error deleting campaign:", error);
      toast.error(error.message || "Error al eliminar campaña", {
        id: loadingToast,
      });
    }
  };
  const handlePreview = (campaign: any) => {
    setPreviewCampaign(campaign);
  };
  const handleOpenDashboard = (campaign: any) => {
    setSelectedCampaign(campaign);
    setShowCampaignDashboard(true);
  };
  // Check if user can create new campaign
  const canCreateCampaign = () => {
    if (!planLimits) return true; // Allow if limits not loaded yet

    const limit = planLimits.campaigns_per_month;
    if (limit === -1) return true; // Unlimited

    return campaignUsage < limit;
  };

  const getRemainingCampaigns = () => {
    if (!planLimits) return null;

    const limit = planLimits.campaigns_per_month;
    if (limit === -1) return "Ilimitadas";

    return Math.max(0, limit - campaignUsage);
  };

  // New campaign flow handlers
  const handleOpenNewCampaign = () => {
    if (!canCreateCampaign()) {
      const remaining = getRemainingCampaigns();
      toast.error(
        `Has alcanzado el límite de campañas de tu plan. Campañas restantes: ${remaining}. ¡Actualiza tu plan para crear más campañas!`
      );
      setShowPricingModal(true);
      return;
    }

    setShowDeliveryMethodModal(true);
  };

  const handleSelectDeliveryMethod = (method: "whatsapp" | "sms" | "both") => {
    // Set delivery methods based on selection
    setNewCampaignData((prev) => ({
      ...prev,
      deliveryMethods: {
        whatsapp: method === "whatsapp" || method === "both",
        sms: method === "sms" || method === "both",
      },
    }));
    // Close delivery method modal and open campaign modal
    setShowDeliveryMethodModal(false);
    setShowNewCampaignModal(true);
  };

  const handleChangeDeliveryMethod = () => {
    // Reopen delivery method modal to change selection
    setShowNewCampaignModal(false);
    setShowDeliveryMethodModal(true);
  };

  const handleAddDeliveryMethod = (method: "whatsapp" | "sms") => {
    // Add the additional delivery method
    setNewCampaignData((prev) => ({
      ...prev,
      deliveryMethods: {
        whatsapp: prev.deliveryMethods?.whatsapp || method === "whatsapp",
        sms: prev.deliveryMethods?.sms || method === "sms",
      },
    }));
  };

  const handleCloseNewCampaign = () => {
    setShowNewCampaignModal(false);
    setShowDeliveryMethodModal(true);
  };
  const handleCreateSegment = () => {
    console.log(
      "handleCreateSegment called - restaurant:",
      restaurant,
      "restaurantId:",
      restaurantId,
      "restaurantLoading:",
      restaurantLoading
    );
    if (!restaurantId || !restaurant) {
      console.error("No restaurant ID available for creating segment");
      setSegmentsError(
        "Error: No se puede crear segmento sin restaurant ID válido"
      );
      return;
    }
    setShowNewCampaignModal(false);
    setShowSegmentModal(true);
  };
  const handleDesignTemplate = (
    template?: SmsTemplate,
    promoCode?: string,
    discountPercentage?: string
  ) => {
    // Update newCampaignData with the promo values if provided
    if (promoCode !== undefined || discountPercentage !== undefined) {
      setNewCampaignData((prev) => ({
        ...prev,
        promoCode: promoCode || prev.promoCode,
        discountPercentage: discountPercentage || prev.discountPercentage,
      }));
    }
    setShowNewCampaignModal(false);
    setEditingTemplate(template || null);
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
    setCurrentSegments((prev) => {
      const existingIndex = prev.findIndex((s) => s.id === segment.id);
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
  const handleSaveTemplate = async (template: any) => {
    const loadingToast = toast.loading("Guardando template...");

    try {
      // If template has ID, it's an update; otherwise create new
      if (
        template.id &&
        typeof template.id === "string" &&
        template.id.length > 10
      ) {
        // Update existing (UUID from backend)
        await smsTemplateApi.update(template.id, {
          name: template.name,
          blocks: template.blocks,
        });
        toast.success("Template actualizado", { id: loadingToast });
      } else {
        // Create new (restaurant_id is obtained from auth in backend)
        await smsTemplateApi.create({
          name: template.name,
          blocks: template.blocks,
        });
        toast.success("Template guardado", { id: loadingToast });
      }

      // Reload templates from backend
      await loadSmsTemplates();
      setShowTemplateModal(false);
      setShowNewCampaignModal(true);
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al guardar template",
        { id: loadingToast }
      );
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este template?")) {
      return;
    }

    const loadingToast = toast.loading("Eliminando template...");

    try {
      await smsTemplateApi.delete(templateId);
      toast.success("Template eliminado", { id: loadingToast });

      // Reload templates
      await loadSmsTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar template",
        { id: loadingToast }
      );
    }
  };
  const handleCreateCampaign = (
    campaignName: string,
    selectedSegment?: CustomerSegment | null,
    selectedTemplate?: any,
    selectedWhatsAppTemplate?: any,
    deliveryMethods?: { whatsapp: boolean; sms: boolean },
    promoCode?: string,
    discountPercentage?: string
  ) => {
    // Store campaign data and proceed to details screen
    setNewCampaignData({
      name: campaignName,
      selectedSegment,
      selectedTemplate,
      selectedWhatsAppTemplate,
      deliveryMethods,
      promoCode,
      discountPercentage,
    });
    setShowNewCampaignModal(false);
    setShowCampaignDetailsModal(true);
  };
  const handleCloseCampaignDetails = () => {
    setShowCampaignDetailsModal(false);
    setShowNewCampaignModal(true);
  };
  const handleFinalizeCampaign = async (campaignDetails: any) => {
    if (!restaurantId) {
      toast.error("Error: No se encontró el ID del restaurante");
      return;
    }

    const loadingToast = toast.loading("Creando campaña...");

    try {
      // Validar que tenemos los datos necesarios
      if (!newCampaignData.selectedSegment?.id) {
        toast.error("Debes seleccionar un segmento de clientes", {
          id: loadingToast,
        });
        return;
      }

      // Procesar discount value (opcional)
      const discountValue = parseFloat(
        newCampaignData.discountPercentage || campaignDetails.discountPercentage
      );
      const hasValidDiscount =
        discountValue && !isNaN(discountValue) && discountValue > 0;

      // Prepare campaign data for API
      const campaignData: any = {
        restaurant_id: restaurantId,
        name: newCampaignData.name,
        description: campaignDetails.description || "Nueva campaña creada",
        segment_id: newCampaignData.selectedSegment.id,
        reward_type: campaignDetails.rewardType || "discount_percentage",
        start_date: campaignDetails.startDate,
        end_date: campaignDetails.endDate,
        status: campaignDetails.status || 'running',
        delivery_methods: Object.entries(campaignDetails.deliveryMethods || {})
          .filter(([_, enabled]) => enabled)
          .map(([method]) => method),
        auto_send: campaignDetails.autoSend || false,
        send_immediately: campaignDetails.sendImmediately || false,
      };

      // Agregar reward_value solo si es válido
      if (hasValidDiscount) {
        campaignData.reward_value = discountValue;
      }

      // Agregar reward_code solo si existe
      const rewardCode =
        newCampaignData.promoCode || campaignDetails.rewardCode;
      if (rewardCode && rewardCode.trim()) {
        campaignData.reward_code = rewardCode.trim();
      }

      // Agregar reward_description si existe
      if (campaignDetails.description && campaignDetails.description.trim()) {
        campaignData.reward_description = campaignDetails.description.trim();
      }

      // Log para debug
      console.log("Creating campaign with data:", campaignData);

      // Create campaign via API
      const createdCampaign = await campaignsApi.createCampaign(campaignData);

      // Associate templates if any
      if (
        newCampaignData.selectedTemplate ||
        newCampaignData.selectedWhatsAppTemplate
      ) {
        const templates = [];

        // Asociar template de SMS si existe
        if (
          newCampaignData.selectedTemplate?.id &&
          campaignDetails.deliveryMethods?.sms
        ) {
          console.log(
            "Associating SMS template:",
            newCampaignData.selectedTemplate.id
          );
          templates.push({
            template_id: newCampaignData.selectedTemplate.id,
            template_type: "sms" as const,
            is_primary: true,
          });
        }

        // Asociar template de WhatsApp si existe (ahora soporta strings)
        if (
          newCampaignData.selectedWhatsAppTemplate?.id &&
          campaignDetails.deliveryMethods?.whatsapp
        ) {
          console.log(
            "Associating WhatsApp template:",
            newCampaignData.selectedWhatsAppTemplate.id
          );
          templates.push({
            template_id: newCampaignData.selectedWhatsAppTemplate.id,
            template_type: "whatsapp" as const,
            is_primary: true,
            custom_variables: campaignDetails.whatsappTemplate?.variables || {},
          });
        }

        if (templates.length > 0) {
          console.log("Templates to associate:", templates);
          await campaignsApi.associateTemplates(createdCampaign.id, {
            restaurant_id: restaurantId,
            templates,
          });
        }
      }

      toast.success("Campaña creada exitosamente", { id: loadingToast });

      // Reload campaigns to show the new one
      await loadCampaigns();

      setShowCampaignDetailsModal(false);

      // Reset campaign data
      setNewCampaignData({
        name: "",
        selectedSegment: null,
        selectedTemplate: null,
        selectedWhatsAppTemplate: undefined,
        deliveryMethods: { whatsapp: false, sms: false },
        promoCode: "",
        discountPercentage: "",
      });
    } catch (error: any) {
      console.error("Error creating campaign:", error);

      // Check if it's a campaign limit error
      if (error.message?.includes('límite de campañas') ||
          error.response?.data?.error_code === 'CAMPAIGN_LIMIT_EXCEEDED') {
        toast.error('¡Límite de campañas alcanzado! Actualiza tu plan para crear más campañas.', {
          id: loadingToast,
          duration: 6000
        });
        setShowPricingModal(true);
      } else {
        toast.error(error.message || "Error al crear campaña", {
          id: loadingToast,
        });
      }
    }
  };
  return (
    <div className="w-full bg-gray-50 min-h-screen">
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
              {/* Plan info */}
              {currentPlan && planLimits ? (
                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500" data-tour="plan-info">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                    Plan {currentPlan.plan_type}
                  </span>
                  <span>
                    Campañas: {campaignUsage}/{planLimits.campaigns_per_month === -1 ? '∞' : planLimits.campaigns_per_month}
                  </span>
                  {getRemainingCampaigns() !== null && (
                    <span className={`${
                      typeof getRemainingCampaigns() === 'number' && getRemainingCampaigns() <= 1
                        ? 'text-red-600 font-medium'
                        : 'text-green-600'
                    }`}>
                      Restantes: {getRemainingCampaigns()}
                    </span>
                  )}
                </div>
              ) : run ? (
                // Placeholder durante el tour cuando no hay plan
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      Ejemplo para tour guiado
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500" data-tour="plan-info">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      Plan Básico
                    </span>
                    <span>
                      Campañas: 0/5
                    </span>
                    <span className="text-green-600">
                      Restantes: 5
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPricingModal(true)}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                Ver Planes
              </button>
              <button
                data-tour="new-campaign-btn"
                onClick={handleOpenNewCampaign}
                disabled={!canCreateCampaign()}
                className={`px-4 py-2 rounded-md transition-colors flex items-center ${
                  canCreateCampaign()
                    ? 'bg-custom-green-600 text-white hover:bg-custom-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nueva Campaña
              </button>
            </div>
          </div>
        </div>

        {/* KPI Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" data-tour="kpi-filters">
          <KpiButton
            label="Todas"
            count={allCount}
            active={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
            icon={<AwardIcon className="h-6 w-6" />}
          />
          <KpiButton
            label="Activas"
            count={activeCount}
            active={activeFilter === "active"}
            onClick={() => setActiveFilter("active")}
            icon={<CheckCircleIcon className="h-6 w-6 text-green-500" />}
          />
          <KpiButton
            label="Pausadas"
            count={pausedCount}
            active={activeFilter === "paused"}
            onClick={() => setActiveFilter("paused")}
            icon={<ClockIcon className="h-6 w-6 text-yellow-500" />}
          />
          <KpiButton
            label="Expiradas"
            count={expiredCount}
            active={activeFilter === "expired"}
            onClick={() => setActiveFilter("expired")}
            icon={<AlertCircleIcon className="h-6 w-6 text-gray-500" />}
          />
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour="campaigns-grid">
          {filteredCampaigns.map((campaign: any) => (
            <div
              key={campaign.id}
              onClick={() => handleOpenDashboard(campaign)}
              className="cursor-pointer"
            >
              <CampaignCard
                campaign={campaign}
                onPreview={(campaign) => {
                  handlePreview(campaign);
                }}
                onToggleActive={(id, status) => {
                  handleToggleActive(id, status);
                }}
                onDelete={(id) => {
                  handleDeleteCampaign(id);
                }}
              />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCampaigns.length === 0 && (
          <div className="text-center py-12">
            <AwardIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No hay campañas
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron campañas para el filtro seleccionado.
            </p>
          </div>
        )}
      </div>

      {/* Email Preview Modal */}
      {previewCampaign && (
        <EmailPreview
          campaign={previewCampaign}
          onClose={() => setPreviewCampaign(null)}
        />
      )}

      {/* Campaign Dashboard Modal */}
      <CampaignDashboardModal
        isOpen={showCampaignDashboard}
        onClose={() => setShowCampaignDashboard(false)}
        campaign={selectedCampaign}
        restaurantId={restaurantId}
      />

      {/* Pricing Modal */}
      <RewardsPricingModal
        isOpen={showPricingModal}
        onClose={() => {
          setShowPricingModal(false);
          // Reload plan info when modal closes in case plan was updated
          loadPlanInfo();
        }}
        currentPlan={currentPlan?.plan_type || "básico"}
      />

      {/* Delivery Method Selection Modal */}
      <DeliveryMethodModal
        isOpen={showDeliveryMethodModal}
        onClose={() => setShowDeliveryMethodModal(false)}
        onSelectMethod={handleSelectDeliveryMethod}
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
        onDeleteTemplate={handleDeleteTemplate}
        initialDeliveryMethods={newCampaignData.deliveryMethods}
        onChangeDeliveryMethod={handleChangeDeliveryMethod}
        onAddDeliveryMethod={handleAddDeliveryMethod}
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
        restaurantId={restaurantId!}
      />

      {/* Template Designer Modal */}
      <TemplateDesignerModal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
        initialTemplate={editingTemplate}
        promoCode={newCampaignData.promoCode}
        discountPercentage={newCampaignData.discountPercentage}
      />

      {/* Campaign Details Modal */}
      <CampaignDetailsModal
        isOpen={showCampaignDetailsModal}
        onClose={handleCloseCampaignDetails}
        onCreateCampaign={handleFinalizeCampaign}
        campaignName={newCampaignData.name}
        selectedSegment={newCampaignData.selectedSegment}
        selectedTemplate={newCampaignData.selectedTemplate}
        selectedWhatsAppTemplate={newCampaignData.selectedWhatsAppTemplate}
        initialDeliveryMethods={newCampaignData.deliveryMethods}
      />

      {/* Tour guiado para gestión de recompensas */}
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
    </div>
  );
};
export default RewardsManagement;
