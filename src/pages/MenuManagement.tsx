import React, { useEffect, useState } from 'react';
import { PlusIcon, FilterIcon } from 'lucide-react';
import MenuItemCard from '../components/MenuItemCard';
import MenuItemForm from '../components/MenuItemForm';
import SectionHeader from '../components/SectionHeader';
import SectionForm from '../components/SectionForm';
import MobileMenuPreview from '../components/MobileMenuPreview';
import RestaurantHeader from '../components/RestaurantHeader';
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
  const [isHydrated, setIsHydrated] = useState(false);

  // Use localStorage to persist sections and menu items
  const [menuItems, setMenuItems] = useState(initialMenuItems);
  const [sections, setSections] = useState(defaultSections);
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: 'Mi Restaurante',
    description: 'Descripción de tu restaurante - agrega información sobre tu cocina, especialidades y ambiente',
    bannerImage: '',
    logoImage: ''
  });

  // Load from localStorage after hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedItems = localStorage.getItem('menuItems');
      if (savedItems) {
        setMenuItems(JSON.parse(savedItems));
      }

      const savedSections = localStorage.getItem('sections');
      if (savedSections) {
        setSections(JSON.parse(savedSections));
      }

      const savedInfo = localStorage.getItem('restaurantInfo');
      if (savedInfo) {
        setRestaurantInfo(JSON.parse(savedInfo));
      }

      setIsHydrated(true);
    }
  }, []);

  const [showItemForm, setShowItemForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  // Save to localStorage whenever sections, menuItems, or restaurantInfo change
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('sections', JSON.stringify(sections));
      localStorage.setItem('menuItems', JSON.stringify(menuItems));
      localStorage.setItem('restaurantInfo', JSON.stringify(restaurantInfo));
    }
  }, [sections, menuItems, restaurantInfo, isHydrated]);
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('sections', JSON.stringify(updatedSections));
    }
    // Filtramos los elementos del menú para eliminar los que pertenecen a secciones eliminadas
    const updatedMenuItems = menuItems.filter(item => updatedSections.includes(item.category));
    // Update the menu items state
    setMenuItems(updatedMenuItems);
    // También guardamos los elementos actualizados
    if (typeof window !== 'undefined') {
      localStorage.setItem('menuItems', JSON.stringify(updatedMenuItems));
    }
  };

  // Restaurant header handlers
  const handleUpdateRestaurantName = (name: string) => {
    setRestaurantInfo(prev => ({ ...prev, name }));
  };

  const handleUpdateBanner = (bannerImage: string) => {
    setRestaurantInfo(prev => ({ ...prev, bannerImage }));
  };

  const handleUpdateLogo = (logoImage: string) => {
    setRestaurantInfo(prev => ({ ...prev, logoImage }));
  };
  // Filter items by category if filter is set
  const filteredItems = filterCategory ? menuItems.filter(item => item.category === filterCategory) : menuItems;
  // Group items by category - only use categories from the sections state
  const itemsByCategory = sections.reduce((acc, category) => {
    const items = filteredItems.filter(item => item.category === category);
    acc[category] = items;
    return acc;
  }, {} as Record<string, typeof menuItems>);
  if (!isHydrated) {
    return <div className="w-full">
      {/* Restaurant Header Section */}
      <RestaurantHeader
        restaurantName="Mi Restaurante"
        bannerImage=""
        logoImage=""
        onUpdateName={() => {}}
        onUpdateBanner={() => {}}
        onUpdateLogo={() => {}}
        onAddSectionClick={() => {}}
        onViewMenuClick={() => {}}
      />
      <div className="mt-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    </div>;
  }

  return <div className="w-full">
      {/* Restaurant Header Section */}
      <RestaurantHeader
        restaurantName={restaurantInfo.name}
        bannerImage={restaurantInfo.bannerImage}
        logoImage={restaurantInfo.logoImage}
        onUpdateName={handleUpdateRestaurantName}
        onUpdateBanner={handleUpdateBanner}
        onUpdateLogo={handleUpdateLogo}
        onAddSectionClick={handleAddSectionClick}
        onViewMenuClick={() => setShowMobilePreview(true)}
      />

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