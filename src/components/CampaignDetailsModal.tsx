import React, { useEffect, useState } from "react";
import {
  XIcon,
  CalendarIcon,
  TagIcon,
  AlertCircleIcon,
  CheckIcon,
} from "lucide-react";
import { WhatsAppTemplate } from "./WhatsAppTemplateModal";

interface CampaignDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCampaign: (campaignDetails: CampaignDetails) => void;
  campaignName: string;
  selectedSegment: any;
  selectedTemplate: any;
  selectedWhatsAppTemplate?: WhatsAppTemplate;
  initialDeliveryMethods?: { whatsapp: boolean; sms: boolean };
}
interface CampaignDetails {
  deliveryMethods: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  whatsappTemplate?: {
    template: WhatsAppTemplate;
    variables: Record<string, string>;
  };
  startDate: string;
  endDate: string;
  rewardCode: string;
  discountPercentage: number;
  status: "draft" | "scheduled" | "running" | "paused";
}
const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({
  isOpen,
  onClose,
  onCreateCampaign,
  campaignName,
  selectedSegment,
  selectedTemplate,
  selectedWhatsAppTemplate,
  initialDeliveryMethods,
}) => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];
  // Set default end date to 30 days from now
  const defaultEndDate = new Date();
  defaultEndDate.setDate(defaultEndDate.getDate() + 30);
  const defaultEndDateStr = defaultEndDate.toISOString().split("T")[0];
  // State for form fields
  const deliveryMethods = {
    email: false,
    sms: initialDeliveryMethods?.sms || false,
    whatsapp: initialDeliveryMethods?.whatsapp || false,
  };
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(defaultEndDateStr);
  const [campaignStatus, setCampaignStatus] = useState<
    "draft" | "scheduled" | "running" | "paused"
  >("running");
  // Validation states
  const [dateError, setDateError] = useState("");
  const [formValid, setFormValid] = useState(false);
  // Check if form is valid
  useEffect(() => {
    // Check if at least one delivery method is selected
    const hasDeliveryMethod =
      deliveryMethods.email || deliveryMethods.sms || deliveryMethods.whatsapp;
    // Check if dates are valid
    const datesValid = !dateError && startDate && endDate;
    // Update form validity
    setFormValid(hasDeliveryMethod && datesValid);
  }, [deliveryMethods, startDate, endDate, dateError]);
  // Validate dates when they change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        setDateError("La fecha de fin debe ser posterior a la fecha de inicio");
      } else {
        setDateError("");
      }
    }
  }, [startDate, endDate]);

  // Handle form submission
  const handleSubmit = () => {
    if (formValid) {
      onCreateCampaign({
        deliveryMethods,
        whatsappTemplate: selectedWhatsAppTemplate
          ? {
              template: selectedWhatsAppTemplate,
              variables: selectedWhatsAppTemplate.selectedVariables || {},
            }
          : undefined,
        startDate,
        endDate,
        rewardCode: "",
        discountPercentage: 0,
        status: campaignStatus,
      });
    }
  };
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-xl sm:rounded-2xl max-w-3xl w-full mx-auto p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-2xl font-semibold text-gray-900">
            <span className="hidden sm:inline">Configurar detalles de la campaña</span>
            <span className="sm:hidden">Detalles de campaña</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 flex-shrink-0 ml-2"
          >
            <XIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
        {/* Campaign summary */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-md sm:rounded-lg border border-gray-200">
          <div className="flex items-center mb-2">
            <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-custom-green-600 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              Campaña:{" "}
              <span className="text-custom-green-600">{campaignName}</span>
            </span>
          </div>
          {selectedSegment && (
            <div className="flex items-center mb-2">
              <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-custom-green-600 mr-1.5 sm:mr-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                Segmento:{" "}
                <span className="text-custom-green-600">
                  {selectedSegment.segment_name}
                </span>
              </span>
            </div>
          )}
          {selectedTemplate && (
            <div className="flex items-center mb-2">
              <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-custom-green-600 mr-1.5 sm:mr-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                Template SMS:{" "}
                <span className="text-custom-green-600">
                  {selectedTemplate.name}
                </span>
              </span>
            </div>
          )}
          {selectedWhatsAppTemplate && (
            <div className="flex items-center">
              <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-custom-green-600 mr-1.5 sm:mr-2" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                Template WhatsApp:{" "}
                <span className="text-custom-green-600">
                  {selectedWhatsAppTemplate.name}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Campaign Status */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
            Estado inicial de la campaña <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setCampaignStatus("running")}
              className={`p-3 sm:p-4 rounded-md sm:rounded-lg border-2 transition-all ${
                campaignStatus === "running"
                  ? "border-custom-green-600 bg-custom-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    campaignStatus === "running"
                      ? "bg-custom-green-600"
                      : "bg-gray-300"
                  }`}
                />
              </div>
              <div className="text-center">
                <div
                  className={`text-sm sm:text-base font-medium ${
                    campaignStatus === "running"
                      ? "text-custom-green-600"
                      : "text-gray-700"
                  }`}
                >
                  Activa
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  <span className="hidden sm:inline">La campaña se activará inmediatamente</span>
                  <span className="sm:hidden">Se activa ya</span>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setCampaignStatus("paused")}
              className={`p-3 sm:p-4 rounded-md sm:rounded-lg border-2 transition-all ${
                campaignStatus === "paused"
                  ? "border-yellow-600 bg-yellow-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    campaignStatus === "paused"
                      ? "bg-yellow-600"
                      : "bg-gray-300"
                  }`}
                />
              </div>
              <div className="text-center">
                <div
                  className={`text-sm sm:text-base font-medium ${
                    campaignStatus === "paused"
                      ? "text-yellow-600"
                      : "text-gray-700"
                  }`}
                >
                  Pausada
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
                  <span className="hidden sm:inline">La campaña se guardará pero no se activará</span>
                  <span className="sm:hidden">Se guarda sin activar</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Campaign Dates */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
            Fechas de la campaña <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label
                htmlFor="start-date"
                className="block text-xs sm:text-sm text-gray-600 mb-1"
              >
                <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                Fecha de inicio
              </label>
              <input
                type="date"
                id="start-date"
                min={today}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md sm:rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-green-500"
              />
            </div>
            <div>
              <label
                htmlFor="end-date"
                className="block text-xs sm:text-sm text-gray-600 mb-1"
              >
                <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                Fecha de fin
              </label>
              <input
                type="date"
                id="end-date"
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md sm:rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-green-500"
              />
            </div>
          </div>
          {dateError && (
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-red-600 flex items-center">
              <AlertCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              {dateError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 sm:space-x-3 pt-3 sm:pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md sm:rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formValid}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm rounded-md sm:rounded-lg text-white ${!formValid ? "bg-gray-300 cursor-not-allowed" : "bg-custom-green-600 hover:bg-custom-green-700"}`}
          >
            <span className="hidden sm:inline">Crear campaña</span>
            <span className="sm:hidden">Crear</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default CampaignDetailsModal;
