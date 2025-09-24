import React, { useEffect, useState } from 'react';
import { XIcon, UploadIcon } from 'lucide-react';
interface MenuItemFormProps {
  initialValues?: {
    id?: number;
    name: string;
    description: string;
    price: number;
    discount?: number;
    category: string;
    image: string;
  };
  onSubmit: (values: any) => void;
  onCancel: () => void;
  preselectedCategory?: string;
}
const MenuItemForm: React.FC<MenuItemFormProps> = ({
  initialValues = {
    name: '',
    description: '',
    price: 0,
    discount: 0,
    category: '',
    image: ''
  },
  onSubmit,
  onCancel,
  preselectedCategory
}) => {
  const [values, setValues] = useState({
    ...initialValues,
    category: preselectedCategory || initialValues.category
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // Set initial image preview if an image URL exists
  useEffect(() => {
    if (initialValues.image && initialValues.image.startsWith('http')) {
      setImagePreview(initialValues.image);
    }
  }, [initialValues.image]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {
      name,
      value
    } = e.target;
    setValues({
      ...values,
      [name]: name === 'price' || name === 'discount' ? parseFloat(value) : value
    });
  };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setValues({
          ...values,
          image: result // Store the base64 image data in the form values
        });
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };
  return <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]" onClick={onCancel}></div>
      <div className="relative bg-white rounded-lg max-w-md w-full mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            {initialValues.id ? 'Editar platillo' : 'Agregar platillo'}
          </h2>
          <button type="button" className="text-gray-400 hover:text-gray-500" onClick={onCancel}>
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input type="text" name="name" id="name" required value={values.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea name="description" id="description" rows={3} required value={values.description} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Precio
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input type="number" name="price" id="price" required min="0" step="0.01" value={values.price} onChange={handleChange} className="block w-full pl-7 pr-12 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 sm:text-sm" />
              </div>
            </div>
            <div>
              <label htmlFor="discount" className="block text-sm font-medium text-gray-700">
                Descuento (%)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input type="number" name="discount" id="discount" min="0" max="100" step="1" value={values.discount || 0} onChange={handleChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 sm:text-sm" />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Porcentaje de descuento aplicado al precio original (0-100%)
              </p>
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Categoría
              </label>
              <select id="category" name="category" required value={values.category} onChange={handleChange} className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 sm:text-sm">
                <option value="">Seleccionar categoría</option>
                {/* Dynamically generate options from available sections */}
                {JSON.parse(localStorage.getItem('sections') || '[]').map(section => <option key={section} value={section}>
                      {section}
                    </option>)}
              </select>
            </div>
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                Imagen del platillo
              </label>
              <div className="mt-1 flex items-center">
                <div className="flex-shrink-0">
                  {imagePreview ? <div className="h-24 w-24 overflow-hidden rounded-md">
                      <img src={imagePreview} alt="Vista previa" className="h-24 w-24 object-cover" />
                    </div> : <div className="h-24 w-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400">
                      <UploadIcon className="h-8 w-8" />
                    </div>}
                </div>
                <div className="ml-4 flex-1">
                  <div className="relative">
                    <input type="file" name="imageFile" id="imageFile" accept="image/*" onChange={handleImageChange} className="sr-only" />
                    <label htmlFor="imageFile" className="cursor-pointer py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500">
                      Seleccionar imagen
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    JPG, PNG o GIF. Máximo 5MB.
                  </p>
                  {imageFile && <p className="mt-1 text-xs text-gray-700">
                      {imageFile.name}
                    </p>}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-custom-green-600 text-base font-medium text-white hover:bg-custom-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 sm:col-start-2 sm:text-sm">
              {initialValues.id ? 'Guardar cambios' : 'Agregar platillo'}
            </button>
            <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 sm:mt-0 sm:col-start-1 sm:text-sm" onClick={onCancel}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>;
};
export default MenuItemForm;