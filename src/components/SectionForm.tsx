import React, { useState } from 'react';
import { XIcon, PlusIcon, TrashIcon, GripIcon } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { MenuSection } from '../services/menuApi';

interface SectionFormProps {
  sections: MenuSection[];
  onSubmit: (sections: string[]) => void;
  onCancel: () => void;
  fixedCategory?: string;
}
const SectionForm: React.FC<SectionFormProps> = ({
  sections,
  onSubmit,
  onCancel,
  fixedCategory
}) => {
  // Extract section names from MenuSection objects
  const [sectionList, setSectionList] = useState([...sections.map(s => s.name)]);
  const [newSection, setNewSection] = useState('');
  const handleAddSection = () => {
    if (newSection.trim() && !sectionList.includes(newSection.trim())) {
      setSectionList([...sectionList, newSection.trim()]);
      setNewSection('');
    }
  };
  const handleRemoveSection = (index: number) => {
    const updatedSections = [...sectionList];
    updatedSections.splice(index, 1);
    setSectionList(updatedSections);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(sectionList);
  };
  const onDragEnd = (result: any) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }
    const items = Array.from(sectionList);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSectionList(items);
  };
  return <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]" onClick={onCancel}></div>
      <div className="relative bg-white rounded-lg max-w-md w-full mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            Gestionar secciones del menú
          </h2>
          <button type="button" className="text-gray-400 hover:text-gray-500" onClick={onCancel}>
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="newSection" className="block text-sm font-medium text-gray-700 mb-1">
              Agregar nueva sección
            </label>
            <div className="flex">
              <input type="text" id="newSection" value={newSection} onChange={e => setNewSection(e.target.value)} className="flex-1 border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 sm:text-sm" placeholder="Nombre de la sección" />
              <button type="button" onClick={handleAddSection} className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-custom-green-600 hover:bg-custom-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500">
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secciones actuales
              <span className="ml-2 text-xs text-gray-500 font-normal">
                (Arrastra para reordenar)
              </span>
            </label>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="sections">
                {provided => <ul {...provided.droppableProps} ref={provided.innerRef} className="border border-gray-200 rounded-md divide-y divide-gray-200 max-h-60 overflow-y-auto">
                    {sectionList.length === 0 ? <li className="px-4 py-3 text-sm text-gray-500">
                        No hay secciones definidas
                      </li> : sectionList.map((section, index) => <Draggable key={`section-${index}-${section}`} draggableId={`section-${index}-${section}`} index={index}>
                          {(provided, snapshot) => <li ref={provided.innerRef} {...provided.draggableProps} className={`px-4 py-3 flex items-center justify-between text-sm ${snapshot.isDragging ? 'bg-gray-50' : ''}`}>
                              <div className="flex items-center flex-1">
                                <span {...provided.dragHandleProps} className="mr-2 cursor-grab text-gray-400 hover:text-gray-600">
                                  <GripIcon className="h-4 w-4" />
                                </span>
                                <span className="text-gray-900">{section}</span>
                              </div>
                              <button type="button" onClick={() => handleRemoveSection(index)} className="text-red-500 hover:text-red-700 ml-2">
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </li>}
                        </Draggable>)}
                    {provided.placeholder}
                  </ul>}
              </Droppable>
            </DragDropContext>
          </div>
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-custom-green-600 text-base font-medium text-white hover:bg-custom-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 sm:col-start-2 sm:text-sm">
              Guardar cambios
            </button>
            <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 sm:mt-0 sm:col-start-1 sm:text-sm" onClick={onCancel}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>;
};
export default SectionForm;