import React, { useState, useRef } from "react";
import {
  XIcon,
  MessageCircleIcon,
  ImageIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  UploadIcon,
} from "lucide-react";

interface WhatsAppTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: WhatsAppTemplate) => void;
  fillVariables?: boolean;
  promoCode?: string;
  discountPercentage?: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: "marketing" | "utility";
  language: string;
  status: "approved" | "pending" | "rejected";
  header?: {
    type: "text" | "image";
    text?: string;
    variables?: string[];
  };
  body: {
    text: string;
    variables: string[];
  };
  footer?: string;
  buttons?: Array<{
    type: "url" | "phone" | "quick_reply";
    text: string;
    url?: string;
    phone?: string;
  }>;
  estimatedCost: string;
  description: string;
}

// Templates pre-aprobados para WhatsApp Business API
const PRE_APPROVED_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "promo_general",
    name: "Promoción General",
    category: "marketing",
    language: "es_MX",
    status: "approved",
    header: {
      type: "image",
      variables: ["image_url"],
    },
    body: {
      text: "Hola, ¡tenemos una oferta especial para ti! 🎉\n\nDisfruta de {{1}}% de descuento en {{2}}.\n\nUsa el código: *{{3}}*",
      variables: ["discount", "product_name", "codigo"],
    },
    buttons: [
      { type: "url", text: "Ver menú", url: "https://xquisito.ai/menu" },
    ],
    estimatedCost: "~$0.005 USD",
    description: "Template versátil para promociones generales con descuento",
  },
  {
    id: "recuperacion_clientes",
    name: "Recuperación de Clientes",
    category: "marketing",
    language: "es_MX",
    status: "approved",
    header: {
      type: "text",
      text: "¡Te extrañamos! 💙",
      variables: [],
    },
    body: {
      text: "Hola,\n\nHace {{1}} que no te vemos y queremos que regreses.\n\nTe regalamos *{{2}}% de descuento* en tu próxima visita.\n\nCódigo: *{{3}}*",
      variables: ["days_inactive", "discount", "codigo"],
    },
    estimatedCost: "~$0.005 USD",
    description: "Reactivar clientes inactivos con incentivo",
  },
  {
    id: "ultima_llamada",
    name: "Última Llamada / Urgencia",
    category: "marketing",
    language: "es_MX",
    status: "approved",
    header: {
      type: "text",
      text: "⏰ ¡ÚLTIMA OPORTUNIDAD!",
      variables: [],
    },
    body: {
      text: "Hola, tu oferta de *{{1}}* está por expirar.\n\nCódigo: *{{4}}*\n\n¡No te quedes sin tu beneficio!",
      variables: ["offer_name", "discount", "codigo"],
    },
    buttons: [
      { type: "url", text: "Canjear ahora", url: "https://xquisito.ai/redeem" },
    ],
    estimatedCost: "~$0.005 USD",
    description: "Crear urgencia para ofertas próximas a expirar",
  },
  {
    id: "cumpleanos",
    name: "Cumpleaños",
    category: "marketing",
    language: "es_MX",
    status: "approved",
    header: {
      type: "image",
      variables: ["birthday_image"],
    },
    body: {
      text: "🎂 ¡FELIZ CUMPLEAÑOS! 🎉\n\nQueremos celebrar contigo este día especial.\n\nTe regalamos {{1}}% de descuento.\n\nCódigo: *{{2}}*",
      variables: ["discount", "codigo"],
    },
    estimatedCost: "~$0.005 USD",
    description: "Felicitación de cumpleaños con regalo especial",
  },
  {
    id: "recomendacion_personalizada",
    name: "Recomendación Personalizada",
    category: "marketing",
    language: "es_MX",
    status: "approved",
    header: {
      type: "image",
      variables: ["recommended_dish_image"],
    },
    body: {
      text: "Hola, basado en tus gustos, creemos que te encantará:\n\n🍽️ *{{1}}*\n\n💫 Especial para ti: {{2}}% OFF\n\nCódigo: *{{3}}*",
      variables: ["dish_name", "discount", "codigo"],
    },
    buttons: [
      { type: "url", text: "Ordenar ahora", url: "https://xquisito.ai/order" },
    ],
    estimatedCost: "~$0.005 USD",
    description: "Recomendación basada en historial del cliente",
  },
];

