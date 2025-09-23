import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { MenuIcon, XIcon } from 'lucide-react';
interface LayoutProps {
  children: React.ReactNode;
}
const Layout: React.FC<LayoutProps> = ({
  children
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className="md:hidden">
        <div className={`fixed inset-0 z-40 flex ${sidebarOpen ? 'visible' : 'invisible'}`}>
          <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)} />
          <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transition ease-in-out duration-300 transform shadow-xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button className={`ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white ${sidebarOpen ? '' : 'hidden'}`} onClick={() => setSidebarOpen(false)}>
                <span className="sr-only">Cerrar menú</span>
                <XIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <Sidebar mobile={true} />
          </div>
          <div className="flex-shrink-0 w-14"></div>
        </div>
      </div>
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col transition-all duration-300 ease-in-out w-16 hover:w-64 shadow-lg group">
          <Sidebar mobile={false} />
        </div>
      </div>
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden group">
        <div className="md:hidden pl-3 pt-3 flex items-center border-b border-gray-200 bg-white shadow-sm h-14 sticky top-0 z-10">
          <button className="h-10 w-10 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-custom-green-500" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Abrir menú</span>
            <MenuIcon className="h-6 w-6" />
          </button>
          <div className="ml-4 flex items-center">
            <img src="/iso-1-white.png" alt="Xquisito Logo" className="h-8 w-auto mr-2" />
            <span className="text-lg font-medium text-gray-800">Xquisito</span>
          </div>
        </div>
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none bg-gray-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>;
};
export default Layout;