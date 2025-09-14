import React, { useEffect, useState } from 'react';
import { PlusIcon, FilterIcon } from 'lucide-react';
import MenuItemCard from '../components/MenuItemCard';
import MenuItemForm from '../components/MenuItemForm';
import SectionHeader from '../components/SectionHeader';
import SectionForm from '../components/SectionForm';
import MobileMenuPreview from '../components/MobileMenuPreview';
// Sample data for menu items with updated categories and weights for Hot Dawgs
const initialMenuItems = [{
  id: 1,
  name: 'Nachos Supremos',
  description: 'Nachos con queso fundido, guacamole, pico de gallo y crema agria.',
  price: 8.99,
  discount: 0,
  category: 'Entradas',
  image: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
}, {
  id: 2,
  name: 'Holy Classic',
  description: 'Hamburguesa clásica con queso cheddar, lechuga, tomate y salsa especial.',
  price: 12.99,
  discount: 15,
  category: 'Holy Burgers',
  image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
}, {
  id: 3,
  name: 'Papas Fritas',
  description: 'Papas fritas crujientes con sal marina.',
  price: 4.99,
  discount: 0,
  category: 'Siders',
  image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
}, {
  id: 4,
  name: 'Mini Burger',
  description: 'Hamburguesa pequeña con queso para niños.',
  price: 7.99,
  discount: 0,
  category: 'Holy Kids',
  image: 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
}, {
  id: 5,
  name: 'César con Pollo',
  description: 'Ensalada César con pollo a la parrilla, crutones y aderezo casero.',
  price: 10.99,
  discount: 0,
  category: 'Ensaladas',
  image: 'https://images.unsplash.com/photo-1512852939750-1305098529bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
}, {
  id: 7,
  name: 'Wrap de Pollo',
  description: 'Wrap de pollo a la parrilla con vegetales frescos y aderezo ligero.',
  price: 9.99,
  discount: 0,
  category: 'Holy Fit',
  image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
}, {
  id: 8,
  name: 'Malteada de Chocolate',
  description: 'Malteada cremosa de chocolate con crema batida.',
  price: 5.99,
  discount: 0,
  category: 'Malteadas',
  image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
}, {
  id: 9,
  name: 'Brownie con Helado',
  description: 'Brownie caliente con helado de vainilla y salsa de chocolate.',
  price: 6.99,
  discount: 0,
  category: 'Postres',
  image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
}];
// Default sections
const defaultSections = ['Entradas', 'Holy Burgers', 'Siders', 'Holy Kids', 'Ensaladas', 'Holy Fit', 'Malteadas', 'Postres'];
const MenuManagement = () => {
  // Use localStorage to persist sections and menu items
  const [menuItems, setMenuItems] = useState(() => {
    const savedItems = localStorage.getItem('menuItems');
    return savedItems ? JSON.parse(savedItems) : initialMenuItems;
  });
  // Modificamos esta parte para que no recalcule las secciones basadas en los items
  const [sections, setSections] = useState(() => {
    const savedSections = localStorage.getItem('sections');
    // Si hay secciones guardadas, usamos esas exactamente como están
    if (savedSections) {
      return JSON.parse(savedSections);
    }
    // Solo si no hay secciones guardadas, usamos las predeterminadas
    return defaultSections;
  });
  const [showItemForm, setShowItemForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  // Save to localStorage whenever sections or menuItems change
  useEffect(() => {
    localStorage.setItem('sections', JSON.stringify(sections));
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
  }, [sections, menuItems]);
  // Get all unique categories from the sections state only
  const allCategories = [...sections];
  const handleAddItemClick = (category: string) => {
    setCurrentItem(null);
    setSelectedCategory(category);
    setShowItemForm(true);
  };
  const handleAddSectionClick = () => {
    setShowSectionForm(true);
  };
  const handleEditClick = (id: number) => {
    const itemToEdit = menuItems.find(item => item.id === id);
    if (itemToEdit) {
      setCurrentItem(itemToEdit);
      setShowItemForm(true);
    }
  };
  const handleDeleteClick = (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este platillo?')) {
      setMenuItems(menuItems.filter(item => item.id !== id));
    }
  };
  const handleItemFormSubmit = (values: any) => {
    if (values.id) {
      // Update existing item
      setMenuItems(menuItems.map(item => item.id === values.id ? values : item));
    } else {
      // Add new item with a new ID
      const newId = Math.max(...menuItems.map(item => item.id), 0) + 1;
      setMenuItems([...menuItems, {
        ...values,
        id: newId
      }]);
    }
    setShowItemForm(false);
  };
  const handleSectionFormSubmit = (updatedSections: string[]) => {
    // Update sections
    setSections(updatedSections);
    // Close the form
    setShowSectionForm(false);
    // Guardamos inmediatamente para asegurar la persistencia
    localStorage.setItem('sections', JSON.stringify(updatedSections));
    // Filtramos los elementos del menú para eliminar los que pertenecen a secciones eliminadas
    const updatedMenuItems = menuItems.filter(item => updatedSections.includes(item.category));
    // Update the menu items state
    setMenuItems(updatedMenuItems);
    // También guardamos los elementos actualizados
    localStorage.setItem('menuItems', JSON.stringify(updatedMenuItems));
  };
  // Filter items by category if filter is set
  const filteredItems = filterCategory ? menuItems.filter(item => item.category === filterCategory) : menuItems;
  // Group items by category - only use categories from the sections state
  const itemsByCategory = sections.reduce((acc, category) => {
    const items = filteredItems.filter(item => item.category === category);
    acc[category] = items;
    return acc;
  }, {} as Record<string, typeof menuItems>);
  return <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Gestión de Menú
          </h1>
          <p className="text-sm text-gray-500">
            Administra platillos, precios y categorías de tu carta
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col space-y-2">
          <button type="button" onClick={handleAddSectionClick} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-custom-green-600 hover:bg-custom-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500">
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Administrar sección
          </button>
          <button type="button" onClick={() => setShowMobilePreview(true)} className="inline-flex items-center justify-center px-4 py-2 border border-custom-green-600 text-sm font-medium rounded-md shadow-sm text-custom-green-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500">
            Ver menu
          </button>
        </div>
      </div>
      <div className="mt-6">
        {Object.keys(itemsByCategory).length === 0 ? <div className="text-center py-12">
            <p className="text-gray-500">
              No hay platillos en esta categoría. Agrega una sección y platillos
              para comenzar.
            </p>
          </div> : Object.entries(itemsByCategory).map(([category, items]) => <div key={category} className="mb-8">
              <SectionHeader title={category} />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(item => <MenuItemCard key={item.id} id={item.id} name={item.name} description={item.description} price={item.price} discount={item.discount} category={item.category} image={item.image} onEdit={handleEditClick} onDelete={handleDeleteClick} />)}
                {/* Botón para agregar platillo en esta sección */}
                <button onClick={() => handleAddItemClick(category)} className="bg-white overflow-hidden shadow rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center h-48 hover:bg-gray-50 transition-colors">
                  <div className="text-center">
                    <PlusIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <span className="mt-2 block text-sm font-medium text-gray-500">
                      Agregar platillo
                    </span>
                  </div>
                </button>
                {items.length === 0 && <div className="col-span-full py-4 text-center text-gray-500">
                    No hay platillos en esta sección. Haz clic en "Agregar
                    platillo" para comenzar.
                  </div>}
              </div>
            </div>)}
      </div>
      {showItemForm && <MenuItemForm initialValues={currentItem || undefined} onSubmit={handleItemFormSubmit} onCancel={() => setShowItemForm(false)} preselectedCategory={selectedCategory} />}
      {showSectionForm && <SectionForm sections={sections} onSubmit={handleSectionFormSubmit} onCancel={() => setShowSectionForm(false)} />}
      {showMobilePreview && <MobileMenuPreview menuItems={menuItems} onClose={() => setShowMobilePreview(false)} />}
    </div>;
};
export default MenuManagement;