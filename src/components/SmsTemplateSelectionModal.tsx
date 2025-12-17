import React, { useState } from 'react';
import { XIcon, CheckCircleIcon, PencilIcon, TrashIcon } from 'lucide-react';

interface SmsTemplate {
  id: string;
  name: string;
  blocks: Array<{
    id: string;
    type: 'title' | 'text' | 'image' | 'button' | 'separator';
    content: string;
  }>;
}

interface SmsTemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: SmsTemplate[];
  selectedTemplate: SmsTemplate | null;
  onSelectTemplate: (template: SmsTemplate) => void;
  onEditTemplate: (template: SmsTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onCreateNew: () => void;
}

const SmsTemplateSelectionModal: React.FC<SmsTemplateSelectionModalProps> = ({
  isOpen,
  onClose,
  templates,
  selectedTemplate,
  onSelectTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onCreateNew,
}) => {
  const [hoveredTemplateId, setHoveredTemplateId] = useState<string | null>(null);

  if (!isOpen) return null;

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'title':
        return '📋';
      case 'text':
        return '📝';
      case 'image':
        return '🖼️';
      case 'button':
        return '🔘';
      case 'separator':
        return '➖';
      default:
        return '📄';
    }
  };

  return (
    <div className="fixed inset-0 overflow-y-auto z-[60] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-2xl max-w-3xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Seleccionar template SMS
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {templates.length} {templates.length === 1 ? 'template guardado' : 'templates guardados'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create New Button */}
          <button
            onClick={() => {
              onCreateNew();
              onClose();
            }}
            className="w-full mb-4 p-4 border-2 border-dashed border-custom-green-300 rounded-lg text-custom-green-600 hover:border-custom-green-400 hover:bg-custom-green-50 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-2xl">+</span>
            <span className="font-medium">Diseñar nuevo template</span>
          </button>

          {/* Templates List */}
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📱</div>
              <p className="text-gray-500 text-lg">No hay templates guardados</p>
              <p className="text-gray-400 text-sm mt-2">
                Crea tu primer template para comenzar
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`relative p-4 border-2 rounded-lg transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-custom-green-500 bg-custom-green-50'
                      : 'border-gray-200 hover:border-custom-green-300'
                  }`}
                  onMouseEnter={() => setHoveredTemplateId(template.id)}
                  onMouseLeave={() => setHoveredTemplateId(null)}
                >
                  {/* Selection Area */}
                  <div
                    onClick={() => onSelectTemplate(template)}
                    className="cursor-pointer mb-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 truncate pr-2">
                        {template.name}
                      </h4>
                      {selectedTemplate?.id === template.id && (
                        <CheckCircleIcon className="h-5 w-5 text-custom-green-600 flex-shrink-0" />
                      )}
                    </div>

                    {/* Template Preview */}
                    <div className="text-sm text-gray-600 space-y-1">
                      {template.blocks?.slice(0, 3).map((block, idx) => (
                        <div key={idx} className="truncate flex items-start gap-2">
                          <span className="flex-shrink-0">{getBlockIcon(block.type)}</span>
                          <span className="truncate">{block.content || `${block.type}`}</span>
                        </div>
                      ))}
                      {template.blocks?.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{template.blocks.length - 3} bloques más
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTemplate(template);
                        onClose();
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                      Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('¿Estás seguro de eliminar este template?')) {
                          onDeleteTemplate(template.id);
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between items-center bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
          >
            Cancelar
          </button>
          {selectedTemplate && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-custom-green-600 text-white rounded-lg hover:bg-custom-green-700 transition-colors"
            >
              Confirmar selección
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmsTemplateSelectionModal;
