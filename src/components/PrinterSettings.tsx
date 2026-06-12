"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Printer,
  RefreshCw,
  Trash2,
  Wifi,
  PrinterCheck,
  Usb,
} from "lucide-react";
import { usePosApi, type Printer as PrinterType } from "../services/posApi";

const ROLE_LABELS: Record<string, string> = {
  bar: "Barra",
  kitchen: "Cocina",
  other: "Otros",
  all: "Todos",
};

const ROLE_COLORS: Record<string, string> = {
  bar: "bg-blue-100 text-blue-700",
  kitchen: "bg-orange-100 text-orange-700",
  other: "bg-gray-100 text-gray-600",
  all: "bg-green-100 text-green-700",
};

interface Props {
  branchId: string;
  agentConnected: boolean;
  tapPayPrint: boolean;
  onTapPayPrintChange: (val: boolean) => void;
  isTapPayEnabled: boolean;
}

interface EditState {
  name: string;
  role: PrinterType["role"];
}

function PrinterCard({
  printer,
  agentConnected,
  onSave,
  onDelete,
  onTest,
  onToggleActive,
}: {
  printer: PrinterType;
  agentConnected: boolean;
  onSave: (p: PrinterType, s: EditState) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTest: (p: PrinterType) => Promise<void>;
  onToggleActive: (p: PrinterType) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(printer.name || "");
  const [editRole, setEditRole] = useState<PrinterType["role"]>(printer.role);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const isUsb = printer.connection_type === "usb";
  const subtitle = isUsb
    ? printer.usb_device_name || "—"
    : `${printer.ip}:${printer.port}`;

  async function handleTest() {
    setTesting(true);
    setTestMsg(null);
    try {
      await onTest(printer);
      setTestMsg({ ok: true, text: "Ticket enviado" });
    } catch (err: any) {
      setTestMsg({ ok: false, text: err.message || "Error al imprimir" });
    } finally {
      setTesting(false);
      setTimeout(() => setTestMsg(null), 4000);
    }
  }

  async function handleSave() {
    await onSave(printer, { name: editName, role: editRole });
    setEditing(false);
  }

  return (
    <div
      className={`border rounded-lg p-3 transition-opacity ${printer.is_active ? "border-gray-200" : "border-gray-100 opacity-50"}`}
    >
      {editing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Nombre (ej. Cocina principal)"
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-green-500"
          />
          <div className="flex gap-2 flex-wrap">
            {(["bar", "kitchen", "other", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setEditRole(r)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  editRole === r
                    ? "bg-custom-green-500 text-white border-transparent"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
            <button
              onClick={() => setEditRole(null)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                editRole === null
                  ? "bg-custom-green-500 text-white border-transparent"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              Sin rol
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-xs font-medium bg-custom-green-500 text-white rounded-md hover:opacity-90"
            >
              Guardar
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Printer className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {printer.name || subtitle}
              </p>
              <p className="text-xs text-gray-400 font-mono truncate">
                {subtitle}
              </p>
            </div>
            {printer.role && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ROLE_COLORS[printer.role]}`}
              >
                {ROLE_LABELS[printer.role]}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onToggleActive(printer)}
              title={printer.is_active ? "Desactivar" : "Activar"}
              className={`w-8 h-4 rounded-full transition-colors ${printer.is_active ? "bg-green-500" : "bg-gray-200"}`}
            >
              <span
                className={`block w-3 h-3 rounded-full bg-white shadow transition-transform mx-0.5 ${printer.is_active ? "translate-x-4" : "translate-x-0"}`}
              />
            </button>
            <button
              onClick={handleTest}
              disabled={testing || !agentConnected}
              title="Imprimir ticket de prueba"
              className="p-1.5 text-gray-400 hover:text-blue-500 rounded-md hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {testing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <PrinterCheck className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => {
                setEditName(printer.name || "");
                setEditRole(printer.role);
                setEditing(true);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={() => onDelete(printer.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {testMsg && (
        <p
          className={`text-xs mt-1 ${testMsg.ok ? "text-green-600" : "text-red-500"}`}
        >
          {testMsg.text}
        </p>
      )}
    </div>
  );
}

export default function PrinterSettings({
  branchId,
  agentConnected,
  tapPayPrint,
  onTapPayPrintChange,
  isTapPayEnabled,
}: Props) {
  const posApi = usePosApi();
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanningWifi, setScanningWifi] = useState(false);
  const [scanningUsb, setScanningUsb] = useState(false);
  const [wifiMsg, setWifiMsg] = useState<{ text: string; ok: boolean } | null>(
    null,
  );
  const [usbMsg, setUsbMsg] = useState<{ text: string; ok: boolean } | null>(
    null,
  );

  const wifiPrinters = printers.filter((p) => p.connection_type !== "usb");
  const usbPrinters = printers.filter((p) => p.connection_type === "usb");

  const loadPrinters = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await posApi.getPrinters(branchId);
      setPrinters(res.printers);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadPrinters();
  }, [loadPrinters]);

  async function handleScanWifi() {
    setScanningWifi(true);
    setWifiMsg(null);
    try {
      const res = await posApi.scanPrinters(branchId);
      setPrinters(res.printers);
      setWifiMsg({
        text:
          res.found > 0
            ? `${res.found} impresora(s) encontrada(s)`
            : "Sin impresoras en la red",
        ok: res.found > 0,
      });
    } catch (err: any) {
      setWifiMsg({ text: err.message || "Error al escanear", ok: false });
    } finally {
      setScanningWifi(false);
    }
  }

  async function handleScanUsb() {
    setScanningUsb(true);
    setUsbMsg(null);
    try {
      const res = await posApi.scanUsbPrinters(branchId);
      setPrinters(res.printers);
      setUsbMsg({
        text:
          res.found > 0
            ? `${res.found} impresora(s) USB detectada(s)`
            : "Sin impresoras USB detectadas",
        ok: res.found > 0,
      });
    } catch (err: any) {
      setUsbMsg({ text: err.message || "Error al detectar USB", ok: false });
    } finally {
      setScanningUsb(false);
    }
  }

  async function handleSave(printer: PrinterType, { name, role }: EditState) {
    try {
      const res = await posApi.updatePrinter(branchId, printer.id, {
        name: name || undefined,
        role,
      });
      setPrinters((prev) =>
        prev.map((p) => (p.id === printer.id ? res.printer : p)),
      );
    } catch {
      // mantener estado
    }
  }

  async function handleDelete(printerId: string) {
    try {
      await posApi.deletePrinter(branchId, printerId);
      setPrinters((prev) => prev.filter((p) => p.id !== printerId));
    } catch {
      // mantener estado
    }
  }

  async function handleTest(printer: PrinterType) {
    await posApi.testPrinter(branchId, printer.id);
  }

  async function handleToggleActive(printer: PrinterType) {
    try {
      const res = await posApi.updatePrinter(branchId, printer.id, {
        is_active: !printer.is_active,
      });
      setPrinters((prev) =>
        prev.map((p) => (p.id === printer.id ? res.printer : p)),
      );
    } catch {
      // mantener estado
    }
  }

  const cardProps = {
    agentConnected,
    onSave: handleSave,
    onDelete: handleDelete,
    onTest: handleTest,
    onToggleActive: handleToggleActive,
  };

  return (
    <div className="space-y-6">
      {/* === Tap & Pay print setting === */}
      {isTapPayEnabled && (
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 mb-3">
            Modo de pago — Tap &amp; Pay
          </h3>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={tapPayPrint}
              onChange={(e) => onTapPayPrintChange(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-custom-green-500 cursor-pointer"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                Imprimir ticket con QR
              </span>
              <p className="text-xs text-gray-400 mt-0.5">
                El mesero podrá imprimir un ticket con código QR para que el
                cliente escanee y pague.
              </p>
            </div>
          </label>
        </div>
      )}

      {/* === WiFi === */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900">
              Impresoras WiFi
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Detecta impresoras en la red local y asigna un rol a cada una.
            </p>
            <div className="mt-3">
              <button
                onClick={handleScanWifi}
                disabled={scanningWifi || !agentConnected}
                title={
                  !agentConnected ? "El agente no está conectado" : undefined
                }
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-custom-green-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <RefreshCw
                  className={`h-4 w-4 ${scanningWifi ? "animate-spin" : ""}`}
                />
                {scanningWifi ? "Escaneando..." : "Escanear red"}
              </button>
              {!agentConnected && (
                <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Agente desconectado
                </p>
              )}
              {wifiMsg && (
                <p
                  className={`mt-2 text-xs font-medium ${wifiMsg.ok ? "text-green-600" : "text-red-500"}`}
                >
                  {wifiMsg.text}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 md:mt-0 md:col-span-2">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                Cargando...
              </div>
            ) : wifiPrinters.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Printer className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Sin impresoras WiFi registradas</p>
                <p className="text-xs mt-1">
                  Usa "Escanear red" para detectarlas
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {wifiPrinters.map((p) => (
                  <PrinterCard key={p.id} printer={p} {...cardProps} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === USB === */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900">
              Impresoras USB
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Impresoras conectadas por USB a la computadora donde corre el
              agente.
            </p>
            <div className="mt-3">
              <button
                onClick={handleScanUsb}
                disabled={scanningUsb || !agentConnected}
                title={
                  !agentConnected ? "El agente no está conectado" : undefined
                }
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-custom-green-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <Usb
                  className={`h-4 w-4 ${scanningUsb ? "animate-pulse" : ""}`}
                />
                {scanningUsb ? "Detectando..." : "Detectar USB"}
              </button>
              {!agentConnected && (
                <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Agente desconectado
                </p>
              )}
              {usbMsg && (
                <p
                  className={`mt-2 text-xs font-medium ${usbMsg.ok ? "text-green-600" : "text-red-500"}`}
                >
                  {usbMsg.text}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 md:mt-0 md:col-span-2">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                Cargando...
              </div>
            ) : usbPrinters.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Usb className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Sin impresoras USB registradas</p>
                <p className="text-xs mt-1">
                  Usa "Detectar USB" para buscarlas
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {usbPrinters.map((p) => (
                  <PrinterCard key={p.id} printer={p} {...cardProps} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
