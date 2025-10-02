import React, { useEffect, useState } from 'react';
import { PlusIcon, FilterIcon } from 'lucide-react';
import MenuItemCard from '../components/MenuItemCard';
import MenuItemForm from '../components/MenuItemForm';
import SectionHeader from '../components/SectionHeader';
import SectionForm from '../components/SectionForm';
import MobileMenuPreview from '../components/MobileMenuPreview';
import RestaurantHeader from '../components/RestaurantHeader';
import menuApiService, { MenuSection, MenuItem } from '../services/menuApi';
// Sample data for menu items with updated categories and weights for Hot Dawgs
// const initialMenuItems = [{
//   id: 1,
//   name: 'Nachos Supremos',
//   description: 'Nachos con queso fundido, guacamole, pico de gallo y crema agria.',
//   price: 8.99,
//   discount: 0,
//   category: 'Entradas',
//   image: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
// }, {
//   id: 2,
//   name: 'Holy Classic',
//   description: 'Hamburguesa clásica con queso cheddar, lechuga, tomate y salsa especial.',
//   price: 12.99,
//   discount: 15,
//   category: 'Holy Burgers',
//   image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
// }, {
//   id: 3,
//   name: 'Papas Fritas',
//   description: 'Papas fritas crujientes con sal marina.',
//   price: 4.99,
//   discount: 0,
//   category: 'Siders',
//   image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
// }, {
//   id: 4,
//   name: 'Mini Burger',
//   description: 'Hamburguesa pequeña con queso para niños.',
//   price: 7.99,
//   discount: 0,
//   category: 'Holy Kids',
//   image: 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
// }, {
//   id: 5,
//   name: 'César con Pollo',
//   description: 'Ensalada César con pollo a la parrilla, crutones y aderezo casero.',
//   price: 10.99,
//   discount: 0,
//   category: 'Ensaladas',
//   image: 'https://images.unsplash.com/photo-1512852939750-1305098529bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
// }, {
//   id: 7,
//   name: 'Wrap de Pollo',
//   description: 'Wrap de pollo a la parrilla con vegetales frescos y aderezo ligero.',
//   price: 9.99,
//   discount: 0,
//   category: 'Holy Fit',
//   image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
// }, {
//   id: 8,
//   name: 'Malteada de Chocolate',
//   description: 'Malteada cremosa de chocolate con crema batida.',
//   price: 5.99,
//   discount: 0,
//   category: 'Malteadas',
//   image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
// }, {
//   id: 9,
//   name: 'Brownie con Helado',
//   description: 'Brownie caliente con helado de vainilla y salsa de chocolate.',
//   price: 6.99,
//   discount: 0,
//   category: 'Postres',
//   image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
// }];
// Default sections
// const defaultSections = ['Entradas', 'Holy Burgers', 'Siders', 'Holy Kids', 'Ensaladas', 'Holy Fit', 'Malteadas', 'Postres'];

