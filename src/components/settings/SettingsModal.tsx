"use client";

import React, { useEffect } from "react";
import { XIcon } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Tailwind max-width class for the modal card. Defaults to max-w-2xl. */
  maxWidthClass?: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidthClass = "max-w-2xl",
}) => {
  // Cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>
      <div
        className={`relative bg-white rounded-xl sm:rounded-2xl ${maxWidthClass} w-full mx-auto shadow-2xl max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-4 sm:p-6 border-b border-gray-100">
          <div className="pr-4">
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-900">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 flex-shrink-0"
          >
            <XIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 sm:p-6 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
