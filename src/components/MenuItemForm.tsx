import React, { useEffect, useState } from "react";
import {
  XIcon,
  UploadIcon,
  PlusIcon,
  TrashIcon,
  MapPin,
  CheckIcon,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { ImageUploadService } from "../services/imageUploadService";
import { useUser } from "@clerk/nextjs";
import { useAdminPortalApi, MenuSection } from "../services/adminPortalApi";
import { useMenuAdminPortalApi } from "../services/menuAdminPortalApi";
import toast from "react-hot-toast";

interface Branch {
  id: string;
  name: string;
  address: string;
  active: boolean;
}

interface CustomField {
  id: string;
  name: string;
  type: "dropdown" | "checkboxes" | "dropdown-quantity";
  required: boolean;
  maxSelections?: number; // Para checkboxes: cantidad máxima seleccionable (1-10)
  options: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

interface MenuItemFormProps {
  initialValues?: {
    id?: number;
    name: string;
    description: string;
    price: number;
    base_price?: number;
    discount?: number;
    category: string; // Mantenemos para compatibilidad
    section_id?: number; // Agregamos section_id como primary
    image: string;
    customFields?: CustomField[];
    availableBranches?: string[]; // Array de branch IDs donde está disponible
    outOfStockBranches?: string[]; // Array de branch IDs donde está agotado
    preparation_time_minutes?: number;
  };
  onSubmit: (values: any) => void;
  onCancel: () => void;
  preselectedCategory?: string;
  preselectedSectionId?: number; // Agregamos para manejar section_id
  isPickNGoEnabled?: boolean;
}
const MenuItemForm: React.FC<MenuItemFormProps> = ({
  initialValues = {
    name: "",
    description: "",
    price: 0,
    discount: 0,
    category: "",
    image: "",
    customFields: [],
    availableBranches: [],
    outOfStockBranches: [],
  },
  onSubmit,
  onCancel,
  preselectedCategory,
  preselectedSectionId,
  isPickNGoEnabled = false,
}) => {
  const { user } = useUser();
  // Si estamos editando (tiene id y base_price), usar base_price directamente
  // Si no tiene base_price (datos antiguos), calcular dividiendo entre 1.16
  // Si es nuevo, usar el precio tal cual
  const displayPrice = initialValues.id
    ? (initialValues.base_price ??
      Math.round((initialValues.price / 1.16) * 100) / 100)
    : initialValues.price;

  const [values, setValues] = useState({
    ...initialValues,
    price: displayPrice,
    category: initialValues.id
      ? initialValues.category
      : preselectedCategory || initialValues.category,
    section_id: initialValues.id
      ? initialValues.section_id
      : preselectedSectionId || initialValues.section_id,
  });

  // Branch availability state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>(
    initialValues.availableBranches || [],
  );
  const [outOfStockBranches, setOutOfStockBranches] = useState<string[]>(
    initialValues.outOfStockBranches || [],
  );
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [availabilityExpanded, setAvailabilityExpanded] = useState(false);
  const [outOfStockExpanded, setOutOfStockExpanded] = useState(false);
  const [personalizationExpanded, setPersonalizationExpanded] = useState(false);
  const [prepTimeExpanded, setPrepTimeExpanded] = useState(true);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number | "">(
    initialValues.preparation_time_minutes ?? "",
  );
  const adminPortalApi = useAdminPortalApi();
  const menuApi = useMenuAdminPortalApi();

  // Sections state
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>(
    initialValues.customFields || [],
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Load branches and sections when component mounts
  useEffect(() => {
    loadBranches();
    loadSections();
  }, []);

  const loadBranches = async () => {
    try {
      setBranchesLoading(true);
      const branchesData = await adminPortalApi.getBranches();
      setBranches(
        (branchesData.branches || []).map((b) => ({
          ...b,
          address: b.address ?? "",
        })),
      );
      // Las sucursales seleccionadas vienen de initialValues.availableBranches
      // No preseleccionamos nada automáticamente - el usuario debe elegir manualmente
    } catch (error) {
      console.error("Error loading branches:", error);
      toast.error("Error al cargar sucursales");
    } finally {
      setBranchesLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      setSectionsLoading(true);
      const sectionsData = await menuApi.sections.getAll();
      setSections(sectionsData || []);
    } catch (error) {
      console.error("Error loading sections:", error);
      toast.error("Error al cargar categorías");
    } finally {
      setSectionsLoading(false);
    }
  };

  const handleBranchToggle = (branchId: string) => {
    setSelectedBranches((prev) => {
      if (prev.includes(branchId)) {
        setOutOfStockBranches((oos) => oos.filter((id) => id !== branchId));
        return prev.filter((id) => id !== branchId);
      } else {
        return [...prev, branchId];
      }
    });
  };

  const handleOutOfStockToggle = (branchId: string) => {
    setOutOfStockBranches((prev) => {
      if (prev.includes(branchId)) {
        return prev.filter((id) => id !== branchId);
      } else {
        return [...prev, branchId];
      }
    });
  };

  const isAllBranchesSelected =
    branches.length > 0 && selectedBranches.length === branches.length;

  const handleSelectAllBranches = () => {
    if (isAllBranchesSelected) {
      setSelectedBranches([]);
    } else {
      setSelectedBranches(branches.map((branch) => branch.id));
    }
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sectionId = parseInt(e.target.value) || undefined;
    const selectedSection = sections.find(
      (section) => section.id === sectionId,
    );

    setValues({
      ...values,
      section_id: sectionId,
      category: selectedSection?.name || "",
    });
  };

  // Set initial image preview if an image URL exists
  useEffect(() => {
    if (initialValues.image && initialValues.image.startsWith("http")) {
      setImagePreview(initialValues.image);
    }
  }, [initialValues.image]);

  // Sincronizar selectedBranches y outOfStockBranches cuando cambian los initialValues (al editar un producto)
  useEffect(() => {
    if (
      initialValues.availableBranches &&
      initialValues.availableBranches.length > 0
    ) {
      setSelectedBranches(initialValues.availableBranches);
    }
    setOutOfStockBranches(initialValues.outOfStockBranches || []);
  }, [initialValues.id]);
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === "price" || name === "discount") {
      if (value === "") {
        setValues({ ...values, [name]: "" });
        return;
      }

      // Validar que solo tenga máximo 2 decimales
      const decimalRegex = /^\d*\.?\d{0,2}$/;
      if (!decimalRegex.test(value)) {
        return; // No actualizar si tiene más de 2 decimales
      }

      // Mantener como string para preservar la edición natural
      setValues({ ...values, [name]: value });
    } else {
      setValues({ ...values, [name]: value });
    }
  };
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast.error("Debes estar autenticado para subir imágenes", {
        duration: 3000,
      });
      return;
    }

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      try {
        setIsUploadingImage(true);

        // Create preview URL for immediate display
        const base64Preview = await ImageUploadService.fileToBase64(file);
        setImagePreview(base64Preview);

        // Resize image before upload - mayor resolución y calidad para comida
        const resizedFile = await ImageUploadService.resizeImage(
          file,
          1920, // Ancho máximo mayor para mejor calidad
          1280, // Alto máximo mayor
          0.92, // Mayor calidad para imágenes de comida
        );

        // Upload to storage
        const publicUrl = await ImageUploadService.updateImage(
          resizedFile,
          "item",
          values.image, // Delete old image if exists
        );

        // Update form values with the public URL
        setValues({
          ...values,
          image: publicUrl,
        });

        // Update preview to the final URL
        setImagePreview(publicUrl);

        toast.success("Imagen subida correctamente", {
          duration: 2000,
          icon: "",
        });
      } catch (error) {
        console.error("❌ Error uploading item image:", error);
        toast.error("Error al subir la imagen. Por favor intenta de nuevo.", {
          duration: 4000,
        });

        // Reset on error
        setImageFile(null);
        setImagePreview(values.image || null);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };
  const handleAddField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      name: "",
      type: "dropdown",
      required: false,
      options: [
        {
          id: Date.now().toString(),
          name: "",
          price: 0,
        },
      ],
    };
    setCustomFields([...customFields, newField]);
  };

  const handleRemoveField = (id: string) => {
    setCustomFields(customFields.filter((field) => field.id !== id));
  };

  const handleFieldNameChange = (id: string, name: string) => {
    setCustomFields(
      customFields.map((field) =>
        field.id === id ? { ...field, name } : field,
      ),
    );
  };

  const handleFieldTypeChange = (id: string, type: CustomField["type"]) => {
    setCustomFields(
      customFields.map((field) =>
        field.id === id
          ? {
              ...field,
              type,
              // Set default maxSelections for checkboxes
              maxSelections: type === "checkboxes" ? 1 : undefined,
              options: [
                {
                  id: Date.now().toString(),
                  name: "",
                  price: 0,
                },
              ],
            }
          : field,
      ),
    );
  };

  const handleMaxSelectionsChange = (id: string, maxSelections: number) => {
    // Validar que el valor esté entre 1 y 10
    if (maxSelections < 1 || maxSelections > 10) {
      console.warn(
        `maxSelections debe estar entre 1 y 10, recibido: ${maxSelections}`,
      );
      return;
    }

    setCustomFields(
      customFields.map((field) =>
        field.id === id ? { ...field, maxSelections } : field,
      ),
    );
  };

  const handleAddOption = (fieldId: string) => {
    setCustomFields(
      customFields.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              options: [
                ...field.options,
                {
                  id: Date.now().toString() + Math.random(),
                  name: "",
                  price: 0,
                },
              ],
            }
          : field,
      ),
    );
  };

  const handleRemoveOption = (fieldId: string, optionIndex: number) => {
    setCustomFields(
      customFields.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              options: field.options.filter((_, i) => i !== optionIndex),
            }
          : field,
      ),
    );
  };

  const handleOptionChange = (
    fieldId: string,
    optionIndex: number,
    value: string,
  ) => {
    setCustomFields(
      customFields.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              options: field.options.map((opt, i) =>
                i === optionIndex ? { ...opt, name: value } : opt,
              ),
            }
          : field,
      ),
    );
  };

  const handleOptionPriceChange = (
    fieldId: string,
    optionIndex: number,
    price: number,
  ) => {
    setCustomFields(
      customFields.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              options: field.options.map((opt, i) =>
                i === optionIndex ? { ...opt, price: price } : opt,
              ),
            }
          : field,
      ),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (initialValues.id) {
      toast.success(`Actualizando "${values.name}"`, {
        duration: 2000,
      });
    } else {
      toast.success(`Guardando platillo "${values.name}"`, {
        duration: 2000,
      });
    }

    // Siempre aplicar el 16% de IVA al precio antes de guardar en BD
    const numericPrice = Number(values.price) || 0;
    const priceWithTax = numericPrice * 1.16;
    const basePrice = numericPrice; // Precio sin IVA
    onSubmit({
      ...values,
      price: priceWithTax,
      base_price: basePrice,
      customFields,
      availableBranches: selectedBranches,
      outOfStockBranches,
      preparation_time_minutes: prepTimeMinutes === "" ? null : prepTimeMinutes,
    });
  };
  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-3 sm:p-4 md:py-8">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]"
        onClick={onCancel}
      ></div>
      <div className="relative bg-white rounded-lg max-w-2xl w-full mx-auto p-4 sm:p-6 mt-10 sm:mt-8 mb-4 sm:mb-8 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-medium text-gray-900">
            {initialValues.id ? "Editar platillo" : "Agregar platillo"}
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
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label
                htmlFor="image"
                className="block text-xs sm:text-sm font-medium text-gray-700"
              >
                Imagen del platillo
              </label>
              <div className="mt-1 flex items-center">
                <div className="flex-shrink-0 relative">
                  {imagePreview ? (
                    <div className="h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-md">
                      <img
                        src={imagePreview}
                        alt="Vista previa"
                        className="h-20 w-20 sm:h-24 sm:w-24 object-cover img-food-quality rounded-md"
                        loading="eager"
                        decoding="async"
                      />
                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
                          <div className="h-5 w-5 sm:h-6 sm:w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400">
                      {isUploadingImage ? (
                        <div className="h-5 w-5 sm:h-6 sm:w-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <UploadIcon className="h-6 w-6 sm:h-8 sm:w-8" />
                      )}
                    </div>
                  )}
                </div>
                <div className="ml-3 sm:ml-4 flex-1">
                  <div className="relative">
                    <input
                      type="file"
                      name="imageFile"
                      id="imageFile"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                    <label
                      htmlFor="imageFile"
                      className={`cursor-pointer py-1.5 sm:py-2 px-2.5 sm:px-3 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 ${isUploadingImage ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isUploadingImage ? "Subiendo..." : "Seleccionar imagen"}
                    </label>
                    {isUploadingImage && (
                      <input type="file" disabled className="sr-only" />
                    )}
                  </div>
                  <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
                    JPG, PNG o WEBP.
                  </p>
                  {imageFile && (
                    <p className="mt-1 text-[10px] sm:text-xs text-gray-700 truncate max-w-[150px] sm:max-w-none">
                      {imageFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="section_id"
                className="block text-xs sm:text-sm font-medium text-gray-700"
              >
                Categoría *
              </label>
              <select
                name="section_id"
                id="section_id"
                required
                value={values.section_id || ""}
                onChange={handleSectionChange}
                disabled={sectionsLoading}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 text-sm"
              >
                <option value="">
                  {sectionsLoading
                    ? "Cargando categorías..."
                    : "Seleccionar categoría"}
                </option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="name"
                className="block text-xs sm:text-sm font-medium text-gray-700"
              >
                Nombre
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={values.name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-xs sm:text-sm font-medium text-gray-700"
              >
                Descripción
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                required
                value={values.description}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 text-sm"
              />
            </div>

            {/* Disponibilidad por Sucursal Section */}
            <div className="pt-3 sm:pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setAvailabilityExpanded((v) => !v)}
                className="w-full flex items-center justify-between mb-2 sm:mb-3 group"
              >
                <span className="flex items-center text-xs sm:text-sm font-medium text-gray-700">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Disponibilidad por Sucursal
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${availabilityExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {availabilityExpanded && (
                <>
                  {branches.length > 1 && (
                    <div className="flex justify-end mb-2 sm:mb-3">
                      <button
                        type="button"
                        onClick={handleSelectAllBranches}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 text-[10px] sm:text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        {isAllBranchesSelected
                          ? "Deseleccionar todas"
                          : "Seleccionar todas"}
                      </button>
                    </div>
                  )}

                  {branchesLoading ? (
                    <div className="text-center py-3 sm:py-4">
                      <div className="text-xs sm:text-sm text-gray-500">
                        Cargando sucursales...
                      </div>
                    </div>
                  ) : branches.length === 0 ? (
                    <div className="text-center py-3 sm:py-4">
                      <p className="text-xs sm:text-sm text-gray-500 italic">
                        No hay sucursales configuradas para este restaurante.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2">
                      <p className="text-[10px] sm:text-xs text-gray-600 mb-2 sm:mb-3">
                        Selecciona las sucursales donde este producto estará
                        disponible:
                      </p>
                      {branches.map((branch) => (
                        <label
                          key={branch.id}
                          className={`flex items-center p-2.5 sm:p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedBranches.includes(branch.id)
                              ? "border-green-300 bg-green-50"
                              : "border-gray-200 bg-white hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedBranches.includes(branch.id)}
                              onChange={() => handleBranchToggle(branch.id)}
                              className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded flex-shrink-0"
                            />
                            <div className="ml-2.5 sm:ml-3 min-w-0">
                              <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                {branch.name}
                              </div>
                              <div className="text-[10px] sm:text-xs text-gray-500 truncate">
                                {branch.address}
                              </div>
                            </div>
                          </div>
                          {selectedBranches.includes(branch.id) && (
                            <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 ml-2 flex-shrink-0" />
                          )}
                        </label>
                      ))}

                      {selectedBranches.length === 0 && (
                        <div className="mt-1.5 sm:mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-[10px] sm:text-xs text-yellow-800">
                            Este producto no estará disponible en ninguna
                            sucursal.
                          </p>
                        </div>
                      )}

                      <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-gray-500">
                        {selectedBranches.length} de {branches.length} sucursal
                        {branches.length !== 1 ? "es" : ""} seleccionada
                        {selectedBranches.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Agotado por Sucursal Section */}
            <div className="pt-3 sm:pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setOutOfStockExpanded((v) => !v)}
                className="w-full flex items-center justify-between mb-2 sm:mb-3 group"
              >
                <span className="flex items-center text-xs sm:text-sm font-medium text-gray-700">
                  <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-red-500" />
                  Agotado por Sucursal
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${outOfStockExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {outOfStockExpanded && (
                <>
                  {branchesLoading ? (
                    <div className="text-center py-3 sm:py-4">
                      <div className="text-xs sm:text-sm text-gray-500">
                        Cargando sucursales...
                      </div>
                    </div>
                  ) : branches.length === 0 ? (
                    <div className="text-center py-3 sm:py-4">
                      <p className="text-xs sm:text-sm text-gray-500 italic">
                        No hay sucursales configuradas para este restaurante.
                      </p>
                    </div>
                  ) : selectedBranches.length === 0 ? (
                    <div className="text-center py-3 sm:py-4">
                      <p className="text-xs sm:text-sm text-gray-500 italic">
                        Selecciona al menos una sucursal en disponibilidad para
                        marcar agotado.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2">
                      <p className="text-[10px] sm:text-xs text-gray-600 mb-2 sm:mb-3">
                        Marca las sucursales donde este producto está agotado
                        temporalmente:
                      </p>
                      {branches
                        .filter((b) => selectedBranches.includes(b.id))
                        .map((branch) => (
                          <label
                            key={branch.id}
                            className={`flex items-center p-2.5 sm:p-3 border rounded-lg cursor-pointer transition-colors ${
                              outOfStockBranches.includes(branch.id)
                                ? "border-red-300 bg-red-50"
                                : "border-gray-200 bg-white hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={outOfStockBranches.includes(branch.id)}
                                onChange={() =>
                                  handleOutOfStockToggle(branch.id)
                                }
                                className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded flex-shrink-0"
                              />
                              <div className="ml-2.5 sm:ml-3 min-w-0">
                                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                  {branch.name}
                                </div>
                                <div className="text-[10px] sm:text-xs text-gray-500 truncate">
                                  {branch.address}
                                </div>
                              </div>
                            </div>
                            {outOfStockBranches.includes(branch.id) && (
                              <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 ml-2 flex-shrink-0" />
                            )}
                          </label>
                        ))}

                      {outOfStockBranches.length > 0 && (
                        <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-red-600 font-medium">
                          {outOfStockBranches.length} sucursal
                          {outOfStockBranches.length !== 1 ? "es" : ""} con
                          producto agotado
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Personalización Section */}
            <div className="pt-3 sm:pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setPersonalizationExpanded((v) => !v)}
                className="w-full flex items-center justify-between mb-2 sm:mb-3 group"
              >
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  Personalización
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${personalizationExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {personalizationExpanded && (
                <>
                  <div className="flex justify-end mb-2 sm:mb-3">
                    <button
                      type="button"
                      onClick={handleAddField}
                      className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 border border-transparent text-[10px] sm:text-xs font-medium rounded-md text-white bg-custom-green-500 hover:bg-custom-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-600"
                    >
                      <PlusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                      Add Field
                    </button>
                  </div>

                  {customFields.length === 0 ? (
                    <p className="text-xs sm:text-sm text-gray-500 italic">
                      No hay campos de personalización. Haz clic en "Add Field"
                      para agregar uno.
                    </p>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {customFields.map((field, fieldIndex) => (
                        <div
                          key={field.id}
                          className="p-2.5 sm:p-3 border border-gray-200 rounded-md bg-gray-50"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] sm:text-xs font-medium text-gray-500">
                              Campo {fieldIndex + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveField(field.id)}
                              className="text-red-500 hover:text-red-700 p-0.5"
                            >
                              <TrashIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </button>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                                Nombre del campo
                              </label>
                              <input
                                type="text"
                                value={field.name}
                                onChange={(e) =>
                                  handleFieldNameChange(
                                    field.id,
                                    e.target.value,
                                  )
                                }
                                placeholder="Ej: Tamaño, Extras, etc."
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 text-xs sm:text-sm focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                                Tipo de respuesta
                              </label>
                              <select
                                value={field.type}
                                onChange={(e) =>
                                  handleFieldTypeChange(
                                    field.id,
                                    e.target.value as CustomField["type"],
                                  )
                                }
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 text-xs sm:text-sm focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500"
                              >
                                <option value="dropdown">
                                  Lista Desplegable
                                </option>
                                <option value="checkboxes">
                                  Opciones Casillas
                                </option>
                                <option value="dropdown-quantity">
                                  Lista desplegable con cantidad
                                </option>
                              </select>
                            </div>

                            {/* Checkbox Obligatorio - solo para dropdown */}
                            {field.type === "dropdown" && (
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`required-${field.id}`}
                                  checked={field.required}
                                  onChange={(e) => {
                                    setCustomFields(
                                      customFields.map((f) =>
                                        f.id === field.id
                                          ? { ...f, required: e.target.checked }
                                          : f,
                                      ),
                                    );
                                  }}
                                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-custom-green-600 focus:ring-custom-green-500 border-gray-300 rounded"
                                />
                                <label
                                  htmlFor={`required-${field.id}`}
                                  className="ml-2 block text-[10px] sm:text-xs font-medium text-gray-700"
                                >
                                  Obligatorio
                                </label>
                              </div>
                            )}

                            {/* Max Selections - solo para checkboxes */}
                            {field.type === "checkboxes" && (
                              <div>
                                <label
                                  htmlFor={`max-selections-${field.id}`}
                                  className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1"
                                >
                                  Máximo de opciones seleccionables
                                </label>
                                <input
                                  type="number"
                                  id={`max-selections-${field.id}`}
                                  min="1"
                                  max="10"
                                  value={field.maxSelections || 1}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    if (value >= 1 && value <= 10) {
                                      handleMaxSelectionsChange(
                                        field.id,
                                        value,
                                      );
                                    }
                                  }}
                                  className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 text-xs sm:text-sm focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500"
                                />
                                <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
                                  Los clientes podrán seleccionar hasta{" "}
                                  {field.maxSelections || 1}{" "}
                                  {field.maxSelections === 1
                                    ? "opción"
                                    : "opciones"}
                                </p>
                              </div>
                            )}

                            {/* Options for dropdown and checkboxes */}
                            {(field.type === "dropdown" ||
                              field.type === "checkboxes" ||
                              field.type === "dropdown-quantity") && (
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="block text-[10px] sm:text-xs font-medium text-gray-700">
                                    Opciones
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleAddOption(field.id)}
                                    className="text-[10px] sm:text-xs text-custom-green-600 hover:text-custom-green-700"
                                  >
                                    + Agregar opción
                                  </button>
                                </div>
                                <div className="space-y-1.5 sm:space-y-2">
                                  {field.options.map((option, optionIndex) => (
                                    <div
                                      key={optionIndex}
                                      className="border border-gray-200 rounded-md p-1.5 sm:p-2 bg-gray-50"
                                    >
                                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                        <input
                                          type="text"
                                          value={option.name}
                                          onChange={(e) =>
                                            handleOptionChange(
                                              field.id,
                                              optionIndex,
                                              e.target.value,
                                            )
                                          }
                                          placeholder={`Opción ${optionIndex + 1}`}
                                          className="flex-1 block border border-gray-300 rounded-md shadow-sm py-1 px-2 text-xs sm:text-sm focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500"
                                        />
                                        {field.options &&
                                          field.options.length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleRemoveOption(
                                                  field.id,
                                                  optionIndex,
                                                )
                                              }
                                              className="text-red-500 hover:text-red-700 p-0.5"
                                            >
                                              <TrashIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                            </button>
                                          )}
                                      </div>

                                      {/* Precio opcional */}
                                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                        <label className="text-[10px] sm:text-xs text-gray-600">
                                          Precio adicional:
                                        </label>
                                        <div className="relative">
                                          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                            <span className="text-gray-500 text-[10px] sm:text-xs">
                                              $
                                            </span>
                                          </div>
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={option.price || ""}
                                            onChange={(e) =>
                                              handleOptionPriceChange(
                                                field.id,
                                                optionIndex,
                                                e.target.value === ""
                                                  ? 0
                                                  : parseFloat(
                                                      e.target.value,
                                                    ) || 0,
                                              )
                                            }
                                            placeholder="0.00"
                                            className="w-16 sm:w-20 pl-4 sm:pl-5 pr-1.5 sm:pr-2 py-1 border border-gray-300 rounded-md shadow-sm text-[10px] sm:text-xs focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Tiempo de preparación — solo visible con Pick & Go activo */}
            {isPickNGoEnabled && (
              <div className="pt-3 sm:pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setPrepTimeExpanded((v) => !v)}
                  className="w-full flex items-center justify-between mb-2 sm:mb-3 group"
                >
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    Tiempo de preparación
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${prepTimeExpanded ? "rotate-180" : ""}`}
                  />
                </button>

                {prepTimeExpanded && (
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-2">
                      Tiempo estimado para preparar este platillo (opcional).
                    </p>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        min="1"
                        max="120"
                        step="1"
                        value={prepTimeMinutes}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "") {
                            setPrepTimeMinutes("");
                          } else {
                            const n = parseInt(v);
                            if (!isNaN(n) && n >= 1 && n <= 120)
                              setPrepTimeMinutes(n);
                          }
                        }}
                        placeholder="Ej: 15"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-14 focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">min</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 sm:pt-4 border-t border-gray-200">
              <label
                htmlFor="discount"
                className="block text-xs sm:text-sm font-medium text-gray-700"
              >
                Descuento (%)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  name="discount"
                  id="discount"
                  min="0"
                  max="100"
                  step="1"
                  value={values.discount || 0}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 text-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">%</span>
                </div>
              </div>
              <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
                Porcentaje de descuento aplicado al precio original (0-100%)
              </p>
            </div>

            <div>
              <label
                htmlFor="price"
                className="block text-xs sm:text-sm font-medium text-gray-700"
              >
                Precio
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="price"
                  id="price"
                  required
                  min="0"
                  step="0.01"
                  value={values.price || ""}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="block w-full pl-7 pr-12 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 text-sm"
                />
              </div>
              {Number(values.price) > 0 && (
                <div className="mt-2 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                  <p className="text-xs sm:text-sm text-gray-700">
                    <span className="font-medium">Precio + IVA (16%):</span>
                    <span className="ml-1 sm:ml-2 font-semibold">
                      ${(Number(values.price) * 1.16).toFixed(2)}
                    </span>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-700">
                    <span className="font-medium">Con descuento:</span>
                    <span className="ml-1 sm:ml-2 font-semibold text-custom-green-600">
                      $
                      {(
                        Number(values.price) *
                        1.16 *
                        (1 - (Number(values.discount) || 0) / 100)
                      ).toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
            </div>
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
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-3 sm:px-4 py-2 bg-custom-green-600 text-xs sm:text-sm font-medium text-white hover:bg-custom-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500"
            >
              {initialValues.id ? "Guardar" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default MenuItemForm;
