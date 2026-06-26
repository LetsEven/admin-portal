import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  PencilIcon,
  TrashIcon,
  Loader2Icon,
  RefreshCwIcon,
} from "lucide-react";

interface MenuItemCardProps {
  id: number;
  name: string;
  description?: string;
  price: number;
  discount?: number;
  category: string;
  image: string;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  isDeleting?: boolean;
  availableBranches?: string[];
  outOfStockBranches?: string[];
  selectedBranchId?: string | null;
  isPosUnmapped?: boolean;
  onSyncToPos?: () => void;
  isSyncing?: boolean;
  "data-tour"?: string;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  id,
  name,
  description = "",
  price,
  discount = 0,
  category,
  image,
  onEdit,
  onDelete,
  isDeleting = false,
  availableBranches = [],
  outOfStockBranches = [],
  selectedBranchId = null,
  isPosUnmapped = false,
  onSyncToPos,
  isSyncing = false,
  "data-tour": dataTour,
}) => {
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);

  const isHotDawg = category === "Hot Dawgs";
  const hasDiscount = discount && discount > 0;
  const discountedPrice = hasDiscount ? price * (1 - discount / 100) : price;

  const isUnavailable =
    selectedBranchId &&
    availableBranches.length > 0 &&
    !availableBranches.includes(selectedBranchId);
  const isOutOfStock =
    selectedBranchId && outOfStockBranches.includes(selectedBranchId);

  const handleConfirmSync = () => {
    setShowSyncConfirm(false);
    onSyncToPos?.();
  };

  return (
    <>
      <div
        className={`bg-white overflow-hidden shadow rounded-lg transition-all duration-200 hover:shadow-md border border-gray-100 ${isUnavailable || isOutOfStock ? "opacity-75" : ""}`}
        data-tour={dataTour}
      >
        <div className="relative h-40 sm:h-56 w-full overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover img-food-quality img-smooth-transition img-hover-enhance"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const placeholder =
                  target.parentElement?.querySelector(".image-placeholder");
                if (placeholder) {
                  (placeholder as HTMLElement).style.display = "flex";
                }
              }}
            />
          ) : null}
          <div
            className="image-placeholder w-full h-full bg-gray-200 flex items-center justify-center"
            style={{ display: image ? "none" : "flex" }}
          >
            <div className="text-center text-gray-400">
              <svg
                className="mx-auto h-8 w-8 sm:h-12 sm:w-12 mb-1.5 sm:mb-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
              </svg>
              <p className="text-xs sm:text-sm">Sin imagen</p>
            </div>
          </div>
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex space-x-1.5 sm:space-x-2">
            <button
              onClick={() => onEdit(id)}
              className="bg-white p-1.5 sm:p-2 rounded-full shadow hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-custom-green-500"
            >
              <PencilIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-600" />
            </button>
            <button
              onClick={() => onDelete(id)}
              disabled={isDeleting}
              className="bg-white p-1.5 sm:p-2 rounded-full shadow hover:bg-red-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <Loader2Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400 animate-spin" />
              ) : (
                <TrashIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600" />
              )}
            </button>
          </div>
          <div className="absolute bottom-0 left-0 bg-custom-green-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium">
            {category}
          </div>
          {hasDiscount && (
            <div className="absolute top-0 left-0 bg-red-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium">
              {discount}% OFF
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute bottom-0 right-0 bg-red-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium">
              AGOTADO
            </div>
          )}
          {isPosUnmapped && (
            <button
              className="absolute bottom-0 right-0 flex items-center gap-1 bg-orange-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium cursor-pointer hover:bg-orange-600 transition-colors disabled:opacity-60"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowSyncConfirm(true);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2Icon className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCwIcon className="h-3 w-3" />
              )}
              SIN POS
            </button>
          )}
        </div>
        <div className="p-3 sm:p-4">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-sm sm:text-lg font-medium text-gray-900 line-clamp-1">
              {name}
            </h3>
            <div className="text-right flex-shrink-0">
              {hasDiscount ? (
                <>
                  <p className="text-xs sm:text-sm line-through text-gray-500">
                    ${price.toFixed(2)}
                  </p>
                  <p className="text-sm sm:text-lg font-semibold text-red-600">
                    ${discountedPrice.toFixed(2)}
                  </p>
                </>
              ) : (
                <p className="text-sm sm:text-lg font-medium text-custom-green-500">
                  ${price.toFixed(2)}
                </p>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 line-clamp-2">
            {isHotDawg && description.includes("g")
              ? description.split(",")[0].trim() + " - Salchicha de Res"
              : description}
          </p>
        </div>
      </div>

      {showSyncConfirm &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={() => setShowSyncConfirm(false)}
          >
            <div
              className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Sincronizar al POS
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                ¿Enviar{" "}
                <span className="font-medium text-gray-700">"{name}"</span> al
                sistema POS? El platillo quedará disponible para ordenar en esta
                sucursal.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowSyncConfirm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSync}
                  className="px-4 py-2 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-medium"
                >
                  Sincronizar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default MenuItemCard;
