import React, { useEffect, useState } from 'react';
import { PlusIcon, FilterIcon } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import { useRestaurant } from '../contexts/RestaurantContext';
import MenuItemCard from '../components/MenuItemCard';
import MenuItemForm from '../components/MenuItemForm';
import SectionHeader from '../components/SectionHeader';
import SectionForm from '../components/SectionForm';
import MobileMenuPreview from '../components/MobileMenuPreview';
import RestaurantHeader from '../components/RestaurantHeader';
import { useMenuAdminPortalApi } from '../services/menuAdminPortalApi';
import { MenuSection, MenuItem } from '../services/adminPortalApi';

const MenuManagement = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const { user } = useUser();
  const { restaurant, loading: restaurantLoading, updateRestaurant, createRestaurant } = useRestaurant();
  const menuApi = useMenuAdminPortalApi();

  // State for API data
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user || !restaurant) {
      console.log('⏳ Waiting for user and restaurant data...');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Loading sections and items for restaurant:', restaurant.name, 'user:', user.id);

      try {
        const [sectionsData, itemsData] = await Promise.all([
          menuApi.sections.getAll(),
          menuApi.items.getAll()
        ]);

        // Sort sections by display_order to ensure proper ordering
        const sortedSections = sectionsData.sort((a, b) => a.display_order - b.display_order);
        setSections(sortedSections);
        setMenuItems(itemsData);

        console.log('✅ Data loaded from backend API:', {
          sections: sectionsData,
          items: itemsData.length
        });

      } catch (apiError) {
        const userSectionsKey = `sections_${user.id}`;
        const userItemsKey = `items_${user.id}`;

        const savedSections = localStorage.getItem(userSectionsKey);
        const savedItems = localStorage.getItem(userItemsKey);

        if (savedSections && savedItems) {
          const sectionsData = JSON.parse(savedSections);
          const itemsData = JSON.parse(savedItems);

          const sortedSections = sectionsData.sort((a, b) => a.display_order - b.display_order);
          setSections(sortedSections);
          setMenuItems(itemsData);

        } else {
          setSections([]);
          setMenuItems([]);

          console.log('✅ Initialized with empty data for new user');
        }
      }

    } catch (error) {
      console.error('❌ Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (isHydrated && user && restaurant && !restaurantLoading) {
      loadData();
    }
  }, [isHydrated, user, restaurant, restaurantLoading]);

  const [showItemForm, setShowItemForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

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
      const section = sections.find(s => s.id === itemToEdit.section_id);

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
        customFields = [];
      }

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
        await menuApi.items.delete(id);
        await loadData();
      } catch (error) {
        console.error('❌ Error deleting item:', error);
        setError(error instanceof Error ? error.message : 'Failed to delete item');
      }
    }
  };
  const handleItemFormSubmit = async (values: any) => {
    try {
      console.log('🔍 Submitting item:', values);

      let sectionId: number;

      if (values.id) {
        const currentItem = menuItems.find(item => item.id === values.id);
        const currentSection = sections.find(s => s.id === currentItem?.section_id);

        if (currentSection && currentSection.name === values.category) {
          sectionId = currentSection.id;
        } else {
          const newSection = sections.find(s => s.name === values.category);
          if (!newSection) {
            throw new Error(`Section "${values.category}" not found`);
          }
          sectionId = newSection.id;
        }
      } else {
        // For new items: find section by name
        const section = sections.find(s => s.name === values.category);
        if (!section) {
          throw new Error(`Section "${values.category}" not found`);
        }
        sectionId = section.id;
      }

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

      const itemData = {
        section_id: sectionId,
        name: values.name,
        description: values.description,
        image_url: values.image,
        price: values.price,
        discount: values.discount || 0,
        custom_fields: customFields,
        display_order: 0
      };

      if (values.id) {
        console.log('🔍 Updating item:', values.id);
        await menuApi.items.update(values.id, itemData);
      } else {
        await menuApi.items.create(itemData);
      }

      await loadData();

      setShowItemForm(false);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save item');
    }
  };
  const handleSectionFormSubmit = async (reorderedSections: MenuSection[], newSectionNames: string[]) => {
    const loadingToast = toast.loading('Guardando cambios...');

    try {
      // 1. Handle reordering of existing sections
      const orderChanged = reorderedSections.some((section, index) => section.display_order !== index);

      if (orderChanged) {
        // Filter out sections with invalid IDs and wrong restaurant_id
        const validSections = reorderedSections.filter(section => {
          const id = Number(section.id);
          const hasValidId = id && !isNaN(id) && id > 0 && id < 1000000000; // Real DB IDs are usually small numbers
          const belongsToRestaurant = section.restaurant_id === restaurant?.id;

          if (!hasValidId) {
            console.warn('⚠️ Skipping section with invalid/temporary ID:', section.id, 'Name:', section.name);
            return false;
          }

          if (!belongsToRestaurant) {
            console.warn('⚠️ Skipping section that doesn\'t belong to current restaurant:', section.id, 'Name:', section.name, 'Section restaurant_id:', section.restaurant_id, 'Current restaurant_id:', restaurant?.id);
            return false;
          }

          return true;
        });

        if (validSections.length === 0) {
          console.warn('⚠️ No valid sections to reorder (all have temporary IDs)');
          toast.dismiss(loadingToast);
          toast.success('Cambios guardados correctamente');
          return;
        }

        const reorderData = validSections.map((section, index) => ({
          id: Number(section.id), // Ensure it's a number
          display_order: index
        }));

        try {
          await menuApi.sections.reorder(reorderData);
        } catch (apiError) {
          console.error('❌ Failed to reorder sections:', apiError);
          toast.dismiss(loadingToast);
          toast.error('Error al reordenar secciones');
          // Update local state anyway for better UX
          const updatedSections = reorderedSections.map((section, index) => ({
            ...section,
            display_order: index
          }));
          setSections(updatedSections);
          return;
        }
      }

      // 2. Handle section deletions
      const reorderedSectionNames = reorderedSections.map(s => s.name);
      const sectionsToDelete = sections.filter(section => !reorderedSectionNames.includes(section.name));

      for (const section of sectionsToDelete) {
        try {
          console.log('🗑️ Deleting section:', section.name);
          await menuApi.sections.delete(section.id);
        } catch (apiError) {
          console.error('❌ Failed to delete section:', apiError);
          toast.dismiss(loadingToast);
          toast.error(`Error al eliminar la sección "${section.name}"`);
          const updatedSections = sections.filter(s => s.id !== section.id);
          setSections(updatedSections);

          if (user) {
            localStorage.setItem(`sections_${user.id}`, JSON.stringify(updatedSections));
          }
          return;
        }
      }

      // 3. Handle new section creation
      for (const name of newSectionNames) {
        try {
          await menuApi.sections.create({
            name,
            display_order: reorderedSections.length + newSectionNames.indexOf(name)
          });
        } catch (apiError) {
          console.error('❌ Failed to create section:', apiError);
          toast.dismiss(loadingToast);
          toast.error(`Error al crear la sección "${name}"`);
          // Fallback to localStorage if API fails
          const newSection = {
            id: Date.now() + newSectionNames.indexOf(name),
            restaurant_id: restaurant?.id || 0,
            name,
            is_active: true,
            display_order: reorderedSections.length + newSectionNames.indexOf(name),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const updatedSections = [...reorderedSections, newSection];
          setSections(updatedSections);

          if (user) {
            localStorage.setItem(`sections_${user.id}`, JSON.stringify(updatedSections));
          }
          return;
        }
      }

      await loadData();

      toast.dismiss(loadingToast);
      toast.success('Cambios guardados correctamente');

      setShowSectionForm(false);

    } catch (error) {
      console.error('❌ Error updating sections:', error);
      toast.dismiss(loadingToast);
      toast.error('Error al guardar los cambios');
      setError(error instanceof Error ? error.message : 'Failed to update sections');
    }
  };

  const handleUpdateRestaurantName = async (name: string) => {
    if (!restaurant) {
      await createRestaurant({ name });
    } else {
      updateRestaurant({ name });
    }
  };

  const handleUpdateBanner = (banner_url: string) => {
    updateRestaurant({ banner_url });
  };

  const handleUpdateLogo = (logo_url: string) => {
    updateRestaurant({ logo_url });
  };
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

  if (!isHydrated || loading || restaurantLoading || !restaurant) {
    return <div className="w-full">
      <RestaurantHeader
        restaurantName={restaurant?.name || ''}
        bannerImage={restaurant?.banner_url || ''}
        logoImage={restaurant?.logo_url || ''}
        onUpdateName={() => {}}
        onUpdateBanner={() => {}}
        onUpdateLogo={() => {}}
        onAddSectionClick={() => {}}
        onViewMenuClick={() => {}}
      />
      <div className="mt-6">
        <div className="text-center py-12">
          <p className="text-gray-500">
            {!isHydrated ? 'Iniciando...' : restaurantLoading ? 'Cargando restaurante...' : 'Cargando datos del menú...'}
          </p>
        </div>
      </div>
    </div>;
  }

  if (error) {
    return <div className="w-full">
      <RestaurantHeader
        restaurantName={restaurant?.name || ''}
        bannerImage={restaurant?.banner_url || ''}
        logoImage={restaurant?.logo_url || ''}
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
      <RestaurantHeader
        restaurantName={restaurant?.name || ''}
        bannerImage={restaurant?.banner_url || ''}
        logoImage={restaurant?.logo_url || ''}
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

              {items.map(item => <MenuItemCard key={item.id} id={item.id} name={item.name} description={item.description} price={item.price} discount={item.discount} category={sections.find(s => s.id === item.section_id)?.name || ''} image={item.image_url || ''} onEdit={handleEditClick} onDelete={handleDeleteClick} />)}

              <button onClick={() => handleAddItemClick(category)} className="bg-white overflow-hidden shadow rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center h-48 hover:bg-gray-50 transition-colors">
                <div className="text-center">
                  <PlusIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <span className="mt-2 block text-sm font-medium text-gray-500">
                    Agregar platillo
                  </span>
                </div>
              </button>
              {items.length === 0 && 
                <div className="col-span-full py-4 text-center text-gray-500">
                  No hay platillos en esta sección. Haz clic en "Agregar
                  platillo" para comenzar.
                </div>
              }
            </div>

          </div>
        )}
      </div>
      {showItemForm && <MenuItemForm initialValues={currentItem || undefined} onSubmit={handleItemFormSubmit} onCancel={() => setShowItemForm(false)} preselectedCategory={selectedCategory} />}
      {showSectionForm && <SectionForm sections={sections} onSubmit={handleSectionFormSubmit} onCancel={() => setShowSectionForm(false)} />}
      {showMobilePreview && <MobileMenuPreview menuItems={menuItems} sections={sections} onClose={() => setShowMobilePreview(false)} />}
    </div>;
};
export default MenuManagement;