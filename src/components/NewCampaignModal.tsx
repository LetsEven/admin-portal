import React, { useState } from 'react';
import { XIcon, TargetIcon, LayoutIcon, CheckIcon } from 'lucide-react';
interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSegment: () => void;
  onDesignTemplate: () => void;
  onNext: (campaignName: string, selectedSegment?: any, selectedTemplate?: any) => void;
  savedSegments: any[];
  savedTemplates: any[];
}
const NewCampaignModal: React.FC<NewCampaignModalProps> = ({
  isOpen,
  onClose,
  onCreateSegment,
  onDesignTemplate,
  onNext,
  savedSegments,
  savedTemplates
}) => {
  const [campaignName, setCampaignName] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  if (!isOpen) return null;
  const handleNext = () => {
    if (campaignName.trim()) {
      onNext(campaignName, selectedSegment, selectedTemplate);
    }
  };
  const handleSegmentSelection = (segment: any) => {
    if (selectedSegment && selectedSegment.id === segment.id) {
      setSelectedSegment(null);
    } else {
      setSelectedSegment(segment);
    }
  };
  const handleTemplateSelection = (template: any) => {
    if (selectedTemplate && selectedTemplate.id === template.id) {
      setSelectedTemplate(null);
    } else {
      setSelectedTemplate(template);
    }
  };
  return <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl max-w-3xl w-full mx-auto p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Crear nueva campaña
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 p-2 rounded-full hover:bg-gray-100">
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          Selecciona segmento, template y nombra tu campaña.
        </p>
        {/* Create Segment and Design Template Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Create Segment */}
          <div className={`border border-gray-200 rounded-lg p-6 flex flex-col items-center cursor-pointer transition-colors relative ${selectedSegment ? 'bg-[#F0F9F9] border-custom-green-200' : 'hover:bg-gray-50'}`} 
            onClick={onCreateSegment}>
            {selectedSegment && <div className="absolute top-3 right-3 bg-custom-green-600 rounded-full p-1">
                <CheckIcon className="h-4 w-4 text-white" />
              </div>}
            <div className="w-16 h-16 bg-custom-green-50 rounded-full flex items-center justify-center mb-4">
              <TargetIcon className="h-8 w-8 text-custom-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Crear segmento
            </h3>
            {selectedSegment ? <p className="text-sm text-gray-500 text-center flex items-center">
                <TargetIcon className="h-3 w-3 mr-1" />
                Segmento aplicado: {selectedSegment.segment_name}
              </p> : <p className="text-sm text-gray-500 text-center">
                Define a quién irá dirigida (frecuencia, ticket, preferencias).
              </p>}
          </div>
          {/* Design Template */}
          <div className={`border border-gray-200 rounded-lg p-6 flex flex-col items-center cursor-pointer transition-colors relative ${selectedTemplate ? 'bg-[#F0F9F9] border-custom-green-200' : 'hover:bg-gray-50'}`} onClick={onDesignTemplate}>
            {selectedTemplate && <div className="absolute top-3 right-3 bg-custom-green-600 rounded-full p-1">
                <CheckIcon className="h-4 w-4 text-white" />
              </div>}
            <div className="w-16 h-16 bg-custom-green-50 rounded-full flex items-center justify-center mb-4">
              <LayoutIcon className="h-8 w-8 text-custom-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Diseñar template
            </h3>
            {selectedTemplate ? <p className="text-sm text-gray-500 text-center flex items-center">
                <LayoutIcon className="h-3 w-3 mr-1" />
                Template aplicado: {selectedTemplate.name}
                {selectedTemplate.isPreset && <span className="ml-1 text-xs bg-custom-green-100 text-custom-green-800 px-1.5 py-0.5 rounded-full">
                    Prediseñado
                  </span>}
              </p> : <p className="text-sm text-gray-500 text-center">
                Elige o crea el diseño del Email o SMS.
              </p>}
          </div>
        </div>
        <div className="mb-8">
          <p className="text-sm text-gray-600 mb-4 text-center">
            También puedes elegir uno de tus segmentos o diseños guardados
          </p>
          {/* Saved Segments */}
          <h3 className="text-md font-medium text-gray-900 mb-3">
            Segmentos guardados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {savedSegments.map(segment => <div key={segment.id} onClick={() => handleSegmentSelection(segment)} className={`border rounded-lg p-4 cursor-pointer transition-colors flex justify-between items-center ${selectedSegment?.id === segment.id ? 'border-custom-green-600 bg-custom-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                <div className="flex items-center">
                  <div className="p-2 bg-gray-100 rounded-full mr-3">
                    <TargetIcon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {segment.segment_name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {segment.activeFiltersCount} filtros
                    </p>
                  </div>
                </div>
                {selectedSegment?.id === segment.id && <span className="text-xs bg-custom-green-100 text-custom-green-800 px-2 py-1 rounded-full">
                    Seleccionado
                  </span>}
              </div>)}
          </div>
          {/* Saved Templates */}
          <h3 className="text-md font-medium text-gray-900 mb-3">
            Templates guardados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {savedTemplates.map(template => <div key={template.id} onClick={() => handleTemplateSelection(template)} className={`border rounded-lg p-4 cursor-pointer transition-colors flex justify-between items-center ${selectedTemplate?.id === template.id ? 'border-custom-green-600 bg-custom-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
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
                {selectedTemplate?.id === template.id && <span className="text-xs bg-custom-green-100 text-custom-green-800 px-2 py-1 rounded-full">
                    Seleccionado
                  </span>}
              </div>)}
          </div>
        </div>
        {/* Campaign Name */}
        <div className="mb-8">
          <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de la campaña
          </label>
          <input type="text" id="campaign-name" placeholder="Ej. Promo regreso a clases – septiembre" value={campaignName} onChange={e => setCampaignName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-green-500" />
        </div>
        {/* Footer */}
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleNext} disabled={!campaignName.trim()} className={`px-4 py-2 rounded-lg text-white ${!campaignName.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-custom-green-600 hover:bg-custom-green-700'}`}>
            Siguiente
          </button>
        </div>
      </div>
    </div>;
};
export default NewCampaignModal;