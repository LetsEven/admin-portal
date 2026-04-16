import React, { useState } from "react";
import {
  XIcon,
  PlusIcon,
  TrashIcon,
  GripIcon,
  Loader2Icon,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { MenuSection } from "../services/adminPortalApi";

interface NewSection {
  name: string;
  clasificacion: number;
}

interface SectionFormProps {
  sections: MenuSection[];
  onSubmit: (sections: MenuSection[], newSections: NewSection[]) => void;
  onCancel: () => void;
  fixedCategory?: string;
  isSubmitting?: boolean;
}
const SectionForm: React.FC<SectionFormProps> = ({
  sections,
  onSubmit,
  onCancel,
  fixedCategory,
  isSubmitting = false,
}) => {
  // Manage sections as complete objects to preserve order and IDs
  const [orderedSections, setOrderedSections] = useState<MenuSection[]>([
    ...sections,
  ]);
  const [newSectionNames, setNewSectionNames] = useState<NewSection[]>([]);
  const [newSection, setNewSection] = useState("");
  const [newSectionClasificacion, setNewSectionClasificacion] =
    useState<number>(1);

  // Helper function to create safe draggable IDs
  const createSafeDraggableId = (index: number) => `section-item-${index}`;
  const handleAddSection = () => {
    const trimmedSection = newSection.trim();

    // Verificar contra nuevas secciones Y secciones existentes
    const existsInNew = newSectionNames.some((s) => s.name === trimmedSection);
    const existsInExisting = orderedSections.some(
      (section) => section.name === trimmedSection,
    );

    if (trimmedSection && !existsInNew && !existsInExisting) {
      setNewSectionNames([
        ...newSectionNames,
        { name: trimmedSection, clasificacion: newSectionClasificacion },
      ]);
      setNewSection("");
      setNewSectionClasificacion(1); // Reset to default
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
  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]"
        onClick={onCancel}
      ></div>
      <div className="relative bg-white rounded-lg max-w-md w-full mx-auto p-4 sm:p-6">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-medium text-gray-900">
            Gestionar secciones del menú
          </h2>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500 p-1"
            onClick={onCancel}
          >
            <XIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3 sm:mb-4">
            <label
              htmlFor="newSection"
              className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
            >
              Agregar nueva sección
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  id="newSection"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 text-sm"
                  placeholder="Nombre de la sección"
                />
                <select
                  value={newSectionClasificacion}
                  onChange={(e) =>
                    setNewSectionClasificacion(Number(e.target.value))
                  }
                  className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 text-sm"
                >
                  <option value={1}>ALIMENTOS</option>
                  <option value={2}>BEBIDAS</option>
                  <option value={3}>OTROS</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-custom-green-600 hover:bg-custom-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500"
                >
                  <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
          </div>
          <div className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              Secciones actuales
              <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs text-gray-500 font-normal">
                (Arrastra para reordenar)
              </span>
            </label>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <ul
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="border border-gray-200 rounded-md divide-y divide-gray-200 max-h-48 sm:max-h-60 overflow-y-auto"
                  >
                    {orderedSections.length === 0 &&
                    newSectionNames.length === 0 ? (
                      <li className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-500">
                        No hay secciones definidas
                      </li>
                    ) : (
                      <>
                        {/* Existing sections (draggable) */}
                        {orderedSections.map((section, index) => (
                          <Draggable
                            key={createSafeDraggableId(index)}
                            draggableId={createSafeDraggableId(index)}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <li
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between text-xs sm:text-sm ${snapshot.isDragging ? "bg-gray-50" : ""}`}
                              >
                                <div className="flex items-center flex-1 min-w-0">
                                  <span
                                    {...provided.dragHandleProps}
                                    className="mr-1.5 sm:mr-2 cursor-grab text-gray-400 hover:text-gray-600 flex-shrink-0"
                                  >
                                    <GripIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  </span>
                                  <span className="text-gray-900 truncate">
                                    {section.name}
                                  </span>
                                  {section.clasificacion && (
                                    <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs text-gray-600 bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex-shrink-0">
                                      {section.clasificacion === 1
                                        ? "ALIMENTOS"
                                        : section.clasificacion === 2
                                          ? "BEBIDAS"
                                          : "OTROS"}
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveSection(index, false)
                                  }
                                  className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0 p-0.5"
                                >
                                  <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                              </li>
                            )}
                          </Draggable>
                        ))}

                        {/* New sections (not draggable yet) */}
                        {newSectionNames.map((section, index) => (
                          <li
                            key={`new-${index}`}
                            className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between text-xs sm:text-sm bg-green-50 border-l-4 border-green-400"
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              <span className="mr-1.5 sm:mr-2 text-green-400 flex-shrink-0">
                                <PlusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </span>
                              <span className="text-gray-900 font-medium truncate">
                                {section.name}
                              </span>
                              <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs text-gray-600 bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex-shrink-0">
                                {section.clasificacion === 1
                                  ? "ALIMENTOS"
                                  : section.clasificacion === 2
                                    ? "BEBIDAS"
                                    : "OTROS"}
                              </span>
                              <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs text-green-600 bg-green-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex-shrink-0">
                                Nueva
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSection(index, true)}
                              className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0 p-0.5"
                            >
                              <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                          </li>
                        ))}
                      </>
                    )}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          </div>
          <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-3 sm:px-4 py-2 bg-white text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex justify-center items-center gap-2 rounded-md border border-transparent shadow-sm px-3 sm:px-4 py-2 bg-custom-green-600 text-xs sm:text-sm font-medium text-white hover:bg-custom-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2Icon className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default SectionForm;