const MenuManagement = () => {
  const [isHydrated, setIsHydrated] = useState(false);

  // State for API data
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: 'Mi Restaurante',
    description: 'Descripción de tu restaurante - agrega información sobre tu cocina, especialidades y ambiente',
    bannerImage: '',
    logoImage: ''
  });

  // Load data from API
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Loading sections and items from API...');

      // Load sections and items in parallel
      const [sectionsData, itemsData] = await Promise.all([
        menuApiService.sections.getAll(),
        menuApiService.items.getAll()
      ]);

      setSections(sectionsData);
      setMenuItems(itemsData);

      console.log('✅ Data loaded successfully:', {
        sections: sectionsData,
        items: itemsData.length
      });

    } catch (error) {
      console.error('❌ Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Load restaurant info from localStorage (keep this for now)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedInfo = localStorage.getItem('restaurantInfo');
      if (savedInfo) {
        setRestaurantInfo(JSON.parse(savedInfo));
      }
      setIsHydrated(true);

      // Load data from API
      loadData();
    }
  }, []);

  const [showItemForm, setShowItemForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  // Save restaurant info to localStorage (keep this for now)
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem('restaurantInfo', JSON.stringify(restaurantInfo));
    }
  }, [restaurantInfo, isHydrated]);

  // Get all section names for compatibility with existing components
  const allCategories = sections.map(s => s.name);
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
      // Find section name for compatibility with MenuItemForm
      const section = sections.find(s => s.id === itemToEdit.section_id);

      // Validate and parse custom_fields to ensure it's always an array
      let customFields = [];
      try {
        if (Array.isArray(itemToEdit.custom_fields)) {
          customFields = itemToEdit.custom_fields;
        } else if (typeof itemToEdit.custom_fields === 'string') {
          customFields = JSON.parse(itemToEdit.custom_fields);
        } else if (itemToEdit.custom_fields === null || itemToEdit.custom_fields === undefined) {
          customFields = [];
        }
      } catch (error) {
        console.warn('Error parsing custom_fields in frontend:', error);
        customFields = [];
      }

      // Adapt the item data for the form
      const adaptedItem = {
        ...itemToEdit,
        category: section?.name || '',
        image: itemToEdit.image_url || '',
        customFields: customFields
      };

      setCurrentItem(adaptedItem);
      setShowItemForm(true);
    }
  };
  const handleDeleteClick = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este platillo?')) {
      try {
        console.log('🔍 Deleting item:', id);
        await menuApiService.items.delete(id);

        // Reload data to get updated items
        await loadData();

        console.log('✅ Item deleted successfully');
      } catch (error) {
        console.error('❌ Error deleting item:', error);
        setError(error instanceof Error ? error.message : 'Failed to delete item');
      }
    }
  };
  const handleItemFormSubmit = async (values: any) => {
    try {
      console.log('🔍 Submitting item:', values);

      // Find section ID by name (for compatibility with existing MenuItemForm)
      const section = sections.find(s => s.name === values.category);
      if (!section) {
        throw new Error(`Section "${values.category}" not found`);
      }

      // Validate and ensure custom_fields is an array
      let customFields = [];
      try {
        if (Array.isArray(values.customFields)) {
          customFields = values.customFields;
        } else if (typeof values.customFields === 'string') {
          customFields = JSON.parse(values.customFields);
        } else if (values.customFields === null || values.customFields === undefined) {
          customFields = [];
        }
      } catch (error) {
        console.warn('Error parsing customFields in form submission:', error);
        customFields = [];
      }

      // Prepare item data for API
      const itemData = {
        section_id: section.id,
        name: values.name,
        description: values.description,
        image_url: values.image,
        price: values.price,
        discount: values.discount || 0,
        custom_fields: customFields,
        display_order: 0
      };

      if (values.id) {
        // Update existing item
        console.log('🔍 Updating item:', values.id);
        await menuApiService.items.update(values.id, itemData);
      } else {
        // Create new item
        console.log('🔍 Creating new item');
        await menuApiService.items.create(itemData);
      }

      // Reload data to get updated items
      await loadData();

      // Close the form
      setShowItemForm(false);

      console.log('✅ Item saved successfully');
    } catch (error) {
      console.error('❌ Error saving item:', error);
      setError(error instanceof Error ? error.message : 'Failed to save item');
    }
  };
  const handleSectionFormSubmit = async (updatedSectionNames: string[]) => {
    try {
      console.log('🔍 Updating sections:', updatedSectionNames);

      // For now, we'll create new sections for any that don't exist
      // This is a simplified implementation - you might want to enhance this
      const currentSectionNames = sections.map(s => s.name);
      const newSectionNames = updatedSectionNames.filter(name => !currentSectionNames.includes(name));

      // Create new sections
      for (const name of newSectionNames) {
        await menuApiService.sections.create({
          name,
          display_order: sections.length + newSectionNames.indexOf(name)
        });
      }

      // Reload data to get updated sections
      await loadData();

      // Close the form
      setShowSectionForm(false);

      console.log('✅ Sections updated successfully');
    } catch (error) {
      console.error('❌ Error updating sections:', error);
      setError(error instanceof Error ? error.message : 'Failed to update sections');
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
  const filteredItems = filterCategory ? menuItems.filter(item => {
    const section = sections.find(s => s.id === item.section_id);
    return section?.name === filterCategory;
  }) : menuItems;

  // Group items by category - use section names from the database
  const itemsByCategory = sections.reduce((acc, section) => {
    const items = filteredItems.filter(item => item.section_id === section.id);
    acc[section.name] = items;
    return acc;
  }, {} as Record<string, MenuItem[]>);
  // Show loading state
  if (!isHydrated || loading) {
    return <div className="w-full">
      {/* Restaurant Header Section */}
      <RestaurantHeader
        restaurantName={restaurantInfo.name}
        bannerImage={restaurantInfo.bannerImage}
        logoImage={restaurantInfo.logoImage}
        onUpdateName={() => {}}
        onUpdateBanner={() => {}}
        onUpdateLogo={() => {}}
        onAddSectionClick={() => {}}
        onViewMenuClick={() => {}}
      />
      <div className="mt-6">
        <div className="text-center py-12">
          <p className="text-gray-500">
            {!isHydrated ? 'Iniciando...' : 'Cargando datos del menú...'}
          </p>
        </div>
      </div>
    </div>;
  }

  // Show error state
  if (error) {
    return <div className="w-full">
      <RestaurantHeader
        restaurantName={restaurantInfo.name}
        bannerImage={restaurantInfo.bannerImage}
        logoImage={restaurantInfo.logoImage}
        onUpdateName={() => {}}
        onUpdateBanner={() => {}}
        onUpdateLogo={() => {}}
        onAddSectionClick={() => {}}
        onViewMenuClick={() => {}}
      />
      <div className="mt-6">
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-red-600 font-medium">Error al cargar datos</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
            <button
              onClick={loadData}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
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