import React, { useEffect, useState } from "react";
import { XIcon, UploadIcon, PlusIcon, TrashIcon } from "lucide-react";
import { ImageUploadService } from "../services/imageUploadService";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";

interface CustomField {
  id: string;
  name: string;
  type: "dropdown" | "checkboxes" | "dropdown-quantity";
  required: boolean;
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
    discount?: number;
    category: string;
    image: string;
    customFields?: CustomField[];
  };
  onSubmit: (values: any) => void;
  onCancel: () => void;
  preselectedCategory?: string;
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
  },
  onSubmit,
  onCancel,
  preselectedCategory,
}) => {
  const { user } = useUser();
  // Si estamos editando (tiene id), mostrar el precio sin IVA (dividir entre 1.16)
  const displayPrice = initialValues.id ? initialValues.price / 1.16 : initialValues.price;

  const [values, setValues] = useState({
    ...initialValues,
    price: displayPrice,
    category: preselectedCategory || initialValues.category,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>(
    initialValues.customFields || []
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  // Set initial image preview if an image URL exists
  useEffect(() => {
    if (initialValues.image && initialValues.image.startsWith("http")) {
      setImagePreview(initialValues.image);
    }
  }, [initialValues.image]);
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]:
        name === "price" || name === "discount" ? parseFloat(value) : value,
    });
  };
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast.error("Debes estar autenticado para subir imágenes", {
        duration: 3000,
        icon: '🔐'
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
          0.92  // Mayor calidad para imágenes de comida
        );

        // Upload to storage
        const publicUrl = await ImageUploadService.updateImage(
          resizedFile,
          "item",
          values.image // Delete old image if exists
        );

        // Update form values with the public URL
        setValues({
          ...values,
          image: publicUrl,
        });

        // Update preview to the final URL
        setImagePreview(publicUrl);

        console.log("✅ Item image uploaded successfully:", publicUrl);
        toast.success("Imagen subida correctamente", {
          duration: 2000,
          icon: '📷'
        });
      } catch (error) {
        console.error("❌ Error uploading item image:", error);
        toast.error("Error al subir la imagen. Por favor intenta de nuevo.", {
          duration: 4000,
          icon: '⚠️'
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
        field.id === id ? { ...field, name } : field
      )
    );
  };

  const handleFieldTypeChange = (id: string, type: CustomField["type"]) => {
    setCustomFields(
      customFields.map((field) =>
        field.id === id
          ? {
              ...field,
              type,
              options: [
                {
                  id: Date.now().toString(),
                  name: "",
                  price: 0,
                },
              ],
            }
          : field
      )
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
          : field
      )
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
          : field
      )
    );
  };

  const handleOptionChange = (
    fieldId: string,
    optionIndex: number,
    value: string
  ) => {
    setCustomFields(
      customFields.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              options: field.options.map((opt, i) =>
                i === optionIndex ? { ...opt, name: value } : opt
              ),
            }
          : field
      )
    );
  };

  const handleOptionPriceChange = (
    fieldId: string,
    optionIndex: number,
    price: number
  ) => {
    setCustomFields(
      customFields.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              options: field.options.map((opt, i) =>
                i === optionIndex ? { ...opt, price: price } : opt
              ),
            }
          : field
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (initialValues.id) {
      toast.success(`Actualizando "${values.name}"`, {
        duration: 2000,
        icon: '✏️'
      });
    } else {
      toast.success(`Guardando platillo "${values.name}"`, {
        duration: 2000,
        icon: '💾'
      });
    }

    // Siempre aplicar el 16% de IVA al precio antes de guardar en BD
    const priceWithTax = values.price * 1.16;
    onSubmit({ ...values, price: priceWithTax, customFields });
  };
  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center py-8">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]"
        onClick={onCancel}
      ></div>
      <div className="relative bg-white rounded-lg max-w-2xl w-full mx-auto p-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            {initialValues.id ? "Editar platillo" : "Agregar platillo"}
          </h2>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500"
            onClick={onCancel}
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="image"
                className="block text-sm font-medium text-gray-700"
              >
                Imagen del platillo
              </label>
              <div className="mt-1 flex items-center">
                <div className="flex-shrink-0 relative">
                  {imagePreview ? (
                    <div className="h-24 w-24 overflow-hidden rounded-md">
                      <img
                        src={imagePreview}
                        alt="Vista previa"
                        className="h-24 w-24 object-cover img-food-quality rounded-md"
                        loading="eager"
                        decoding="async"
                      />
                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
                          <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400">
                      {isUploadingImage ? (
                        <div className="h-6 w-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <UploadIcon className="h-8 w-8" />
                      )}
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1">
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
                      className={`cursor-pointer py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 ${isUploadingImage ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isUploadingImage ? "Subiendo..." : "Seleccionar imagen"}
                    </label>
                    {isUploadingImage && (
                      <input type="file" disabled className="sr-only" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">JPG, PNG o WEBP.</p>
                  {imageFile && (
                    <p className="mt-1 text-xs text-gray-700">
                      {imageFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
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
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
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
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 sm:text-sm"
              />
            </div>

            {/* Personalización Section */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Personalización
                </label>
                <button
                  type="button"
                  onClick={handleAddField}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-custom-green-600 hover:bg-custom-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Field
                </button>
              </div>

              {customFields.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  No hay campos de personalización. Haz clic en "Add Field" para
                  agregar uno.
                </p>
              ) : (
                <div className="space-y-4">
                  {customFields.map((field, fieldIndex) => (
                    <div
                      key={field.id}
                      className="p-3 border border-gray-200 rounded-md bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-gray-500">
                          Campo {fieldIndex + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(field.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Nombre del campo
                          </label>
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) =>
                              handleFieldNameChange(field.id, e.target.value)
                            }
                            placeholder="Ej: Tamaño, Extras, etc."
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 text-sm focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Tipo de respuesta
                          </label>
                          <select
                            value={field.type}
                            onChange={(e) =>
                              handleFieldTypeChange(
                                field.id,
                                e.target.value as CustomField["type"]
                              )
                            }
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2 text-sm focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500"
                          >
                            <option value="dropdown">Lista Desplegable</option>
                            <option value="checkboxes">
                              Opciones Casillas
                            </option>
                            <option value="dropdown-quantity">
                              Lista desplegable con cantidad
                            </option>
                          </select>
                        </div>

                        {/* Options for dropdown and checkboxes */}
                        {(field.type === "dropdown" ||
                          field.type === "checkboxes" ||
                          field.type === "dropdown-quantity") && (
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-xs font-medium text-gray-700">
                                Opciones
                              </label>
                              <button
                                type="button"
                                onClick={() => handleAddOption(field.id)}
                                className="text-xs text-custom-green-600 hover:text-custom-green-700"
                              >
                                + Agregar opción
                              </button>
                            </div>
                            <div className="space-y-2">
                              {field.options.map((option, optionIndex) => (
                                <div
                                  key={optionIndex}
                                  className="border border-gray-200 rounded-md p-2 bg-gray-50"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <input
                                      type="text"
                                      value={option.name}
                                      onChange={(e) =>
                                        handleOptionChange(
                                          field.id,
                                          optionIndex,
                                          e.target.value
                                        )
                                      }
                                      placeholder={`Opción ${optionIndex + 1}`}
                                      className="flex-1 block border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500"
                                    />
                                    {field.options &&
                                      field.options.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveOption(
                                              field.id,
                                              optionIndex
                                            )
                                          }
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <TrashIcon className="h-3.5 w-3.5" />
                                        </button>
                                      )}
                                  </div>

                                  {/* Precio opcional */}
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-600">
                                      Precio adicional (opcional):
                                    </label>
                                    <div className="relative">
                                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                        <span className="text-gray-500 text-xs">
                                          $
                                        </span>
                                      </div>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={option.price}
                                        onChange={(e) =>
                                          handleOptionPriceChange(
                                            field.id,
                                            optionIndex,
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        placeholder="0.00"
                                        className="w-20 pl-5 pr-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500"
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
            </div>

            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700"
              >
                Precio
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="price"
                  id="price"
                  required
                  min="0"
                  step="0.01"
                  value={values.price}
                  onChange={handleChange}
                  className="block w-full pl-7 pr-12 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 sm:text-sm"
                />
              </div>
              {values.price > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Precio mas IVA (16%):</span>
                    <span className="ml-2 font-semibol">
                      ${(values.price * 1.16).toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
            </div>
            <div>
              <label
                htmlFor="discount"
                className="block text-sm font-medium text-gray-700"
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
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 sm:text-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Porcentaje de descuento aplicado al precio original (0-100%)
              </p>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="submit"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-custom-green-600 text-base font-medium text-white hover:bg-custom-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 sm:col-start-2 sm:text-sm"
            >
              {initialValues.id ? "Guardar cambios" : "Agregar platillo"}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              onClick={onCancel}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default MenuItemForm;
