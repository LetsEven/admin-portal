import React from 'react';
import { PencilIcon, TrashIcon } from 'lucide-react';
interface MenuItemCardProps {
  id: number;
  name: string;
  description: string;
  price: number;
  discount?: number;
  category: string;
  image: string;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}
const MenuItemCard: React.FC<MenuItemCardProps> = ({
  id,
  name,
  description,
  price,
  discount = 0,
  category,
  image,
  onEdit,
  onDelete
}) => {
  // Comprueba si es un Hot Dawg para aplicar el estilo especial
  const isHotDawg = category === 'Hot Dawgs';
  // Calcular precio con descuento si hay descuento
  const hasDiscount = discount && discount > 0;
  const discountedPrice = hasDiscount ? price * (1 - discount / 100) : price;  
  return <div className="bg-white overflow-hidden shadow rounded-lg transition-all duration-200 hover:shadow-md border border-gray-100">
      <div className="relative h-56 w-full overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover img-food-quality img-smooth-transition img-hover-enhance"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const placeholder = target.parentElement?.querySelector('.image-placeholder');
              if (placeholder) {
                (placeholder as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div className="image-placeholder w-full h-full bg-gray-200 flex items-center justify-center" style={{ display: image ? 'none' : 'flex' }}>
          <div className="text-center text-gray-400">
            <svg className="mx-auto h-12 w-12 mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
            <p className="text-sm">Sin imagen</p>
          </div>
        </div>
        <div className="absolute top-2 right-2 flex space-x-2">
          <button onClick={() => onEdit(id)} className="bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-custom-green-500">
            <PencilIcon className="h-4 w-4 text-gray-600" />
          </button>
          <button onClick={() => onDelete(id)} className="bg-white p-2 rounded-full shadow hover:bg-red-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500">
            <TrashIcon className="h-4 w-4 text-red-600" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 bg-custom-green-600 text-white px-2 py-1 text-xs font-medium">
          {category}
        </div>
        { hasDiscount && 
          <div className="absolute top-0 left-0 bg-red-600 text-white px-2 py-1 text-xs font-medium">
            {discount}% OFF
          </div>
        }
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900">{name}</h3>
          <div className="text-right">
            {hasDiscount ? <>
                <p className="text-sm line-through text-gray-500">
                  ${price.toFixed(2)}
                </p>
                <p className="text-lg font-semibold text-red-600">
                  ${discountedPrice.toFixed(2)}
                </p>
              </> : <p className="text-lg font-semibold text-custom-green-600">
                ${price.toFixed(2)}
              </p>}
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
          {isHotDawg && description.includes('g') ? description.split(',')[0].trim() + ' - Salchicha de Res' : description}
        </p>
      </div>
    </div>;
};
export default MenuItemCard;