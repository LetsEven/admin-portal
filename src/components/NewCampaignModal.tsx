import React, { useState } from "react";
import {
  XIcon,
  TargetIcon,
  CheckIcon,
  MessageCircleIcon,
  PhoneIcon,
  PlusCircleIcon,
  EditIcon,
} from "lucide-react";
import WhatsAppTemplateModal, {
  WhatsAppTemplate,
} from "./WhatsAppTemplateModal";
import SmsTemplateSelectionModal from "./SmsTemplateSelectionModal";
import { CustomerSegment } from "../services/segmentsApi";

interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSegment: () => void;
  onDesignTemplate: (
    template?: any,
    promoCode?: string,
    discountPercentage?: string
  ) => void;
  onNext: (
    campaignName: string,
    selectedSegment?: CustomerSegment | null,
    selectedTemplate?: any,
    selectedWhatsAppTemplate?: WhatsAppTemplate,
    deliveryMethods?: { whatsapp: boolean; sms: boolean },
    promoCode?: string,
    discountPercentage?: string
  ) => void;
  savedSegments: CustomerSegment[];
  savedTemplates: any[];
  onDeleteTemplate?: (templateId: string) => void;
  initialDeliveryMethods?: { whatsapp: boolean; sms: boolean };
  onChangeDeliveryMethod?: () => void;
  onAddDeliveryMethod?: (method: "whatsapp" | "sms") => void;
}
const NewCampaignModal: React.FC<NewCampaignModalProps> = ({
  isOpen,
  onClose,
  onCreateSegment,
  onDesignTemplate,
  onNext,
  savedSegments,
  savedTemplates,
  onDeleteTemplate,
  initialDeliveryMethods = { whatsapp: false, sms: false },
  onChangeDeliveryMethod,
  onAddDeliveryMethod,
}) => {
  const [campaignName, setCampaignName] = useState("");
  const [selectedSegment, setSelectedSegment] =
    useState<CustomerSegment | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedWhatsAppTemplate, setSelectedWhatsAppTemplate] =
    useState<WhatsAppTemplate | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showSmsTemplateModal, setShowSmsTemplateModal] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const deliveryMethods = initialDeliveryMethods;

  if (!isOpen) return null;

  const handleNext = () => {
    if (campaignName.trim()) {
      onNext(
        campaignName,
        selectedSegment,
        selectedTemplate,
        selectedWhatsAppTemplate || undefined,
        deliveryMethods,
        promoCode,
        discountPercentage
      );
    }
  };

  const handleWhatsAppTemplateSelect = (template: WhatsAppTemplate) => {
    setSelectedWhatsAppTemplate(template);
    setShowWhatsAppModal(false);
  };

  const handleSegmentSelection = (segment: CustomerSegment) => {
    if (selectedSegment && selectedSegment.id === segment.id) {
      setSelectedSegment(null);
    } else {
      setSelectedSegment(segment);
    }
  };

  const handleSmsTemplateSelection = (template: any) => {
    setSelectedTemplate(template);
  };

  const handleSmsTemplateEdit = (template: any) => {
    onDesignTemplate(template, promoCode, discountPercentage);
  };

  const handleSmsTemplateDelete = (templateId: string) => {
    if (onDeleteTemplate) {
      onDeleteTemplate(templateId);
      // If the deleted template was selected, clear selection
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
      }
    }
  };

  const handleCreateNewSmsTemplate = () => {
    onDesignTemplate(undefined, promoCode, discountPercentage);
  };

  // Check if all required conditions are met for the Next button
  const isNextButtonEnabled = () => {
    // Must have a segment selected
    if (!selectedSegment) return false;

    // Must have at least one delivery method selected
    if (!deliveryMethods.whatsapp && !deliveryMethods.sms) return false;

    // If WhatsApp is selected, must have a WhatsApp template
    if (deliveryMethods.whatsapp && !selectedWhatsAppTemplate) return false;

    // If SMS is selected, must have an SMS template
    if (deliveryMethods.sms && !selectedTemplate) return false;

    // Must have a campaign name
    if (!campaignName.trim()) return false;

    return true;
  };

  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-2xl max-w-3xl w-full mx-auto p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Crear nueva campaña
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-2 rounded-full hover:bg-gray-100"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Selecciona segmento y template, y nombra tu campaña.
        </p>

        {/* Delivery Method Banner */}
        <div className="mb-6 p-4 bg-gradient-to-r from-custom-green-50 to-teal-50 border border-custom-green-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">
                Método de envío:
              </span>
              <div className="flex items-center space-x-2">
                {deliveryMethods.whatsapp && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-custom-green-100 text-custom-green-800">
                    <MessageCircleIcon className="h-4 w-4 mr-1.5" />
                    WhatsApp
                  </span>
                )}
                {deliveryMethods.sms && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-custom-green-100 text-custom-green-800">
                    <PhoneIcon className="h-4 w-4 mr-1.5" />
                    SMS
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Add other delivery method button */}
              {deliveryMethods.whatsapp &&
                !deliveryMethods.sms &&
                onAddDeliveryMethod && (
                  <button
                    onClick={() => onAddDeliveryMethod("sms")}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-custom-green-700 bg-white border border-custom-green-300 rounded-lg hover:bg-custom-green-50 transition-colors"
                  >
                    <PlusCircleIcon className="h-4 w-4 mr-1.5" />
                    Agregar SMS
                  </button>
                )}
              {deliveryMethods.sms &&
                !deliveryMethods.whatsapp &&
                onAddDeliveryMethod && (
                  <button
                    onClick={() => onAddDeliveryMethod("whatsapp")}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-custom-green-700 bg-white border border-custom-green-300 rounded-lg hover:bg-custom-green-50 transition-colors"
                  >
                    <PlusCircleIcon className="h-4 w-4 mr-1.5" />
                    Agregar WhatsApp
                  </button>
                )}
              {/* Change delivery method link */}
              {onChangeDeliveryMethod && (
                <button
                  onClick={onChangeDeliveryMethod}
                  className="inline-flex items-center text-sm text-custom-green-700 hover:text-custom-green-800 font-medium"
                >
                  <EditIcon className="h-3.5 w-3.5 mr-1" />
                  Cambiar método
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Promo Code and Discount Fields */}
        <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            Detalles de la promoción
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="promo-code"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Código de promoción
              </label>
              <input
                type="text"
                id="promo-code"
                placeholder="Ej. VERANO2024"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-green-500"
              />
            </div>
            <div>
              <label
                htmlFor="discount-percentage"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Porcentaje de descuento
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="discount-percentage"
                  placeholder="Ej. 20"
                  min="1"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-green-500"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Create Segment and Design Template Options */}
        <div
          className={`grid grid-cols-1 ${deliveryMethods.whatsapp && deliveryMethods.sms ? "md:grid-cols-3" : deliveryMethods.sms || deliveryMethods.whatsapp ? "md:grid-cols-2" : ""} gap-6 mb-8`}
        >
          {/* Create Segment */}
          <div
            className={`border border-gray-200 rounded-lg p-6 flex flex-col items-center cursor-pointer transition-colors relative ${
              selectedSegment
                ? "bg-[#F0F9F9] border-custom-green-200"
                : "hover:bg-gray-50"
            }`}
            onClick={onCreateSegment}
          >
            {selectedSegment && (
              <div className="absolute top-3 right-3 bg-custom-green-600 rounded-full p-1">
                <CheckIcon className="h-4 w-4 text-white" />
              </div>
            )}
            <div className="w-16 h-16 bg-custom-green-50 rounded-full flex items-center justify-center mb-4">
              <TargetIcon className="h-8 w-8 text-custom-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Crear segmento
            </h3>
            {selectedSegment ? (
              <p className="text-sm text-gray-500 text-center flex items-center">
                <TargetIcon className="h-3 w-3 mr-1" />
                Segmento aplicado: {selectedSegment.segment_name}
              </p>
            ) : (
              <p className="text-sm text-gray-500 text-center">
                Define a quién irá dirigida (frecuencia, ticket, preferencias).
              </p>
            )}
          </div>

          {/* Select WhatsApp Template - Show when WhatsApp is selected */}
          {deliveryMethods.whatsapp && (
            <div
              className={`border border-gray-200 rounded-lg p-6 flex flex-col items-center cursor-pointer transition-colors relative ${
                selectedWhatsAppTemplate
                  ? "bg-[#F0F9F9] border-custom-green-200"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setShowWhatsAppModal(true)}
            >
              {selectedWhatsAppTemplate && (
                <div className="absolute top-3 right-3 bg-custom-green-600 rounded-full p-1">
                  <CheckIcon className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="w-16 h-16 bg-custom-green-50 rounded-full flex items-center justify-center mb-4">
                <MessageCircleIcon className="h-8 w-8 text-custom-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Template WhatsApp
              </h3>
              {selectedWhatsAppTemplate ? (
                <p className="text-sm text-gray-500 text-center flex items-center">
                  <MessageCircleIcon className="h-3 w-3 mr-1" />
                  {selectedWhatsAppTemplate.name}
                </p>
              ) : (
                <p className="text-sm text-gray-500 text-center">
                  Elige un template pre-aprobado de WhatsApp.
                </p>
              )}
            </div>
          )}

          {/* Select SMS Template - Show when SMS is selected */}
          {deliveryMethods.sms && (
            <div
              className={`border border-gray-200 rounded-lg p-6 flex flex-col items-center cursor-pointer transition-colors relative ${
                selectedTemplate
                  ? "bg-[#F0F9F9] border-custom-green-200"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setShowSmsTemplateModal(true)}
            >
              {selectedTemplate && (
                <div className="absolute top-3 right-3 bg-custom-green-600 rounded-full p-1">
                  <CheckIcon className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="w-16 h-16 bg-custom-green-50 rounded-full flex items-center justify-center mb-4">
                <PhoneIcon className="h-8 w-8 text-custom-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Template SMS
              </h3>
              {selectedTemplate ? (
                <p className="text-sm text-gray-500 text-center flex items-center">
                  <PhoneIcon className="h-3 w-3 mr-1" />
                  {selectedTemplate.name}
                </p>
              ) : (
                <p className="text-sm text-gray-500 text-center">
                  Elige o crea el diseño de SMS (texto libre).
                </p>
              )}
            </div>
          )}
        </div>

        {/* Saved Segments */}
        <div className="mb-8">
          <h3 className="text-md font-medium text-gray-900 mb-3">
            Segmentos guardados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {savedSegments && savedSegments.length > 0 ? (
              savedSegments.map((segment) => (
                <div
                  key={segment.id}
                  onClick={() => handleSegmentSelection(segment)}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors flex justify-between items-center ${
                    selectedSegment?.id === segment.id
                      ? "border-custom-green-600 bg-custom-green-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-full mr-3">
                      <TargetIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {segment.segment_name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {segment.active_filters_count} filtro
                        {segment.active_filters_count !== 1 ? "s" : ""}
                        {segment.estimated_customers !== undefined && (
                          <span className="ml-2">
                            • {segment.estimated_customers} cliente
                            {segment.estimated_customers !== 1 ? "s" : ""}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {selectedSegment?.id === segment.id && (
                    <span className="text-xs bg-custom-green-100 text-custom-green-800 px-2 py-1 rounded-full">
                      Seleccionado
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <TargetIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  No hay segmentos creados
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Crea tu primer segmento para comenzar
                </p>
              </div>
            )}
          </div>
          {/* Saved Templates */}
          <h3 className="text-md font-medium text-gray-900 mb-3">
            Templates guardados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {savedTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateSelection(template)}
                className={`border rounded-lg p-4 cursor-pointer transition-colors flex justify-between items-center ${selectedTemplate?.id === template.id ? "border-custom-green-600 bg-custom-green-50" : "border-gray-200 hover:bg-gray-50"}`}
              >
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-full mr-3">
                    <LayoutIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {template.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {template.blocks.length} bloques
                    </p>
                  </div>
                </div>
                {selectedTemplate?.id === template.id && (
                  <span className="text-xs bg-custom-green-100 text-custom-green-800 px-2 py-1 rounded-full">
                    Seleccionado
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Name */}
        <div className="mb-8">
          <label
            htmlFor="campaign-name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Nombre de la campaña
          </label>
          <input
            type="text"
            id="campaign-name"
            placeholder="Ej. Promo regreso a clases – septiembre"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-green-500"
          />
        </div>
        {/* Footer */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleNext}
            disabled={!isNextButtonEnabled()}
            className={`px-4 py-2 rounded-lg text-white ${!isNextButtonEnabled() ? "bg-gray-300 cursor-not-allowed" : "bg-custom-green-600 hover:bg-custom-green-700"}`}
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* WhatsApp Template Modal */}
      <WhatsAppTemplateModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        onSelectTemplate={handleWhatsAppTemplateSelect}
        fillVariables={false}
        promoCode={promoCode}
        discountPercentage={discountPercentage}
      />

      {/* SMS Template Selection Modal */}
      <SmsTemplateSelectionModal
        isOpen={showSmsTemplateModal}
        onClose={() => setShowSmsTemplateModal(false)}
        templates={savedTemplates}
        selectedTemplate={selectedTemplate}
        onSelectTemplate={handleSmsTemplateSelection}
        onEditTemplate={handleSmsTemplateEdit}
        onDeleteTemplate={handleSmsTemplateDelete}
        onCreateNew={handleCreateNewSmsTemplate}
      />
    </div>
  );
};
export default NewCampaignModal;
