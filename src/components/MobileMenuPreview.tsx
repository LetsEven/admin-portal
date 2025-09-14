import React, { useEffect, useState, useRef } from 'react';
import { XIcon, SearchIcon, PlusIcon, HeartIcon, MoreHorizontalIcon, StarIcon } from 'lucide-react';
interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  discount?: number;
  category: string;
  image: string;
}
interface MobileMenuPreviewProps {
  menuItems: MenuItem[];
  onClose: () => void;
}
const MobileMenuPreview: React.FC<MobileMenuPreviewProps> = ({
  menuItems,
  onClose
}) => {
  // Get all unique categories from menu items
  const categories = [...new Set(menuItems.map(item => item.category))];
  // State for active tab - default to first category
  const [activeTab, setActiveTab] = useState(categories[0] || '');
  // Refs for scrolling
  const mainContentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isScrolling, setIsScrolling] = useState(false);
  // Get discounted items for featured section
  const discountedItems = menuItems.filter(item => item.discount && item.discount > 0);
  // Generate random ratings for demo purposes
  const getRating = () => {
    return {
      percentage: Math.floor(Math.random() * 15) + 85,
      count: Math.floor(Math.random() * 20) + 1 // 1-20 reviews
    };
  };
  // Handle scroll event to update active tab
  const handleScroll = () => {
    if (isScrolling || !mainContentRef.current) return;
    setIsScrolling(true);
    requestAnimationFrame(() => {
      if (!mainContentRef.current) {
        setIsScrolling(false);
        return;
      }
      const scrollTop = mainContentRef.current.scrollTop;
      const headerOffset = 170; // Ajustar según la altura del encabezado
      // Find which section is most visible
      let closestSection = activeTab;
      let minDistance = Infinity;
      Object.entries(sectionRefs.current).forEach(([category, sectionRef]) => {
        if (!sectionRef) return;
        const sectionTop = sectionRef.offsetTop;
        const distance = Math.abs(scrollTop - (sectionTop - headerOffset));
        if (distance < minDistance) {
          minDistance = distance;
          closestSection = category;
        }
      });
      // Only update if it's different to avoid infinite loops
      if (closestSection !== activeTab) {
        setActiveTab(closestSection);
      }
      setIsScrolling(false);
    });
  };
  // Handle category tab click
  const handleCategoryClick = (category: string) => {
    if (category === activeTab) return;
    setActiveTab(category);
    const sectionElement = sectionRefs.current[category];
    if (sectionElement && mainContentRef.current) {
      const headerOffset = 170; // Ajustar según la altura del encabezado
      const sectionTop = sectionElement.offsetTop;
      mainContentRef.current.scrollTo({
        top: sectionTop - headerOffset,
        behavior: 'smooth'
      });
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-[2px]">
      <div className="relative w-full max-w-[375px] mx-auto">
        <style jsx>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
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
              {/* Screen - Todo el contenido en un solo contenedor con scroll */}
              <div 
                ref={mainContentRef} 
                className="relative bg-white rounded-[30px] overflow-y-auto h-full touch-auto hide-scrollbar" 
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }} 
                onScroll={handleScroll}
              >
            {/* Top action buttons */}
            <div className="sticky top-0 z-20 px-4 py-3 pt-8 flex items-center justify-between bg-white">
              <button onClick={onClose} className="p-1 bg-gray-100 rounded-full">
                <XIcon className="h-6 w-6 text-black" />
              </button>
              <div className="flex items-center space-x-2">
                <button className="p-1 bg-gray-100 rounded-full">
                  <SearchIcon className="h-6 w-6 text-black" />
                </button>
                <button className="p-1 bg-gray-100 rounded-full">
                  <HeartIcon className="h-6 w-6 text-black" />
                </button>
                <button className="p-1 bg-gray-100 rounded-full">
                  <MoreHorizontalIcon className="h-6 w-6 text-black" />
                </button>
              </div>
            </div>
            {/* Restaurant Info - Centered */}
            <div className="flex flex-col items-center px-4 py-6 border-b border-gray-100 bg-white">
              {/* Logo */}
              <div className="w-20 h-20 mb-3 overflow-hidden">
                <img src="/holycow-logo.png" alt="Holy Cow Logo" className="w-full h-full object-contain" />
              </div>
              {/* Restaurant Name */}
              <h1 className="text-2xl font-bold text-gray-900">Holy Cow</h1>
              {/* Rating Info */}
              <div className="flex items-center mt-1 text-gray-600 text-sm">
                <span className="font-semibold text-black text-base mr-1">
                  4.7
                </span>
                <StarIcon className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                <span className="mx-1 text-gray-400">•</span>
                <span>(1,000+)</span>
                <span className="mx-1 text-gray-400">•</span>
                <span>11.1 km</span>
              </div>
              {/* Additional Info */}
              <div className="mt-1 text-green-600 font-medium text-sm">
                600+ pidieron de nuevo
              </div>
            </div>
            {/* Navigation Tabs - Sticky para que se desplace con el contenido pero se quede visible */}
            <div className="sticky top-[68px] z-10 flex px-1 overflow-x-auto bg-white border-b border-gray-100" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
              {categories.map(category => <button key={category} className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${activeTab === category ? 'text-black border-b-2 border-black' : 'text-gray-500'}`} onClick={() => handleCategoryClick(category)}>
                  {category}
                </button>)}
            </div>
            {/* Featured Items (Discounted) */}
            {discountedItems.length > 0 && <div className="py-4 px-4 bg-white">
                <h2 className="text-xl font-bold mb-3">
                  Artículos en promoción
                </h2>
                <div className="space-y-3">
                  {discountedItems.slice(0, 1).map(item => {
                const discountedPrice = item.price * (1 - item.discount! / 100);
                return <div key={item.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
                        <div className="relative">
                          <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                          <div className="absolute top-0 left-0 bg-red-600 text-white px-2 py-1 text-xs font-bold">
                            {item.discount}% OFF
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="font-bold text-lg">{item.name}</h3>
                          <div className="flex justify-between items-center mt-1">
                            <div>
                              <span className="text-sm line-through text-gray-500 mr-1">
                                MXN {item.price.toFixed(2)}
                              </span>
                              <span className="text-base font-semibold text-red-600">
                                MXN {discountedPrice.toFixed(2)}
                              </span>
                            </div>
                            <button className="bg-white rounded-full p-1 shadow border border-gray-200">
                              <PlusIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>;
              })}
                </div>
              </div>}
            {/* Render all categories one after another */}
            {categories.map(category => {
            const categoryItems = menuItems.filter(item => item.category === category);
            if (categoryItems.length === 0) return null;
            return <div key={category} ref={el => sectionRefs.current[category] = el} className="px-4 py-4 bg-white" id={`section-${category.replace(/\s+/g, '-').toLowerCase()}`}>
                  <h2 className="text-2xl font-bold mb-4">{category}</h2>
                  <div className="space-y-4">
                    {categoryItems.map(item => {
                  const rating = getRating();
                  const hasDiscount = item.discount && item.discount > 0;
                  const discountedPrice = hasDiscount ? item.price * (1 - item.discount / 100) : item.price;
                  return <div key={item.id} className="flex justify-between items-center border-b border-gray-100 pb-4">
                          <div className="pr-3 flex-1">
                            <h3 className="font-bold text-lg">{item.name}</h3>
                            <div className="flex items-center mt-1">
                              <span className="text-base font-medium text-gray-900">
                                MXN{' '}
                                {hasDiscount ? discountedPrice.toFixed(2) : item.price.toFixed(2)}
                              </span>
                              <span className="mx-2 text-gray-400">•</span>
                              <div className="flex items-center text-sm">
                                <span className="text-gray-700">
                                  {rating.percentage}%
                                </span>
                                <span className="text-gray-400 ml-1">
                                  ({rating.count})
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                              {item.description}
                            </p>
                            {hasDiscount && <div className="mt-1">
                                <span className="text-sm line-through text-gray-500">
                                  MXN {item.price.toFixed(2)}
                                </span>
                              </div>}
                          </div>
                          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            {hasDiscount && <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5">
                                {item.discount}% OFF
                              </div>}
                            <button className="absolute bottom-1 right-1 bg-white rounded-full p-1 shadow-md">
                              <PlusIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>;
                })}
                  </div>
                </div>;
          })}
                <div className="h-16"></div> {/* Bottom spacing */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default MobileMenuPreview;