"use client";

import React from "react";
import { SaveIcon } from "lucide-react";
import SettingsModal from "./SettingsModal";

type OpeningHours = {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
    allDay?: boolean;
  };
};

interface HorarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  days: Record<string, string>;
  openingHours: OpeningHours;
  validationErrors: { [key: string]: string };
  onHoursChange: (day: string, field: string, value: string | null) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  areHoursChanged: boolean;
}

const HorarioModal: React.FC<HorarioModalProps> = ({
  isOpen,
  onClose,
  days,
  openingHours,
  validationErrors,
  onHoursChange,
  onSave,
  isSaving,
  areHoursChanged,
}) => {
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  const handleSave = async () => {
    await onSave();
    if (!hasValidationErrors) onClose();
  };

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Horario de atención"
      description="Establece los horarios en que tu restaurante está abierto."
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !areHoursChanged || hasValidationErrors}
            className="inline-flex items-center gap-2 px-4 py-2 bg-custom-green-600 hover:bg-custom-green-700 text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <SaveIcon className="w-4 h-4" />
            )}
            {isSaving ? "Guardando..." : "Guardar horarios"}
          </button>
        </>
      }
    >
      <div className="space-y-3 sm:space-y-4">
        {Object.entries(days).map(([day, label]) => (
          <div
            key={day}
            className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-x-4"
          >
            {/* Línea 1 en móvil: Día + Checkboxes */}
            <div className="flex items-center gap-3 sm:gap-0 sm:contents">
              <div className="w-16 sm:w-24">
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  {label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <input
                    id={`closed-${day}`}
                    name={`closed-${day}`}
                    type="checkbox"
                    checked={openingHours[day].closed}
                    onChange={() => onHoursChange(day, "closed", null)}
                    className="h-4 w-4 text-custom-green-600 focus:ring-custom-green-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`closed-${day}`}
                    className="ml-1.5 text-xs sm:text-sm text-gray-700"
                  >
                    Cerrado
                  </label>
                </div>
                {!openingHours[day].closed && (
                  <div className="flex items-center">
                    <input
                      id={`allday-${day}`}
                      name={`allday-${day}`}
                      type="checkbox"
                      checked={openingHours[day].allDay || false}
                      onChange={() => onHoursChange(day, "allDay", null)}
                      className="h-4 w-4 text-custom-green-600 focus:ring-custom-green-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`allday-${day}`}
                      className="ml-1.5 text-xs sm:text-sm text-gray-700"
                    >
                      Todo el día
                    </label>
                  </div>
                )}
              </div>
            </div>
            {/* Línea 2 en móvil: Inputs de hora o badge 24 hrs */}
            {!openingHours[day].closed &&
              (openingHours[day].allDay ? (
                <div className="mt-1.5 sm:mt-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    24 hrs
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-0 sm:contents mt-1.5 sm:mt-0 pl-0 sm:pl-0">
                  <div className="flex items-center">
                    <label htmlFor={`open-${day}`} className="sr-only">
                      Abre
                    </label>
                    <input
                      type="time"
                      id={`open-${day}`}
                      value={openingHours[day].open}
                      onChange={(e) =>
                        onHoursChange(day, "open", e.target.value)
                      }
                      className="block w-full shadow-sm text-xs sm:text-sm border-gray-300 rounded-md focus:ring-custom-green-500 focus:border-custom-green-500"
                    />
                  </div>
                  <span className="text-xs sm:text-base text-gray-500">a</span>
                  <div className="flex items-center">
                    <label htmlFor={`close-${day}`} className="sr-only">
                      Cierra
                    </label>
                    <input
                      type="time"
                      id={`close-${day}`}
                      value={openingHours[day].close}
                      onChange={(e) =>
                        onHoursChange(day, "close", e.target.value)
                      }
                      className="block w-full shadow-sm text-xs sm:text-sm border-gray-300 rounded-md focus:ring-custom-green-500 focus:border-custom-green-500"
                    />
                  </div>
                </div>
              ))}
            {/* Mostrar error de validación si existe */}
            {validationErrors[`${day}_time`] && (
              <div className="w-full sm:w-auto">
                <p className="text-xs sm:text-sm text-red-600 mt-1">
                  {validationErrors[`${day}_time`]}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </SettingsModal>
  );
};

export default HorarioModal;
