import React, { useState } from "react";
import { createPortal } from "react-dom";
import { XIcon, CheckIcon, StarIcon, TagIcon } from "lucide-react";
interface PredefinedTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: any) => void;
}
// Datos de ejemplo para templates prediseñados
const predefinedTemplates = [
  {
    id: "preset-1",
    name: "Bienvenida - Cliente Nuevo",
    description: "Template ideal para dar la bienvenida a nuevos clientes.",
    category: "Bienvenida",
    popularity: "Alta",
    isPreset: true,
    image:
      "https://images.unsplash.com/photo-1578922864601-79dca7a9ea35?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    blocks: [
      {
        id: "1",
        type: "title",
        content: "¡Bienvenido a Holy Cow!",
      },
      {
        id: "2",
        type: "image",
        content:
          "https://images.unsplash.com/photo-1578922864601-79dca7a9ea35?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
      },
      {
        id: "3",
        type: "text",
        content:
          "Estamos felices de tenerte como parte de nuestra comunidad. Como agradecimiento, te regalamos un postre en tu primera visita.",
      },
      {
        id: "4",
        type: "button",
        content: "Reclamar regalo",
      },
    ],
  },
  {
    id: "preset-2",
    name: "Cumpleaños - Regalo Especial",
    description:
      "Celebra el cumpleaños de tus clientes con una oferta especial.",
    category: "Cumpleaños",
    popularity: "Alta",
    isPreset: true,
    image:
      "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    blocks: [
      {
        id: "1",
        type: "title",
        content: "¡Feliz Cumpleaños!",
      },
      {
        id: "2",
        type: "image",
        content:
          "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
      },
      {
        id: "3",
        type: "text",
        content:
          "En tu día especial queremos celebrar contigo. Te regalamos un postre de cumpleaños completamente gratis.",
      },
      {
        id: "4",
        type: "button",
        content: "Reclamar regalo de cumpleaños",
      },
    ],
  },
  {
    id: "preset-3",
    name: "Descuento Especial - 20%",
    description: "Promociona un descuento especial por tiempo limitado.",
    category: "Promociones",
    popularity: "Media",
    isPreset: true,
    image:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    blocks: [
      {
        id: "1",
        type: "title",
        content: "¡20% DE DESCUENTO!",
      },
      {
        id: "2",
        type: "image",
        content:
          "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
      },
      {
        id: "3",
        type: "text",
        content:
          "Disfruta de un 20% de descuento en tu próxima compra. Oferta válida por tiempo limitado.",
      },
      {
        id: "4",
        type: "button",
        content: "Usar descuento ahora",
      },
    ],
  },
  {
    id: "preset-4",
    name: "Producto Nuevo - Lanzamiento",
    description: "Anuncia el lanzamiento de un nuevo producto.",
    category: "Lanzamientos",
    popularity: "Media",
    isPreset: true,
    image:
      "https://images.unsplash.com/photo-1561758033-d89a9ad46330?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    blocks: [
      {
        id: "1",
        type: "title",
        content: "¡NUEVO PRODUCTO!",
      },
      {
        id: "2",
        type: "image",
        content:
          "https://images.unsplash.com/photo-1561758033-d89a9ad46330?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
      },
      {
        id: "3",
        type: "text",
        content:
          "Presentamos nuestro nuevo producto. Sé uno de los primeros en probarlo con un 15% de descuento.",
      },
      {
        id: "4",
        type: "button",
        content: "Probar ahora",
      },
    ],
  },
  {
    id: "preset-5",
    name: "Cliente Inactivo - Regresa",
    description: "Recupera clientes inactivos con una oferta especial.",
    category: "Reactivación",
    popularity: "Alta",
    isPreset: true,
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    blocks: [
      {
        id: "1",
        type: "title",
        content: "¡Te extrañamos!",
      },
      {
        id: "2",
        type: "image",
        content:
          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
      },
      {
        id: "3",
        type: "text",
        content:
          "Hace tiempo que no te vemos. Regresa y disfruta de un 25% de descuento en tu próxima visita.",
      },
      {
        id: "4",
        type: "button",
        content: "Volver a visitar",
      },
    ],
  },
  {
    id: "preset-6",
    name: "Evento Especial - Invitación",
    description: "Invita a tus clientes a un evento exclusivo.",
    category: "Eventos",
    popularity: "Baja",
    isPreset: true,
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
    blocks: [
      {
        id: "1",
        type: "title",
        content: "Invitación Exclusiva",
      },
      {
        id: "2",
        type: "image",
        content:
          "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60",
      },
      {
        id: "3",
        type: "text",
        content:
          "Estás invitado a nuestro evento exclusivo. Disfruta de degustaciones, música en vivo y sorpresas.",
      },
      {
        id: "4",
        type: "button",
        content: "Confirmar asistencia",
      },
    ],
  },
];
const PredefinedTemplatesModal: React.FC<PredefinedTemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  if (!isOpen) return null;
  const filteredTemplates = selectedCategory
    ? predefinedTemplates.filter(
        (template) => template.category === selectedCategory,
      )
    : predefinedTemplates;
  const categories = Array.from(
    new Set(predefinedTemplates.map((template) => template.category)),
  );
  const modalContent = (
    <div className="fixed inset-0 overflow-y-auto z-[10000] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px] z-[9998]"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-2xl max-w-5xl w-full mx-2 sm:mx-4 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col z-[10000]">
        {/* Header */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-200">
          <div className="flex items-center min-w-0">
            <TagIcon className="h-5 w-5 text-custom-green-600 mr-2 flex-shrink-0" />
            <h2 className="text-base sm:text-xl font-semibold text-gray-900 truncate">
              Templates prediseñados
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100 flex-shrink-0"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        {/* Category Filter */}
        <div className="p-3 sm:p-4 border-b border-gray-200 bg-white flex-shrink-0 overflow-x-auto scrollbar-hide">
          <div className="flex flex-nowrap sm:flex-wrap gap-2 min-h-[32px]">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${selectedCategory === null ? "bg-custom-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${selectedCategory === category ? "bg-custom-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-32 sm:h-40 overflow-hidden bg-gray-100">
                  <img
                    src={template.image}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-custom-green-100 text-custom-green-800">
                      <TagIcon className="h-3 w-3 mr-1 hidden sm:block" />
                      Prediseñado
                    </span>
                  </div>
                  {template.popularity === "Alta" && (
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <StarIcon className="h-3 w-3 mr-1 hidden sm:block" />
                        Popular
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">
                    {template.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 hidden sm:block">
                      {template.category}
                    </span>
                    <button
                      onClick={() => onSelectTemplate(template)}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-custom-green-600 hover:bg-custom-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500"
                    >
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Usar este
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );

  // Usar portal para renderizar fuera del stacking context del Layout
  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
export default PredefinedTemplatesModal;
