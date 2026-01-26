import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import Portal from './Portal';

interface Branch {
  id: string;
  name: string;
  address: string;
  active: boolean;
}

interface BranchDropdownProps {
  isOpen: boolean;
  branches: Branch[];
  selectedBranch: Branch | null;
  onBranchSelect: (branch: Branch | null) => void;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
}

const BranchDropdown: React.FC<BranchDropdownProps> = ({
  isOpen,
  branches,
  selectedBranch,
  onBranchSelect,
  onClose,
  triggerRef
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  // Calculate position based on trigger element
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth < 640;

      // En móvil, centrar el dropdown y limitar ancho
      const dropdownWidth = isMobile ? Math.min(viewportWidth - 24, 280) : Math.max(triggerRect.width, 250);
      const leftPosition = isMobile
        ? (viewportWidth - dropdownWidth) / 2 + scrollLeft
        : triggerRect.left + scrollLeft;

      setPosition({
        top: triggerRect.bottom + scrollTop + 4, // 4px gap en móvil
        left: leftPosition,
        width: dropdownWidth
      });
    }
  }, [isOpen, triggerRef]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose, triggerRef]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        ref={dropdownRef}
        className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-[60vh] overflow-y-auto"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          pointerEvents: 'auto'
        }}
      >
        <div className="py-1">
          {/* All branches option */}
          <button
            onClick={() => onBranchSelect(null)}
            className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm hover:bg-gray-100 transition-colors ${
              !selectedBranch ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="font-medium">Todas las sucursales</div>
                <div className="text-[10px] sm:text-xs text-gray-500">Ver información de todas</div>
              </div>
            </div>
          </button>

          {/* Divider */}
          {branches.length > 0 && (
            <div className="border-t border-gray-100 my-1"></div>
          )}

          {/* Individual branches */}
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => onBranchSelect(branch)}
              className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm hover:bg-gray-100 transition-colors ${
                selectedBranch?.id === branch.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-3 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{branch.name}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 truncate">{branch.address}</div>
                </div>
              </div>
            </button>
          ))}

          {/* No branches message */}
          {branches.length === 0 && (
            <div className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-500 text-center">
              No hay sucursales disponibles
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
};

export default BranchDropdown;