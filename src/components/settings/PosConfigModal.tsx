"use client";

import React from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import SettingsModal from "./SettingsModal";

interface PosConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  isLoading: boolean;
  posIntegration: { providerId: string; syncToken: string | null } | null;
  showToken: boolean;
  setShowToken: (v: boolean) => void;
  onCopyBranchId: () => void;
  copySuccessBranchId: boolean;
  onCopyToken: () => void;
  copySuccessToken: boolean;
}

const PosConfigModal: React.FC<PosConfigModalProps> = ({
  isOpen,
  onClose,
  branchId,
  isLoading,
  posIntegration,
  showToken,
  setShowToken,
  onCopyBranchId,
  copySuccessBranchId,
  onCopyToken,
  copySuccessToken,
}) => {
  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuración POS (SoftRestaurant)"
      description="Datos de conexión con el sistema punto de venta."
    >
      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <div className="h-6 w-6 border-2 border-custom-green-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-sm text-gray-600">
            Cargando información de integración...
          </span>
        </div>
      )}

      {!isLoading && !posIntegration && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-xs sm:text-sm text-blue-700">
            Esta sucursal no tiene integración POS configurada. Puedes
            solicitarla al equipo de Even.
          </p>
        </div>
      )}

      {!isLoading && posIntegration && (
        <div className="space-y-4">
          {/* Branch ID */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              ID de Sucursal
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex-1 bg-gray-50 border border-gray-300 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2 min-w-0">
                <code className="text-xs sm:text-sm text-gray-700 break-all">
                  {branchId}
                </code>
              </div>
              <button
                type="button"
                onClick={onCopyBranchId}
                className="inline-flex items-center px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 transition-colors flex-shrink-0"
                title="Copiar ID"
              >
                {copySuccessBranchId ? (
                  <>
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 mr-1" />
                    <span className="text-green-500">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>

          {/* POS Token */}
          {posIntegration.syncToken ? (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Token de Sincronización
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="flex-1 bg-gray-50 border border-gray-300 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2 min-w-0">
                  <code className="text-xs sm:text-sm text-gray-700 break-all">
                    {showToken
                      ? posIntegration.syncToken
                      : "••••••••••••••••••••••••"}
                  </code>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="inline-flex items-center px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 transition-colors"
                    title={showToken ? "Ocultar token" : "Mostrar token"}
                  >
                    {showToken ? (
                      <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onCopyToken}
                    className="inline-flex items-center px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 transition-colors"
                    title="Copiar Token"
                  >
                    {copySuccessToken ? (
                      <>
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 mr-1" />
                        <span className="text-green-500">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Este token se utiliza para sincronizar órdenes con el sistema
                POS.
              </p>
            </div>
          ) : (
            <div className="text-xs sm:text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
              ℹ️ Esta integración POS no requiere token de sincronización.
            </div>
          )}
        </div>
      )}
    </SettingsModal>
  );
};

export default PosConfigModal;
