import React, { useState } from 'react';
import { XIcon, PlusIcon, TrashIcon, GripIcon } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { MenuSection } from '../services/menuApi';

interface SectionFormProps {
  sections: MenuSection[];
  onSubmit: (sections: MenuSection[], newSectionNames: string[]) => void;
  onCancel: () => void;
  fixedCategory?: string;
}
const SectionForm: React.FC<SectionFormProps> = ({
  sections,
  onSubmit,
  onCancel,
  fixedCategory
}) => {
  // Manage sections as complete objects to preserve order and IDs
  const [orderedSections, setOrderedSections] = useState<MenuSection[]>([...sections]);
  const [newSectionNames, setNewSectionNames] = useState<string[]>([]);
  const [newSection, setNewSection] = useState('');

  // Helper function to create safe draggable IDs
  const createSafeDraggableId = (index: number) => `section-item-${index}`;
  const handleAddSection = () => {
    const trimmedSection = newSection.trim();

    // Verificar contra nuevas secciones Y secciones existentes
    const existsInNew = newSectionNames.includes(trimmedSection);
    const existsInExisting = orderedSections.some(section => section.name === trimmedSection);

    if (trimmedSection && !existsInNew && !existsInExisting) {
      setNewSectionNames([...newSectionNames, trimmedSection]);
      setNewSection('');
    }
  };
  const handleRemoveSection = (index: number, isNewSection: boolean) => {
    if (isNewSection) {
      const updatedNewSections = [...newSectionNames];
      updatedNewSections.splice(index, 1);
      setNewSectionNames(updatedNewSections);
    } else {
      const updatedSections = [...orderedSections];
      updatedSections.splice(index, 1);
      setOrderedSections(updatedSections);
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(orderedSections, newSectionNames);
  };
  const onDragEnd = (result: any) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    // Reorder only existing sections (not new ones)
    const items = Array.from(orderedSections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setOrderedSections(items);
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
                    {orderedSections.length === 0 && newSectionNames.length === 0 ? <li className="px-4 py-3 text-sm text-gray-500">
                        No hay secciones definidas
                      </li> : (
                      <>
                        {/* Existing sections (draggable) */}
                        {orderedSections.map((section, index) => (
                          <Draggable key={createSafeDraggableId(index)} draggableId={createSafeDraggableId(index)} index={index}>
                            {(provided, snapshot) => (
                              <li ref={provided.innerRef} {...provided.draggableProps} className={`px-4 py-3 flex items-center justify-between text-sm ${snapshot.isDragging ? 'bg-gray-50' : ''}`}>
                                <div className="flex items-center flex-1">
                                  <span {...provided.dragHandleProps} className="mr-2 cursor-grab text-gray-400 hover:text-gray-600">
                                    <GripIcon className="h-4 w-4" />
                                  </span>
                                  <span className="text-gray-900">{section.name}</span>
                                </div>
                                <button type="button" onClick={() => handleRemoveSection(index, false)} className="text-red-500 hover:text-red-700 ml-2">
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </li>
                            )}
                          </Draggable>
                        ))}

                        {/* New sections (not draggable yet) */}
                        {newSectionNames.map((sectionName, index) => (
                          <li key={`new-${index}`} className="px-4 py-3 flex items-center justify-between text-sm bg-green-50 border-l-4 border-green-400">
                            <div className="flex items-center flex-1">
                              <span className="mr-2 text-green-400">
                                <PlusIcon className="h-4 w-4" />
                              </span>
                              <span className="text-gray-900 font-medium">{sectionName}</span>
                              <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Nueva</span>
                            </div>
                            <button type="button" onClick={() => handleRemoveSection(index, true)} className="text-red-500 hover:text-red-700 ml-2">
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </li>
                        ))}
                      </>
                    )}
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