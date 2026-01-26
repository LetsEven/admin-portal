import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  XIcon,
  TypeIcon,
  AlignLeftIcon,
  ImageIcon,
  SeparatorHorizontalIcon,
  MousePointerIcon,
  GripIcon,
  TrashIcon,
  LayoutIcon,
  AlertCircleIcon,
  UploadIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import PredefinedTemplatesModal from "./PredefinedTemplatesModal";
import { ImageUploadService } from "../services/imageUploadService";
interface TemplateDesignerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: any) => Promise<void>;
  initialTemplate?: any;
  promoCode?: string;
  discountPercentage?: string;
}
const TemplateDesignerModal: React.FC<TemplateDesignerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTemplate = null,
  promoCode = "",
  discountPercentage = "",
}) => {
  // Helper function to create initial blocks with promo data
  const getInitialBlocks = () => {
    let baseBlocks = [];

    if (initialTemplate?.blocks) {
      // Filter out old promo/discount blocks if they exist
      baseBlocks = initialTemplate.blocks.filter(
        (b: any) => b.type !== "promo_code" && b.type !== "discount",
      );
    } else {
      // Default blocks
      baseBlocks = [
        {
          id: "1",
          type: "title",
          content: "Título de la campaña",
        },
        {
          id: "2",
          type: "text",
          content:
            "Descripción de la campaña que explica los beneficios para tus clientes.",
        },
      ];
    }

    // Only add promo code and discount blocks if they have values
    if (promoCode && promoCode.trim() !== "") {
      baseBlocks.push({
        id: "promo-code-block",
        type: "promo_code",
        content: promoCode,
        locked: true,
      });
    }

    if (discountPercentage && discountPercentage.trim() !== "") {
      baseBlocks.push({
        id: "discount-block",
        type: "discount",
        content: discountPercentage,
        locked: true,
      });
    }

    return baseBlocks;
  };

  const [templateName, setTemplateName] = useState(
    initialTemplate?.name || "Nuevo Template",
  );
  const [blocks, setBlocks] = useState(getInitialBlocks());
  const [showPredefinedTemplates, setShowPredefinedTemplates] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [showBlocksPanel, setShowBlocksPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to get next sequential ID
  const getNextId = () => {
    const currentMax = Math.max(
      ...blocks.map((b: any) => parseInt(b.id) || 0),
      0,
    );
    return (currentMax + 1).toString();
  };

  // Reset form when initialTemplate, promoCode, or discountPercentage changes
  useEffect(() => {
    if (initialTemplate) {
      setTemplateName(initialTemplate.name);
    }
    // Always regenerate blocks to include updated promo data
    setBlocks(getInitialBlocks());
  }, [initialTemplate, promoCode, discountPercentage]);
  if (!isOpen) return null;
  const handleAddBlock = (type: string) => {
    const newBlock = {
      id: getNextId(),
      type,
      content: getDefaultContent(type),
    };
    setBlocks([...blocks, newBlock]);
  };
  const getDefaultContent = (type: string) => {
    switch (type) {
      case "title":
        return "Nuevo título";
      case "text":
        return "Nuevo texto";
      case "image":
        return "https://via.placeholder.com/600x300";
      case "button":
        return "Botón de acción";
      case "separator":
        return "";
      default:
        return "";
    }
  };
  const handleRemoveBlock = (id: string) => {
    // Don't allow removing locked blocks
    const block = blocks.find((b: any) => b.id === id);
    if (block?.locked) {
      return;
    }
    setBlocks(blocks.filter((block: any) => block.id !== id));
  };

  const handleBlockContentChange = (id: string, newContent: string) => {
    setBlocks(
      blocks.map((block: any) =>
        block.id === id ? { ...block, content: newContent } : block,
      ),
    );
  };

  const handleImageUpload = async (blockId: string, file: File) => {
    try {
      setUploadingImage(blockId);

      // Resize image before upload
      const resizedFile = await ImageUploadService.resizeImage(
        file,
        800,
        600,
        0.85,
      );

      // Upload to server
      const imageUrl = await ImageUploadService.uploadImage(
        resizedFile,
        "banner",
      );

      // Update block content with uploaded image URL
      handleBlockContentChange(blockId, imageUrl);

      setUploadingImage(null);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error al subir la imagen. Por favor intenta de nuevo.");
      setUploadingImage(null);
    }
  };

  const triggerImageUpload = (blockId: string) => {
    setEditingBlockId(blockId);
    fileInputRef.current?.click();
  };
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert("Por favor ingresa un nombre para el template");
      return;
    }

    if (blocks.length === 0) {
      alert("El template debe tener al menos un bloque");
      return;
    }

    try {
      // Filter out promo_code and discount blocks before saving
      // These are campaign-specific and shouldn't be saved with the template
      const blocksToSave = blocks.filter(
        (block: any) =>
          block.type !== "promo_code" && block.type !== "discount",
      );

      const template = {
        id: initialTemplate?.id, // Preserve ID for updates
        name: templateName,
        blocks: blocksToSave,
      };

      await onSave(template);
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Error al guardar el template. Por favor intenta de nuevo.");
    }
  };
  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setBlocks(items);
  };
  const handleSelectPredefinedTemplate = (template: any) => {
    setTemplateName(template.name);
    setBlocks(template.blocks);
    setShowPredefinedTemplates(false);
  };
  const handleResetTemplate = () => {
    setShowConfirmReset(true);
  };
  const confirmResetTemplate = () => {
    setBlocks([
      {
        id: Date.now().toString(),
        type: "text",
        content:
          "Empieza a construir tu campaña usando los bloques de contenido a la derecha",
      },
    ]);
    setShowConfirmReset(false);
  };
  const renderBlockContent = (block: any) => {
    const isUploading = uploadingImage === block.id;

    switch (block.type) {
      case "title":
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => handleBlockContentChange(block.id, e.target.value)}
            className="w-full text-2xl font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-custom-green-500 rounded px-2 py-1"
            placeholder="Título"
          />
        );
      case "text":
        return (
          <textarea
            value={block.content}
            onChange={(e) => handleBlockContentChange(block.id, e.target.value)}
            className="w-full text-base text-gray-700 bg-transparent border-none outline-none focus:ring-2 focus:ring-custom-green-500 rounded px-2 py-1 resize-none"
            placeholder="Texto"
            rows={3}
          />
        );
      case "image":
        return (
          <div className="relative">
            {block.content &&
            block.content !== "https://via.placeholder.com/600x300" ? (
              <img
                src={block.content}
                alt="Content"
                className="w-full h-auto rounded-lg"
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
            <button
              onClick={() => triggerImageUpload(block.id)}
              disabled={isUploading}
              className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-custom-green-600 border-t-transparent rounded-full"></div>
                  Subiendo...
                </>
              ) : (
                <>
                  <UploadIcon className="h-4 w-4" />
                  Subir imagen
                </>
              )}
            </button>
          </div>
        );
      case "button":
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => handleBlockContentChange(block.id, e.target.value)}
            className="bg-custom-green-600 text-white px-6 py-2 rounded-lg font-medium text-center outline-none focus:ring-2 focus:ring-custom-green-700"
            placeholder="Texto del botón"
          />
        );
      case "separator":
        return <hr className="border-t border-gray-200 my-4" />;
      case "promo_code":
        return (
          <div className="text-base text-gray-700">
            Código de promoción:{" "}
            <span className="font-semibold">{block.content}</span>
          </div>
        );
      case "discount":
        return (
          <div className="text-base text-gray-700">
            {block.content}% de descuento
          </div>
        );
      default:
        return null;
    }
  };
  const modalContent = (
    <div className="fixed inset-0 overflow-y-auto z-[9999] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px] z-[9998]"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-2xl max-w-5xl w-full mx-2 sm:mx-4 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col z-[9999]">
        {/* Header */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-200">
          <div className="flex items-center min-w-0">
            <LayoutIcon className="h-5 w-5 text-custom-green-600 mr-2 flex-shrink-0" />
            <h2 className="text-base sm:text-xl font-semibold text-gray-900 truncate">
              {initialTemplate ? "Editar template" : "Diseñar template"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100 flex-shrink-0"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        {/* Template Name */}
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <label
            htmlFor="template-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nombre del template
          </label>
          <input
            type="text"
            id="template-name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full px-3 py-2 border border-custom-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-green-500 text-sm sm:text-base"
          />
        </div>
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Template Preview */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:border-r border-gray-200 order-2 md:order-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 max-w-md mx-auto">
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="blocks">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-4"
                    >
                      {blocks.map((block, index) => (
                        <Draggable
                          key={block.id}
                          draggableId={block.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-3 rounded-lg relative group ${snapshot.isDragging ? "bg-gray-50 shadow-md" : ""}`}
                            >
                              <div className="flex items-center justify-between mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab text-gray-400 hover:text-gray-600"
                                >
                                  <GripIcon className="h-4 w-4" />
                                </div>
                                {!block.locked && (
                                  <button
                                    onClick={() => handleRemoveBlock(block.id)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                              {renderBlockContent(block)}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
          {/* Block Options - Collapsible on mobile */}
          <div className="w-full md:w-64 bg-gray-50 order-1 md:order-2 border-b md:border-b-0">
            {/* Mobile toggle header */}
            <button
              onClick={() => setShowBlocksPanel(!showBlocksPanel)}
              className="w-full p-3 flex items-center justify-between md:hidden bg-gray-100"
            >
              <span className="text-sm font-medium text-gray-700">
                Bloques de contenido
              </span>
              {showBlocksPanel ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {/* Panel content - Always visible on desktop, toggleable on mobile */}
            <div
              className={`p-3 sm:p-4 overflow-y-auto max-h-[40vh] md:max-h-none ${showBlocksPanel ? "block" : "hidden"} md:block`}
            >
              <h3 className="text-sm font-medium text-gray-700 mb-3 hidden md:block">
                Bloques de contenido
              </h3>

              {/* Blocks grid - horizontal on mobile, vertical on desktop */}
              <div className="grid grid-cols-5 md:grid-cols-1 gap-2">
                <div
                  onClick={() => {
                    handleAddBlock("title");
                    setShowBlocksPanel(false);
                  }}
                  className="p-2 sm:p-3 bg-white rounded-lg border border-gray-200 flex flex-col md:flex-row items-center cursor-pointer hover:bg-gray-50"
                >
                  <TypeIcon className="h-4 w-4 text-gray-600 md:mr-2" />
                  <span className="text-xs md:text-sm mt-1 md:mt-0">
                    Título
                  </span>
                </div>
                <div
                  onClick={() => {
                    handleAddBlock("text");
                    setShowBlocksPanel(false);
                  }}
                  className="p-2 sm:p-3 bg-white rounded-lg border border-gray-200 flex flex-col md:flex-row items-center cursor-pointer hover:bg-gray-50"
                >
                  <AlignLeftIcon className="h-4 w-4 text-gray-600 md:mr-2" />
                  <span className="text-xs md:text-sm mt-1 md:mt-0">Texto</span>
                </div>
                <div
                  onClick={() => {
                    handleAddBlock("image");
                    setShowBlocksPanel(false);
                  }}
                  className="p-2 sm:p-3 bg-white rounded-lg border border-gray-200 flex flex-col md:flex-row items-center cursor-pointer hover:bg-gray-50"
                >
                  <ImageIcon className="h-4 w-4 text-gray-600 md:mr-2" />
                  <span className="text-xs md:text-sm mt-1 md:mt-0">
                    Imagen
                  </span>
                </div>
                <div
                  onClick={() => {
                    handleAddBlock("separator");
                    setShowBlocksPanel(false);
                  }}
                  className="p-2 sm:p-3 bg-white rounded-lg border border-gray-200 flex flex-col md:flex-row items-center cursor-pointer hover:bg-gray-50"
                >
                  <SeparatorHorizontalIcon className="h-4 w-4 text-gray-600 md:mr-2" />
                  <span className="text-xs md:text-sm mt-1 md:mt-0 hidden sm:block">
                    Separador
                  </span>
                  <span className="text-xs mt-1 sm:hidden">Sep.</span>
                </div>
                <div
                  onClick={() => {
                    handleAddBlock("button");
                    setShowBlocksPanel(false);
                  }}
                  className="p-2 sm:p-3 bg-white rounded-lg border border-gray-200 flex flex-col md:flex-row items-center cursor-pointer hover:bg-gray-50"
                >
                  <MousePointerIcon className="h-4 w-4 text-gray-600 md:mr-2" />
                  <span className="text-xs md:text-sm mt-1 md:mt-0">Botón</span>
                </div>
              </div>

              {/* Special action buttons - Hidden on mobile collapsed state */}
              <div className="mt-4 md:mt-8 border-t border-gray-200 pt-4 md:pt-6 space-y-3 md:space-y-4">
                <button
                  onClick={handleResetTemplate}
                  className="w-full p-2 sm:p-3 bg-white text-gray-800 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-custom-green-50 hover:border-custom-green-200 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-medium">
                    Crear desde cero
                  </span>
                </button>
                <button
                  onClick={() => setShowPredefinedTemplates(true)}
                  className="w-full p-2 sm:p-3 bg-white text-gray-800 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-custom-green-50 hover:border-custom-green-200 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-medium">
                    Ver templates prediseñados
                  </span>
                </button>
                <p className="text-xs text-gray-500 text-center hidden md:block">
                  Explora templates listos para usar como base para tu campaña
                </p>
              </div>

              {/* Instructions - Hidden on mobile */}
              <div className="mt-8 hidden md:block">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Instrucciones
                </h3>
                <ul className="text-xs text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span>Haz clic en un bloque para editarlo</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span>Arrastra y suelta para reordenar</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span>Usa el ícono de papelera para eliminar</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveTemplate}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-custom-green-600 text-white rounded-lg hover:bg-custom-green-700 text-sm sm:text-base"
          >
            {initialTemplate ? "Actualizar" : "Guardar"}
          </button>
        </div>
      </div>
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && editingBlockId) {
            handleImageUpload(editingBlockId, file);
          }
          // Reset input
          e.target.value = "";
        }}
      />

      {/* Predefined Templates Modal */}
      <PredefinedTemplatesModal
        isOpen={showPredefinedTemplates}
        onClose={() => setShowPredefinedTemplates(false)}
        onSelectTemplate={handleSelectPredefinedTemplate}
      />
      {/* Confirmation Modal for Reset */}
      {showConfirmReset && (
        <div className="fixed inset-0 overflow-y-auto z-[10000] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-[1px]"
            onClick={() => setShowConfirmReset(false)}
          ></div>
          <div className="relative bg-white rounded-lg max-w-md w-full mx-2 p-4 sm:p-6 shadow-xl">
            <div className="flex items-center mb-4 text-amber-600">
              <AlertCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 flex-shrink-0" />
              <h3 className="text-base sm:text-lg font-medium">
                Confirmar reinicio
              </h3>
            </div>
            <p className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-600">
              ¿Estás seguro de que quieres comenzar desde cero? Se eliminarán
              todos los bloques actuales.
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmResetTemplate}
                className="w-full sm:w-auto px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
              >
                Sí, reiniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Usar portal para renderizar fuera del stacking context del Layout
  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
export default TemplateDesignerModal;
