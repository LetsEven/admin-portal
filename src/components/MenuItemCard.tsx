import React from "react";
import { PencilIcon, TrashIcon, Loader2Icon } from "lucide-react";
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
  selectedBranchId?: string | null;
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
  selectedBranchId = null,
  "data-tour": dataTour,
}) => {
  // Comprueba si es un Hot Dawg para aplicar el estilo especial
  const isHotDawg = category === "Hot Dawgs";
  // Calcular precio con descuento si hay descuento
  const hasDiscount = discount && discount > 0;
  const discountedPrice = hasDiscount ? price * (1 - discount / 100) : price;

  // Verificar si el producto está agotado en la sucursal seleccionada
  const isOutOfStock =
    selectedBranchId && !availableBranches.includes(selectedBranchId);
  return (
    <div
      className={`bg-white overflow-hidden shadow rounded-lg transition-all duration-200 hover:shadow-md border border-gray-100 ${isOutOfStock ? "opacity-75" : ""}`}
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
        <div className="absolute bottom-0 left-0 bg-custom-green-600 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium">
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
              <p className="text-sm sm:text-lg font-semibold text-custom-green-600">
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
  );
};
export default MenuItemCard;
