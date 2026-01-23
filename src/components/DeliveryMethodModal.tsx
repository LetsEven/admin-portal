import React from "react";
import {
  XIcon,
  MessageCircleIcon,
  PhoneIcon,
  SparklesIcon,
  CheckIcon,
} from "lucide-react";

interface DeliveryMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: "whatsapp" | "sms" | "both") => void;
}

const DeliveryMethodModal: React.FC<DeliveryMethodModalProps> = ({
  isOpen,
  onClose,
  onSelectMethod,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full mx-auto p-4 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-2xl font-semibold text-gray-900">
            Selecciona método de envío
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1.5 sm:p-2 rounded-full hover:bg-gray-100"
          >
            <XIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
        <p className="text-xs sm:text-base text-gray-600 mb-4 sm:mb-6">
          Elige cómo quieres enviar tu campaña a tus clientes.
        </p>

        {/* Delivery Method Options */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {/* WhatsApp Option */}
          <button
            onClick={() => onSelectMethod("whatsapp")}
            className="border-2 border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-6 hover:border-custom-green-500 hover:bg-custom-green-50 transition-all group relative"
          >
            {/* Recommended Badge */}
            <div className="absolute -top-1.5 -right-1 sm:-top-2 sm:-right-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-[9px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm flex items-center">
              <SparklesIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
              <span className="hidden sm:inline">Recomendado</span>
              <span className="sm:hidden">Top</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-16 sm:h-16 bg-custom-green-50 rounded-full flex items-center justify-center mb-2 sm:mb-4 group-hover:bg-custom-green-100 transition-colors">
                <MessageCircleIcon className="h-5 w-5 sm:h-8 sm:w-8 text-custom-green-600" />
              </div>
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                WhatsApp
              </h3>
              <p className="text-[10px] sm:text-sm text-gray-600 mb-1 sm:mb-2">
                98% de tasa de apertura
              </p>
            </div>
          </button>

          {/* SMS Option */}
          <button
            onClick={() => onSelectMethod("sms")}
            className="border-2 border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-6 hover:border-custom-green-500 hover:bg-custom-green-50 transition-all group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-16 sm:h-16 bg-custom-green-50 rounded-full flex items-center justify-center mb-2 sm:mb-4 group-hover:bg-custom-green-100 transition-colors">
                <PhoneIcon className="h-5 w-5 sm:h-8 sm:w-8 text-custom-green-600" />
              </div>
              <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">SMS</h3>
              <p className="text-[10px] sm:text-sm text-gray-600 mb-1 sm:mb-2">
                Mensaje de texto libre
              </p>
            </div>
          </button>
        </div>

        {/* Both Option */}
        <button
          onClick={() => onSelectMethod("both")}
          className="w-full border-2 border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-custom-green-500 hover:bg-custom-green-50 transition-all group"
        >
          <div className="flex items-center justify-center">
            <div className="flex flex-col sm:flex-row items-center sm:space-x-4">
              <div className="flex items-center mb-2 sm:mb-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-custom-green-50 rounded-full flex items-center justify-center group-hover:bg-custom-green-100 transition-colors">
                  <MessageCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-custom-green-600" />
                </div>
                <span className="mx-1.5 sm:mx-2 text-gray-400 text-xs sm:text-base">+</span>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-custom-green-50 rounded-full flex items-center justify-center group-hover:bg-custom-green-100 transition-colors">
                  <PhoneIcon className="h-4 w-4 sm:h-5 sm:w-5 text-custom-green-600" />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-900">
                  WhatsApp + SMS
                </h3>
                <p className="text-[10px] sm:text-sm text-gray-500">
                  Máxima cobertura con ambos canales
                </p>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default DeliveryMethodModal;
