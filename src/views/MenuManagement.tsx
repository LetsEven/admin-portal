import React, { useEffect, useState } from "react";
import { PlusIcon, FilterIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import Joyride from "react-joyride";
import { useRestaurant } from "../contexts/RestaurantContext";
import MenuItemCard from "../components/MenuItemCard";
import MenuItemForm from "../components/MenuItemForm";
import SectionHeader from "../components/SectionHeader";
import SectionForm from "../components/SectionForm";
import MobileMenuPreview from "../components/MobileMenuPreview";
import RestaurantHeader from "../components/RestaurantHeader";
import { useMenuAdminPortalApi } from "../services/menuAdminPortalApi";
import { MenuSection, MenuItem } from "../services/adminPortalApi";
import {
  useMenuOnboarding,
  joyrideTheme,
  joyrideResponsiveCSS,
} from "../hooks/useMenuOnboarding";

interface NewSection {
  name: string;
  clasificacion: number;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  active: boolean;
}

const MenuManagement = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const { user } = useUser();
  const {
    restaurant,
    loading: restaurantLoading,
    updateRestaurant,
    createRestaurant,
  } = useRestaurant();
  const menuApi = useMenuAdminPortalApi();

  // Menu onboarding tour
  const { run, steps, handleJoyrideCallback, startOnboarding } =
    useMenuOnboarding();

  // State for API data
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Branch selection state
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const loadData = async () => {
    if (!user || !restaurant) {
      console.log("⏳ Waiting for user and restaurant data...");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      try {
        const sectionsData = await menuApi.sections.getAll();

        // Always get all items (don't filter by branch - we'll show "Agotado" badge instead)
        const itemsData = await menuApi.items.getAll();

        // Sort sections by display_order to ensure proper ordering
        const sortedSections = sectionsData.sort(
          (a, b) => a.display_order - b.display_order,
        );
        setSections(sortedSections);
        setMenuItems(itemsData);
      } catch (apiError) {
        const userSectionsKey = `sections_${user.id}`;
        const userItemsKey = `items_${user.id}`;

        const savedSections = localStorage.getItem(userSectionsKey);
        const savedItems = localStorage.getItem(userItemsKey);

        if (savedSections && savedItems) {
          const sectionsData = JSON.parse(savedSections);
          const itemsData = JSON.parse(savedItems);

          const sortedSections = sectionsData.sort(
            (a: MenuSection, b: MenuSection) =>
              a.display_order - b.display_order,
          );
          setSections(sortedSections);
          setMenuItems(itemsData);
        } else {
          setSections([]);
          setMenuItems([]);
        }
      }
    } catch (error) {
      console.error("❌ Error loading data:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (isHydrated && user && restaurant && !restaurantLoading) {
      loadData();
    }
  }, [isHydrated, user, restaurant, restaurantLoading, selectedBranch]);

  // Iniciar tour cuando la página esté completamente cargada
  useEffect(() => {
    // Tour se muestra siempre para explicar funcionalidad, sin importar estado de datos
    if (!loading && isHydrated && user && restaurant && !restaurantLoading) {
      // Pequeño delay para asegurar que todos los elementos están renderizados
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [
    loading,
    isHydrated,
    user,
    restaurant,
    restaurantLoading,
    startOnboarding,
  ]);

  const [showItemForm, setShowItemForm] = useState(false);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(
    null,
  );

  const allCategories = sections.map((s) => s.name);

  const handleAddItemClick = (category: string) => {
    // Buscar section_id por nombre para robustez
    const section = sections.find((s) => s.name === category);

    toast.success(`Agregando producto a la sección "${category}"`, {
      duration: 2000,
    });
    setCurrentItem(null);
    setSelectedCategory(category);
    setSelectedSectionId(section?.id || null); // Establecer section_id
    setShowItemForm(true);
  };

  const handleAddSectionClick = () => {
    setShowSectionForm(true);
  };

  const handleEditClick = (id: number) => {
    const itemToEdit = menuItems.find((item) => item.id === id);
    if (itemToEdit) {
      const section = sections.find((s) => s.id === itemToEdit.section_id);

      let customFields = [];
      try {
        if (Array.isArray(itemToEdit.custom_fields)) {
          customFields = itemToEdit.custom_fields;
        } else if (typeof itemToEdit.custom_fields === "string") {
          customFields = JSON.parse(itemToEdit.custom_fields);
        } else if (
          itemToEdit.custom_fields === null ||
          itemToEdit.custom_fields === undefined
        ) {
          customFields = [];
        }
      } catch (error) {
        customFields = [];
      }

      const adaptedItem = {
        ...itemToEdit,
        category: section?.name || "",
        section_id: itemToEdit.section_id,
        image: itemToEdit.image_url || "",
        customFields: customFields,
        availableBranches: itemToEdit.availableBranches || [],
      };

      setCurrentItem(adaptedItem);
      setSelectedCategory(""); // Reset selectedCategory cuando se edita
      setSelectedSectionId(null); // Reset selectedSectionId cuando se edita
      setShowItemForm(true);
    }
  };
  const handleDeleteClick = async (id: number) => {
    const itemToDelete = menuItems.find((item) => item.id === id);
    const itemName = itemToDelete?.name || "platillo";

    if (window.confirm("¿Estás seguro de que deseas eliminar este platillo?")) {
      const loadingToast = toast.loading(`Eliminando "${itemName}"...`);

      try {
        await menuApi.items.delete(id);
        await loadData();

        toast.dismiss(loadingToast);
        toast.success(`"${itemName}" eliminado correctamente`, {
          duration: 3000,
        });
      } catch (error) {
        console.error("❌ Error deleting item:", error);

        toast.dismiss(loadingToast);
        toast.error(
          `Error al eliminar "${itemName}". Por favor intenta de nuevo.`,
          {
            duration: 4000,
            icon: "❌",
          },
        );

        setError(
          error instanceof Error ? error.message : "Failed to delete item",
        );
      }
    }
  };
  const handleItemFormSubmit = async (values: any) => {
    try {
      let sectionId: number;

      console.log({ values });
      // NUEVA LÓGICA: Priorizar section_id sobre category name
      if (values.section_id) {
        // Si tenemos section_id, usarlo directamente (más robusto)
        sectionId = values.section_id;
      } else if (values.id) {
        // Si estamos editando pero no tenemos section_id, buscar por item actual
        const currentItem = menuItems.find((item) => item.id === values.id);
        if (currentItem?.section_id) {
          sectionId = currentItem.section_id;
        } else {
          // Fallback: buscar por nombre de categoría (lógica antigua)
          const section = sections.find((s) => s.name === values.category);
          if (!section) {
            throw new Error(`Section "${values.category}" not found`);
          }
          sectionId = section.id;
        }
      } else {
        // Para items nuevos: buscar por nombre si no hay section_id
        const section = sections.find((s) => s.name === values.category);
        if (!section) {
          throw new Error(`Section "${values.category}" not found`);
        }
        sectionId = section.id;
      }

      let customFields = [];
      try {
        if (Array.isArray(values.customFields)) {
          customFields = values.customFields;
        } else if (typeof values.customFields === "string") {
          customFields = JSON.parse(values.customFields);
        } else if (
          values.customFields === null ||
          values.customFields === undefined
        ) {
          customFields = [];
        }
      } catch (error) {
        console.warn("Error parsing customFields in form submission:", error);
        customFields = [];
      }

      const itemData = {
        section_id: sectionId,
        name: values.name,
        description: values.description,
        image_url: values.image,
        price: values.price,
        base_price: values.base_price,
        discount: values.discount || 0,
        custom_fields: customFields,
        display_order: 0,
        availableBranches: values.availableBranches || [],
      };

      if (values.id) {
        await menuApi.items.update(values.id, itemData);
      } else {
        await menuApi.items.create(itemData);
      }

      await loadData();

      setShowItemForm(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save item");
    }
  };
  const handleSectionFormSubmit = async (
    reorderedSections: MenuSection[],
    newSections: NewSection[],
  ) => {
    const loadingToast = toast.loading("Guardando cambios...");

    try {
      // 1. Handle reordering of existing sections
      const orderChanged = reorderedSections.some(
        (section, index) => section.display_order !== index,
      );

      if (orderChanged) {
        // Filter out sections with invalid IDs and wrong restaurant_id
        const validSections = reorderedSections.filter((section) => {
          const id = Number(section.id);
          const hasValidId = id && !isNaN(id) && id > 0 && id < 1000000000; // Real DB IDs are usually small numbers
          const belongsToRestaurant = section.restaurant_id === restaurant?.id;

          if (!hasValidId) {
            console.warn(
              "⚠️ Skipping section with invalid/temporary ID:",
              section.id,
              "Name:",
              section.name,
            );
            return false;
          }

          if (!belongsToRestaurant) {
            console.warn(
              "⚠️ Skipping section that doesn't belong to current restaurant:",
              section.id,
              "Name:",
              section.name,
              "Section restaurant_id:",
              section.restaurant_id,
              "Current restaurant_id:",
              restaurant?.id,
            );
            return false;
          }

          return true;
        });

        if (validSections.length === 0) {
          console.warn(
            "⚠️ No valid sections to reorder (all have temporary IDs)",
          );
          toast.dismiss(loadingToast);
          toast.success("Cambios guardados correctamente");
          return;
        }

        const reorderData = validSections.map((section, index) => ({
          id: Number(section.id), // Ensure it's a number
          display_order: index,
        }));

        try {
          await menuApi.sections.reorder(reorderData);
        } catch (apiError) {
          console.error("❌ Failed to reorder sections:", apiError);
          toast.dismiss(loadingToast);
          toast.error("Error al reordenar secciones");
          // Update local state anyway for better UX
          const updatedSections = reorderedSections.map((section, index) => ({
            ...section,
            display_order: index,
          }));
          setSections(updatedSections);
          return;
        }
      }

      // 2. Handle section deletions
      const reorderedSectionNames = reorderedSections.map((s) => s.name);
      const sectionsToDelete = sections.filter(
        (section) => !reorderedSectionNames.includes(section.name),
      );

      for (const section of sectionsToDelete) {
        try {
          console.log("Deleting section:", section.name);
          await menuApi.sections.delete(section.id);
        } catch (apiError) {
          console.error("❌ Failed to delete section:", apiError);
          toast.dismiss(loadingToast);
          toast.error(`Error al eliminar la sección "${section.name}"`);
          const updatedSections = sections.filter((s) => s.id !== section.id);
          setSections(updatedSections);

          if (user) {
            localStorage.setItem(
              `sections_${user.id}`,
              JSON.stringify(updatedSections),
            );
          }
          return;
        }
      }

      // 3. Handle new section creation
      for (const section of newSections) {
        try {
          await menuApi.sections.create({
            name: section.name,
            clasificacion: section.clasificacion,
            display_order:
              reorderedSections.length + newSections.indexOf(section),
          });
        } catch (apiError) {
          console.error("❌ Failed to create section:", apiError);
          toast.dismiss(loadingToast);
          toast.error(`Error al crear la sección "${section.name}"`);
          // Fallback to localStorage if API fails
          const newSection = {
            id: Date.now() + newSections.indexOf(section),
            restaurant_id: restaurant?.id || 0,
            name: section.name,
            clasificacion: section.clasificacion,
            is_active: true,
            display_order:
              reorderedSections.length + newSections.indexOf(section),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const updatedSections = [...reorderedSections, newSection];
          setSections(updatedSections);

          if (user) {
            localStorage.setItem(
              `sections_${user.id}`,
              JSON.stringify(updatedSections),
            );
          }
          return;
        }
      }

      await loadData();

      toast.dismiss(loadingToast);
      toast.success("Cambios guardados correctamente");

      setShowSectionForm(false);
    } catch (error) {
      console.error("❌ Error updating sections:", error);
      toast.dismiss(loadingToast);
      toast.error("Error al guardar los cambios");
      setError(
        error instanceof Error ? error.message : "Failed to update sections",
      );
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
  const filteredItems = filterCategory
    ? menuItems.filter((item) => {
        const section = sections.find((s) => s.id === item.section_id);
        return section?.name === filterCategory;
      })
    : menuItems;

  // Group items by category - use section names from the database
  const itemsByCategory = sections.reduce(
    (acc, section) => {
      const items = filteredItems.filter(
        (item) => item.section_id === section.id,
      );
      acc[section.name] = items;
      return acc;
    },
    {} as Record<string, MenuItem[]>,
  );

  if (!isHydrated || loading || restaurantLoading || !restaurant) {
    return (
      <div className="w-full">
        <RestaurantHeader
          restaurantName={restaurant?.name || ""}
          bannerImage={restaurant?.banner_url || ""}
          logoImage={restaurant?.logo_url || ""}
          onUpdateName={() => {}}
          onUpdateBanner={() => {}}
          onUpdateLogo={() => {}}
          onAddSectionClick={() => {}}
          onViewMenuClick={() => {}}
          selectedBranch={selectedBranch}
          onBranchChange={setSelectedBranch}
        />
        <div className="mt-4 sm:mt-6">
          <div className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-gray-500">
              {!isHydrated
                ? "Iniciando..."
                : restaurantLoading
                  ? "Cargando restaurante..."
                  : "Cargando datos del menú..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <RestaurantHeader
          restaurantName={restaurant?.name || ""}
          bannerImage={restaurant?.banner_url || ""}
          logoImage={restaurant?.logo_url || ""}
          onUpdateName={() => {}}
          onUpdateBanner={() => {}}
          onUpdateLogo={() => {}}
          onAddSectionClick={() => {}}
          onViewMenuClick={() => {}}
          selectedBranch={selectedBranch}
          onBranchChange={setSelectedBranch}
        />
        <div className="mt-4 sm:mt-6">
          <div className="text-center py-8 sm:py-12 px-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 max-w-md mx-auto">
              <p className="text-sm sm:text-base text-red-600 font-medium">
                Error al cargar datos
              </p>
              <p className="text-red-500 text-xs sm:text-sm mt-1">{error}</p>
              <button
                onClick={loadData}
                className="mt-2 sm:mt-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white text-xs sm:text-sm rounded-md hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <RestaurantHeader
        data-tour="restaurant-header"
        restaurantName={restaurant?.name || ""}
        bannerImage={restaurant?.banner_url || ""}
        logoImage={restaurant?.logo_url || ""}
        onUpdateName={handleUpdateRestaurantName}
        onUpdateBanner={handleUpdateBanner}
        onUpdateLogo={handleUpdateLogo}
        onAddSectionClick={handleAddSectionClick}
        onViewMenuClick={() => setShowMobilePreview(true)}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        onSyncComplete={loadData}
      />

      <div className="mt-4 sm:mt-6">
        {/* Branch filter info */}
        {/* {selectedBranch && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FilterIcon className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">
                  Filtrando por sucursal: {selectedBranch.name}
                </p>
                <p className="text-xs text-blue-700">
                  {selectedBranch.address}
                </p>
              </div>
            </div>
          </div>
        )} */}

        {Object.keys(itemsByCategory).length === 0 ? (
          run ? (
            // Mostrar placeholders demo durante el tour
            <div className="mb-6 sm:mb-8">
              <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                <div className="flex items-center mb-2">
                  <span className="text-[10px] sm:text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                    Ejemplo para tour guiado
                  </span>
                </div>
                <SectionHeader
                  title="Platos Principales"
                  data-tour="section-header"
                />

                <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-3 sm:mt-4">
                  <div
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4"
                    data-tour="menu-item-card"
                  >
                    <div className="aspect-w-16 aspect-h-9 mb-2 sm:mb-3">
                      <div className="w-full h-24 sm:h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs sm:text-sm">
                          Imagen ejemplo
                        </span>
                      </div>
                    </div>
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1">
                      Pasta Alfredo
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mb-2">
                      Deliciosa pasta con salsa cremosa alfredo y pollo
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-base sm:text-lg font-bold text-gray-900">
                        $185.00
                      </span>
                      <span className="text-[10px] sm:text-xs text-blue-600">
                        Ejemplo
                      </span>
                    </div>
                  </div>

                  <button
                    className="bg-white overflow-hidden shadow rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center h-36 sm:h-48 hover:bg-gray-50 transition-colors"
                    data-tour="add-item-btn"
                  >
                    <div className="text-center">
                      <PlusIcon className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                      <span className="mt-1 sm:mt-2 block text-xs sm:text-sm font-medium text-gray-500">
                        Agregar platillo
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Estado normal sin tour - mantener funcionalidad existente
            <div className="text-center py-8 sm:py-12 px-4">
              <p className="text-sm sm:text-base text-gray-500">
                No hay platillos en esta categoría. Agrega una sección y
                platillos para comenzar.
              </p>
            </div>
          )
        ) : (
          Object.entries(itemsByCategory).map(
            ([category, items], categoryIndex) => (
              <div key={category} className="mb-6 sm:mb-8">
                <SectionHeader
                  title={category}
                  data-tour={categoryIndex === 0 ? "section-header" : undefined}
                />

                <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item, itemIndex) => (
                    <MenuItemCard
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      description={item.description}
                      price={item.price}
                      discount={item.discount}
                      category={
                        sections.find((s) => s.id === item.section_id)?.name ||
                        ""
                      }
                      image={item.image_url || ""}
                      availableBranches={item.availableBranches || []}
                      selectedBranchId={selectedBranch?.id || null}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
                      data-tour={
                        categoryIndex === 0 && itemIndex === 0
                          ? "menu-item-card"
                          : undefined
                      }
                    />
                  ))}

                  <button
                    onClick={() => handleAddItemClick(category)}
                    data-tour={categoryIndex === 0 ? "add-item-btn" : undefined}
                    className="bg-white overflow-hidden shadow rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center h-36 sm:h-48 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-center">
                      <PlusIcon className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                      <span className="mt-1 sm:mt-2 block text-xs sm:text-sm font-medium text-gray-500">
                        Agregar platillo
                      </span>
                    </div>
                  </button>
                  {items.length === 0 && (
                    <div className="col-span-full py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-500">
                      No hay platillos en esta sección. Haz clic en "Agregar
                      platillo" para comenzar.
                    </div>
                  )}
                </div>
              </div>
            ),
          )
        )}
      </div>
      {showItemForm && (
        <MenuItemForm
          initialValues={currentItem || undefined}
          onSubmit={handleItemFormSubmit}
          onCancel={() => setShowItemForm(false)}
          preselectedCategory={selectedCategory}
          preselectedSectionId={selectedSectionId || undefined}
        />
      )}
      {showSectionForm && (
        <SectionForm
          sections={sections}
          onSubmit={handleSectionFormSubmit}
          onCancel={() => setShowSectionForm(false)}
        />
      )}
      {showMobilePreview && (
        <MobileMenuPreview
          menuItems={menuItems}
          sections={sections}
          onClose={() => setShowMobilePreview(false)}
        />
      )}

      {/* Estilos responsive para onboarding */}
      <style dangerouslySetInnerHTML={{ __html: joyrideResponsiveCSS }} />
      {/* Tour guiado para gestión de menú */}
      <Joyride
        callback={handleJoyrideCallback}
        continuous
        hideCloseButton
        run={run}
        scrollToFirstStep
        showProgress
        showSkipButton
        steps={steps}
        styles={joyrideTheme}
        locale={{
          back: "Atrás",
          close: "Cerrar",
          last: "Finalizar",
          next: "Siguiente",
          nextLabelWithProgress: `Siguiente {step} de {steps}`,
          skip: "Saltar tour",
        }}
      />
    </div>
  );
};
export default MenuManagement;
