"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  HomeIcon,
  BookOpenIcon,
  TagIcon,
  TrendingUpIcon,
  SettingsIcon,
  LogOutIcon,
  SparklesIcon,
  DollarSign,
} from "lucide-react";
interface SidebarProps {
  mobile: boolean;
}
const Sidebar: React.FC<SidebarProps> = ({ mobile }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();
  const { signOut } = useAuth();
  // No aplicamos la lógica de contracción en móvil
  const handleMouseEnter = () => {
    if (!mobile) setIsExpanded(true);
  };
  const handleMouseLeave = () => {
    if (!mobile) setIsExpanded(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // El usuario será redirigido automáticamente por Clerk
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };
  return (
    <div
      className={`h-0 flex-1 flex flex-col overflow-y-auto transition-all duration-300 ease-in-out ${!mobile && "group"}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Logo */}
      <div
        className={`flex items-center justify-center h-24 flex-shrink-0 px-4 bg-white shadow-md rounded-lg mt-3 ${mobile || isExpanded ? "mx-3" : "ml-1 mr-0"}`}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Full logo for expanded state */}
          <img
            src="/logo-green.webp"
            alt="Xquisito Logo"
            className={`h-8 w-auto max-w-full transition-opacity ${mobile || isExpanded ? "duration-[800ms]" : "duration-0"} ease-out ${mobile || isExpanded ? "opacity-100" : "opacity-0 absolute"}`}
          />
          {/* Compact logo for collapsed state */}
          <div
            className={`flex items-center justify-center transition-opacity ${mobile || isExpanded ? "duration-0" : "duration-[800ms]"} ease-out ${mobile || isExpanded ? "opacity-0 absolute" : "opacity-100"}`}
          >
            <img
              src="/logo-short-green.webp"
              alt="Xquisito Logo"
              className="h-8 w-auto object-contain"
            />
          </div>
        </div>
      </div>
      {/* Navigation */}
      <nav
        className={`mt-3 flex-1 py-4 bg-white space-y-2 rounded-lg shadow-md ${mobile || isExpanded ? "mx-3 px-6" : "ml-1 mr-0 px-3"}`}
      >
        <Link
          href="/"
          className={`group flex items-center text-sm font-medium rounded-lg transition-all duration-200 ${mobile || isExpanded ? "px-3 py-3" : "px-0 py-3 justify-center"} ${pathname === "/" ? "bg-custom-green-100 text-custom-green-900 shadow-sm" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}
          data-tour="home-dashboard"
        >
          <HomeIcon
            className={`flex-shrink-0 h-5 w-5 ${mobile || isExpanded ? "mr-3 text-custom-green-600" : "mx-auto text-gray-500"} transition-all duration-200`}
          />
          <span
            className={`${!mobile && !isExpanded ? "hidden" : "block"} transition-opacity duration-200`}
          >
            Inicio
          </span>
        </Link>
        <Link
          href="/pepper"
          className={`group flex items-center text-sm font-medium rounded-lg transition-all duration-200 ${mobile || isExpanded ? "px-3 py-3" : "px-0 py-3 justify-center"} ${pathname === "/pepper" ? "bg-custom-green-100 text-custom-green-900 shadow-sm" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}
        >
          <SparklesIcon
            className={`flex-shrink-0 h-5 w-5 ${mobile || isExpanded ? "mr-3 text-custom-green-600" : "mx-auto text-gray-500"} transition-all duration-200`}
          />
          <span
            className={`${!mobile && !isExpanded ? "hidden" : "block"} transition-opacity duration-200`}
          >
            Pepper
          </span>
        </Link>
        <Link
          href="/menu"
          className={`group flex items-center text-sm font-medium rounded-lg transition-all duration-200 ${mobile || isExpanded ? "px-3 py-3" : "px-0 py-3 justify-center"} ${pathname === "/menu" ? "bg-custom-green-100 text-custom-green-900 shadow-sm" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}
        >
          <BookOpenIcon
            className={`flex-shrink-0 h-5 w-5 ${mobile || isExpanded ? "mr-3 text-custom-green-600" : "mx-auto text-gray-500"} transition-all duration-200`}
          />
          <span
            className={`${!mobile && !isExpanded ? "hidden" : "block"} transition-opacity duration-200`}
          >
            Menú
          </span>
        </Link>
        <Link
          href="/promotions"
          className={`group flex items-center text-sm font-medium rounded-lg transition-all duration-200 ${mobile || isExpanded ? "px-3 py-3" : "px-0 py-3 justify-center"} ${pathname === "/promotions" ? "bg-custom-green-100 text-custom-green-900 shadow-sm" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}
        >
          <TagIcon
            className={`flex-shrink-0 h-5 w-5 ${mobile || isExpanded ? "mr-3 text-custom-green-600" : "mx-auto text-gray-500"} transition-all duration-200`}
          />
          <span
            className={`${!mobile && !isExpanded ? "hidden" : "block"} transition-opacity duration-200`}
          >
            Dine
          </span>
        </Link>
        <Link
          href="/rewards"
          className={`group flex items-center text-sm font-medium rounded-lg transition-all duration-200 ${mobile || isExpanded ? "px-3 py-3" : "px-0 py-3 justify-center"} ${pathname === "/rewards" ? "bg-custom-green-100 text-custom-green-900 shadow-sm" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}
        >
          <TrendingUpIcon
            className={`flex-shrink-0 h-5 w-5 ${mobile || isExpanded ? "mr-3 text-custom-green-600" : "mx-auto text-gray-500"} transition-all duration-200`}
          />
          <span
            className={`${!mobile && !isExpanded ? "hidden" : "block"} transition-opacity duration-200`}
          >
            Scala
          </span>
        </Link>
        <Link
          href="/pdp"
          className={`group flex items-center text-sm font-medium rounded-lg transition-all duration-200 ${mobile || isExpanded ? "px-3 py-3" : "px-0 py-3 justify-center"} ${pathname === "/pdp" ? "bg-custom-green-100 text-custom-green-900 shadow-sm" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}
        >
          <DollarSign
            className={`flex-shrink-0 h-5 w-5 ${mobile || isExpanded ? "mr-3 text-custom-green-600" : "mx-auto text-gray-500"} transition-all duration-200`}
          />
          <span
            className={`${!mobile && !isExpanded ? "hidden" : "block"} transition-opacity duration-200`}
          >
            PDP
          </span>
        </Link>
        <Link
          href="/settings"
          className={`group flex items-center text-sm font-medium rounded-lg transition-all duration-200 ${mobile || isExpanded ? "px-3 py-3" : "px-0 py-3 justify-center"} ${pathname === "/settings" ? "bg-custom-green-100 text-custom-green-900 shadow-sm" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}`}
        >
          <SettingsIcon
            className={`flex-shrink-0 h-5 w-5 ${mobile || isExpanded ? "mr-3 text-custom-green-600" : "mx-auto text-gray-500"} transition-all duration-200`}
          />
          <span
            className={`${!mobile && !isExpanded ? "hidden" : "block"} transition-opacity duration-200`}
          >
            Configuración
          </span>
        </Link>
        <div className="pt-4 mt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 ${mobile || isExpanded ? "px-3 py-3" : "px-0 py-3 justify-center"}`}
          >
            <LogOutIcon
              className={`flex-shrink-0 h-5 w-5 text-red-500 ${mobile || isExpanded ? "mr-3" : "mx-auto"}`}
            />
            <span
              className={`${!mobile && !isExpanded ? "hidden" : "block"} transition-opacity duration-200`}
            >
              Cerrar sesión
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
};
export default Sidebar;
