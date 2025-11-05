import React, { useEffect, useState, useRef, useMemo } from 'react';
import { XIcon, Search, Settings } from 'lucide-react';
import { useRestaurant } from '../contexts/RestaurantContext';
interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  discount?: number;
  section_id: number;
  image_url?: string;
}

interface MenuSection {
  id: number;
  name: string;
}

interface MobileMenuPreviewProps {
  menuItems: MenuItem[];
  sections: MenuSection[];
  onClose: () => void;
}
const MobileMenuPreview: React.FC<MobileMenuPreviewProps> = ({
  menuItems,
  sections,
  onClose
}) => {
  const { restaurant } = useRestaurant();

  // Add "Todo" option like MenuView + Get all unique categories from sections
  const categories = ["Todo", ...sections.map(section => section.name).filter(name =>
    menuItems.some(item => item.section_id === sections.find(s => s.name === name)?.id)
  )];

  // State for active filter - default to "Todo" like MenuView
  const [filter, setFilter] = useState("Todo");
  const [searchQuery, setSearchQuery] = useState("");

  // Refs for scrolling (mantener funcionalidad existente)
  const mainContentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isScrolling, setIsScrolling] = useState(false);

  // Filter menu like MenuView
  const filteredSections = useMemo(() => {
    let filtered = sections.filter(section =>
      menuItems.some(item => item.section_id === section.id)
    );

    // Filter by category
    if (filter !== "Todo") {
      filtered = filtered.filter(section => section.name === filter);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(section => {
        const sectionItems = menuItems.filter(item => item.section_id === section.id);
        return sectionItems.some(item =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
        );
      });
    }

      return filtered;
  }, [sections, menuItems, filter, searchQuery]);

  // Get filtered menu items for each section
  const getFilteredItemsForSection = (sectionId: number) => {
    let items = menuItems.filter(item => item.section_id === sectionId);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    return items;
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-[2px]">
      <div className="relative w-full max-w-[375px] mx-auto">
        {/* Mobile frame with image */}
        <div className="relative">
          {/* Phone frame image */}
          <img
            src="/frame.webp"
            alt="Mobile Frame"
            className="w-full h-auto relative z-10"
          />

          {/* Menu content overlay */}
          <div className="absolute inset-0 z-20" style={{
            top: '4.2%',
            left: '6%',
            right: '4.5%',
            bottom: '2.4%'
          }}>
            <div className="bg-white rounded-[50px] overflow-hidden h-full">
              {/* Screen with MenuView design */}
              <div className="relative bg-white rounded-[30px] overflow-y-auto h-full scrollbar-hide">
                {/* Banner image */}
                <img
                  src={
                    restaurant?.banner_url ||
                    "https://w0.peakpx.com/wallpaper/531/501/HD-wallpaper-coffee-espresso-latte-art-cup-food.jpg"
                  }
                  alt=""
                  className="absolute top-0 left-0 w-full h-72 object-cover z-0"
                />

                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-30 bg-white rounded-full p-1.5 shadow-lg"
                >
                  <XIcon className="h-5 w-5 text-black" />
                </button>

                <main className="mt-56 relative z-10">
                    <div className="bg-white rounded-t-3xl flex flex-col items-center px-4 min-h-full pb-8">
                      <div className="mt-4 flex items-start justify-between w-full">
                        {/* Settings Icon */}
                        <div className="bg-white rounded-full p-1 border border-gray-400 shadow-sm">
                          <Settings className="size-4 text-stone-800" strokeWidth={1.5} />
                        </div>
                        {/* Assistant Icon placeholder */}
                        <div className="bg-white rounded-full text-black border border-gray-400 size-8 shadow-sm flex items-center justify-center">
                          <span className="text-xs font-bold">AI</span>
                        </div>
                      </div>

                      {/* Restaurant info */}
                      <div className="mb-3 flex flex-col items-center">
                        <div className="size-20 rounded-full bg-gray-200 overflow-hidden border border-gray-400 shadow-sm">
                          <img
                            src={
                              restaurant?.logo_url ||
                              "https://t4.ftcdn.net/jpg/02/15/84/43/360_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg"
                            }
                            alt="Restaurant Logo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h1 className="text-black text-xl font-medium mt-2 mb-4">
                          ¡Vista previa!
                        </h1>
                      </div>

                      {/* Search Input */}
                      <div className="w-full">
                        <div className="flex items-center justify-center border-b border-black">
                          <Search className="text-black" strokeWidth={1} size={16} />
                          <input
                            type="text"
                            placeholder="Buscar artículo"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full text-black px-2 py-1.5 text-sm focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Filters */}
                      <div className="flex gap-1 mt-2 mb-4 w-full overflow-x-auto scrollbar-hide">
                        {categories.map((cat) => (
                          <div
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-2 py-1 rounded-full cursor-pointer whitespace-nowrap flex-shrink-0 text-xs ${
                              filter === cat
                                ? "bg-black text-white hover:bg-slate-800"
                                : "text-gray-500 hover:bg-gray-100"
                            }`}
                          >
                            {cat}
                          </div>
                        ))}
                      </div>

                      {/* Menu sections */}
                      <div className="w-full">
                        {filteredSections.length > 0 ? (
                          filteredSections.map((section) => {
                            const sectionItems = getFilteredItemsForSection(section.id);
                            if (sectionItems.length === 0) return null;

                            return (
                              <div key={section.id} className="mb-6">
                                <h2 className="text-lg font-bold mb-3 text-black">{section.name}</h2>
                                <div className="space-y-3">
                                  {sectionItems.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                                    >
                                      {item.image_url && (
                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                          <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      )}
                                      <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-black">{item.name}</h3>
                                        <p className="text-gray-600 text-xs mt-1 line-clamp-2">{item.description}</p>
                                        <div className="flex items-center mt-1">
                                          <span className="text-sm font-bold text-black">
                                            ${item.price}
                                          </span>
                                          {item.discount && item.discount > 0 && (
                                            <span className="ml-2 text-xs text-red-600 font-medium">
                                              {item.discount}% OFF
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500 text-sm">
                              {searchQuery.trim()
                                ? `No se encontraron resultados para "${searchQuery}"`
                                : "No hay items disponibles"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </main>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    
  );
};
export default MobileMenuPreview;