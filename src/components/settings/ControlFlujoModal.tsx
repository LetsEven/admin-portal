"use client";

import React from "react";
import { SaveIcon, Check } from "lucide-react";
import SettingsModal from "./SettingsModal";

const ORDER_LIMIT_OPTIONS = Array.from({ length: 100 }, (_, i) => i + 1);

interface ControlFlujoModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFlexBillEnabled: boolean;
  isPickNGoEnabled: boolean;
  isTapOrderPayEnabled: boolean;
  selectedFlowServiceTab: "general" | "flex-bill";
  setSelectedFlowServiceTab: (tab: "general" | "flex-bill") => void;
  maxPendingOrders: number | null;
  setMaxPendingOrders: (v: number | null) => void;
  onSaveGeneral: () => Promise<void>;
  isSavingGeneral: boolean;
  generalSaveStatus: "success" | "error" | null;
  flexbillMaxUserOrders: number | null;
  setFlexbillMaxUserOrders: (v: number | null) => void;
  onSaveFlexbill: () => Promise<void>;
  isSavingFlexbill: boolean;
  flexbillSaveStatus: "success" | "error" | null;
}

const ControlFlujoModal: React.FC<ControlFlujoModalProps> = ({
  isOpen,
  onClose,
  isFlexBillEnabled,
  isPickNGoEnabled,
  isTapOrderPayEnabled,
  selectedFlowServiceTab,
  setSelectedFlowServiceTab,
  maxPendingOrders,
  setMaxPendingOrders,
  onSaveGeneral,
  isSavingGeneral,
  generalSaveStatus,
  flexbillMaxUserOrders,
  setFlexbillMaxUserOrders,
  onSaveFlexbill,
  isSavingFlexbill,
  flexbillSaveStatus,
}) => {
  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Control de flujo"
      description="Límite máximo de órdenes activas al mismo tiempo en esta sucursal. Cuando se alcanza, las nuevas órdenes esperan antes de enviarse a cocina."
    >
      {/* Tabs de servicio — solo si hay al menos un servicio general Y Flexbill habilitados */}
      {isFlexBillEnabled && (isPickNGoEnabled || isTapOrderPayEnabled) && (
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => setSelectedFlowServiceTab("general")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              selectedFlowServiceTab === "general"
                ? "bg-custom-green-600 hover:bg-custom-green-700 text-white"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
            }`}
          >
            General
          </button>
          <button
            type="button"
            onClick={() => setSelectedFlowServiceTab("flex-bill")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              selectedFlowServiceTab === "flex-bill"
                ? "bg-custom-green-600 hover:bg-custom-green-700 text-white"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
            }`}
          >
            Flex Bill
          </button>
        </div>
      )}

      {/* TAB: General (tap-order-pay, pick-and-go, room service) */}
      {(selectedFlowServiceTab === "general" ||
        !isFlexBillEnabled ||
        (!isPickNGoEnabled && !isTapOrderPayEnabled)) &&
        (isPickNGoEnabled || isTapOrderPayEnabled) && (
          <div>
            <p className="text-xs text-gray-400 mb-3">
              Órdenes activas al mismo tiempo
            </p>
            <select
              value={maxPendingOrders ?? ""}
              onChange={(e) =>
                setMaxPendingOrders(
                  e.target.value === "" ? null : parseInt(e.target.value, 10),
                )
              }
              className="block w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">Sin límite</option>
              {ORDER_LIMIT_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={onSaveGeneral}
                disabled={isSavingGeneral}
                className="inline-flex items-center gap-2 px-4 py-2 bg-custom-green-600 hover:bg-custom-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                <SaveIcon className="w-4 h-4" />
                {isSavingGeneral ? "Guardando..." : "Guardar límite"}
              </button>
              {generalSaveStatus === "success" && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Guardado
                </span>
              )}
              {generalSaveStatus === "error" && (
                <span className="text-sm text-red-600">Error al guardar</span>
              )}
            </div>
          </div>
        )}

      {/* TAB: Flex Bill (user_orders) */}
      {isFlexBillEnabled &&
        (selectedFlowServiceTab === "flex-bill" ||
          (!isPickNGoEnabled && !isTapOrderPayEnabled)) && (
          <div>
            <p className="text-xs text-gray-400 mb-3">
              Órdenes activas al mismo tiempo
            </p>
            <select
              value={flexbillMaxUserOrders ?? ""}
              onChange={(e) =>
                setFlexbillMaxUserOrders(
                  e.target.value === "" ? null : parseInt(e.target.value, 10),
                )
              }
              className="block w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">Sin límite</option>
              {ORDER_LIMIT_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={onSaveFlexbill}
                disabled={isSavingFlexbill}
                className="inline-flex items-center gap-2 px-4 py-2 bg-custom-green-600 hover:bg-custom-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
              >
                <SaveIcon className="w-4 h-4" />
                {isSavingFlexbill ? "Guardando..." : "Guardar límite"}
              </button>
              {flexbillSaveStatus === "success" && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Guardado
                </span>
              )}
              {flexbillSaveStatus === "error" && (
                <span className="text-sm text-red-600">Error al guardar</span>
              )}
            </div>
          </div>
        )}
    </SettingsModal>
  );
};

export default ControlFlujoModal;