const WhatsAppTemplateModal: React.FC<WhatsAppTemplateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  fillVariables = false,
  promoCode = "",
  discountPercentage = "",
}) => {
  const [selectedTemplate, setSelectedTemplate] =
    useState<WhatsAppTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [imageUrl, setImageUrl] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [headerImageUrl, setHeaderImageUrl] = useState("");
  const [uploadingHeaderImage, setUploadingHeaderImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleTemplateSelect = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);

    // Auto-fill discount and codigo variables if they exist in the template
    const initialVariables: Record<string, string> = {};
    template.body.variables.forEach((varName) => {
      if (varName === "discount" && discountPercentage) {
        initialVariables[varName] = discountPercentage;
      }
      if (varName === "codigo" && promoCode) {
        initialVariables[varName] = promoCode;
      }
    });

    setVariables(initialVariables);
    setImageUrl("");
    setHeaderImageUrl("");
    setShowPreview(false);
  };

  const handleVariableChange = (varName: string, value: string) => {
    setVariables((prev) => ({
      ...prev,
      [varName]: value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file is an image
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido");
      return;
    }

    setUploadingHeaderImage(true);

    try {
      // Create a local URL for preview
      const localUrl = URL.createObjectURL(file);
      setHeaderImageUrl(localUrl);

      // Here you would upload to your server
      // For now, we'll just use the local URL
      // const uploadedUrl = await uploadImageToServer(file);
      // setHeaderImageUrl(uploadedUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error al subir la imagen. Por favor intenta de nuevo.");
    } finally {
      setUploadingHeaderImage(false);
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
    }
  };

  // Check if all variables are filled
  const areAllVariablesFilled = () => {
    if (!selectedTemplate) return false;

    // Check if header image is required and uploaded
    if (selectedTemplate.header?.type === "image" && !headerImageUrl) {
      return false;
    }

    // Check all body variables are filled
    for (const varName of selectedTemplate.body.variables) {
      if (!variables[varName] || variables[varName].trim() === "") {
        return false;
      }
    }

    return true;
  };

  const renderPreview = () => {
    if (!selectedTemplate || !showPreview) return null;

    let bodyText = selectedTemplate.body.text;
    selectedTemplate.body.variables.forEach((varName, index) => {
      const placeholder = `{{${index + 1}}}`;
      const value = variables[varName] || `[${varName}]`;
      bodyText = bodyText.replace(placeholder, value);
    });

    let headerText = "";
    if (
      selectedTemplate.header?.type === "text" &&
      selectedTemplate.header.text
    ) {
      headerText = selectedTemplate.header.text;
      selectedTemplate.header.variables?.forEach((varName, index) => {
        const placeholder = `{{${index + 1}}}`;
        const value = variables[varName] || `[${varName}]`;
        headerText = headerText.replace(placeholder, value);
      });
    }

    return (
      <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-lg">
        <div className="bg-custom-green-600 text-white px-4 py-2 flex items-center">
          <MessageCircleIcon className="h-5 w-5 mr-2" />
          <span className="font-medium">Vista previa - WhatsApp</span>
        </div>

        <div className="p-4 max-w-sm mx-auto">
          {/* WhatsApp Message Bubble */}
          <div className="bg-[#DCF8C6] rounded-lg p-3 shadow">
            {/* Header */}
            {selectedTemplate.header?.type === "image" && imageUrl && (
              <div className="mb-2 -mx-3 -mt-3">
                <img
                  src={imageUrl}
                  alt="Template header"
                  className="w-full h-40 object-cover rounded-t-lg"
                />
              </div>
            )}
            {selectedTemplate.header?.type === "text" && headerText && (
              <div className="font-bold text-gray-900 mb-2">{headerText}</div>
            )}

            {/* Body */}
            <div className="text-gray-900 whitespace-pre-wrap text-sm">
              {bodyText}
            </div>

            {/* Footer */}
            {selectedTemplate.footer && (
              <div className="text-gray-500 text-xs mt-2 italic">
                {selectedTemplate.footer}
              </div>
            )}

            {/* Buttons */}
            {selectedTemplate.buttons &&
              selectedTemplate.buttons.length > 0 && (
                <div className="mt-3 -mx-3 -mb-3 border-t border-gray-300">
                  {selectedTemplate.buttons.map((button, index) => (
                    <div
                      key={index}
                      className="py-2 text-center text-[#0088cc] font-medium text-sm border-b border-gray-300 last:border-b-0 cursor-pointer hover:bg-gray-50"
                    >
                      {button.type === "url" && "🔗 "}
                      {button.type === "phone" && "📞 "}
                      {button.text}
                    </div>
                  ))}
                </div>
              )}

            {/* WhatsApp timestamp */}
            <div className="text-right text-xs text-gray-500 mt-1">
              {new Date().toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-2xl max-w-3xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center">
            <MessageCircleIcon className="h-6 w-6 text-custom-green-600 mr-3" />
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Templates de WhatsApp
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Selecciona un template pre-aprobado y personaliza las variables
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-2 rounded-full hover:bg-gray-100"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Templates List */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto p-6">
            <div className="space-y-3">
              {PRE_APPROVED_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? "border-custom-green-600 bg-custom-green-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <h4 className="font-medium text-gray-900">
                        {template.name}
                      </h4>
                      {template.status === "approved" && (
                        <CheckCircleIcon className="h-4 w-4 text-green-600 ml-2" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {template.description}
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    {template.header?.type === "image" && (
                      <span className="flex items-center mr-3">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        Con imagen
                      </span>
                    )}
                    <span>{template.body.variables.length} variables</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Template Preview */}
          <div className="w-1/2 overflow-y-auto p-6 flex flex-col">
            {selectedTemplate ? (
              <>
                {/* Preview */}
                <div className="flex-shrink-0">
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="bg-custom-green-600 text-white px-4 py-2 flex items-center">
                      <MessageCircleIcon className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">Vista previa</span>
                    </div>
                    <div className="p-4">
                      <div className="bg-[#DCF8C6] rounded-lg p-3 shadow">
                        {selectedTemplate.header?.type === "image" && (
                          <div className="mb-2 -mx-3 -mt-3 rounded-t-lg overflow-hidden">
                            {headerImageUrl ? (
                              <img
                                src={headerImageUrl}
                                alt="Header"
                                className="w-full h-32 object-cover"
                              />
                            ) : (
                              <div className="bg-gray-200 h-32 flex items-center justify-center">
                                <span className="text-gray-500 text-sm">
                                  Sube una imagen
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        {selectedTemplate.header?.type === "text" &&
                          selectedTemplate.header.text && (
                            <div className="font-bold text-gray-900 mb-2 text-sm">
                              {(() => {
                                let headerText =
                                  selectedTemplate.header.text || "";
                                selectedTemplate.header.variables?.forEach(
                                  (varName, index) => {
                                    const placeholder = `{{${index + 1}}}`;
                                    const value =
                                      variables[varName] || `[${varName}]`;
                                    headerText = headerText.replace(
                                      placeholder,
                                      value
                                    );
                                  }
                                );
                                return headerText;
                              })()}
                            </div>
                          )}
                        <div className="text-gray-900 whitespace-pre-wrap text-xs">
                          {(() => {
                            let bodyText = selectedTemplate.body.text;
                            selectedTemplate.body.variables.forEach(
                              (varName, index) => {
                                const placeholder = `{{${index + 1}}}`;
                                const value =
                                  variables[varName] || `[${varName}]`;
                                bodyText = bodyText.replace(placeholder, value);
                              }
                            );
                            return bodyText;
                          })()}
                        </div>
                        {selectedTemplate.footer && (
                          <div className="text-gray-500 text-xs mt-2 italic">
                            {selectedTemplate.footer}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Variable Inputs Section */}
                <div className="mt-6 flex-1 overflow-y-auto">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Variables del template
                  </h3>

                  <div className="space-y-3">
                    {/* Header Image Upload if needed */}
                    {selectedTemplate.header?.type === "image" && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Imagen del encabezado
                        </label>
                        <div className="relative">
                          {headerImageUrl ? (
                            <div className="border border-gray-300 rounded-lg p-2 flex items-center justify-between">
                              <div className="flex items-center">
                                <img
                                  src={headerImageUrl}
                                  alt="Preview"
                                  className="w-12 h-12 object-cover rounded"
                                />
                                <span className="ml-2 text-xs text-gray-600">
                                  Imagen cargada
                                </span>
                              </div>
                              <button
                                onClick={triggerImageUpload}
                                className="text-xs text-custom-green-600 hover:text-custom-green-700 font-medium"
                              >
                                Cambiar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={triggerImageUpload}
                              disabled={uploadingHeaderImage}
                              className="w-full px-3 py-2 text-sm border-2 border-dashed border-gray-300 rounded-lg hover:border-custom-green-500 hover:bg-custom-green-50 transition-colors flex items-center justify-center"
                            >
                              {uploadingHeaderImage ? (
                                <>
                                  <div className="animate-spin h-4 w-4 border-2 border-custom-green-600 border-t-transparent rounded-full mr-2"></div>
                                  Subiendo...
                                </>
                              ) : (
                                <>
                                  <UploadIcon className="h-4 w-4 mr-2" />
                                  Subir imagen
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Text Variables */}
                    {selectedTemplate.body.variables.map((varName) => {
                      const isDiscountField = varName === "discount";
                      const isCodigoField = varName === "codigo";
                      const isDisabled =
                        (isDiscountField && discountPercentage) ||
                        (isCodigoField && promoCode);

                      return (
                        <div key={varName}>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {varName
                              .split("_")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")}
                            {isDisabled && (
                              <span className="ml-2 text-xs text-gray-500 italic">
                                (configurado previamente)
                              </span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={variables[varName] || ""}
                            onChange={(e) =>
                              handleVariableChange(varName, e.target.value)
                            }
                            disabled={isDisabled}
                            placeholder={`Ingresa ${varName}`}
                            className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-green-500 ${
                              isDisabled
                                ? "bg-gray-100 cursor-not-allowed text-gray-600"
                                : ""
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Warning Box */}
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircleIcon className="h-4 w-4 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        Todos los campos son obligatorios para poder seleccionar
                        este template.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={!areAllVariablesFilled()}
                    className={`px-4 py-2 rounded-lg text-white ${
                      !areAllVariablesFilled()
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-custom-green-600 hover:bg-custom-green-700"
                    }`}
                  >
                    Seleccionar este template
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageCircleIcon className="h-16 w-16 mb-4" />
                <p>
                  Selecciona un template de la izquierda para ver la vista
                  previa
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
};

export default WhatsAppTemplateModal;
export { PRE_APPROVED_TEMPLATES };
