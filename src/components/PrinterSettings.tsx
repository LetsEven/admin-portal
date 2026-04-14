'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Printer, RefreshCw, Trash2, Wifi, PrinterCheck } from 'lucide-react';
import { usePosApi, type Printer as PrinterType } from '../services/posApi';

const ROLE_LABELS: Record<string, string> = {
  bar: 'Barra',
  kitchen: 'Cocina',
  other: 'Otros',
  all: 'Todos',
};

const ROLE_COLORS: Record<string, string> = {
  bar: 'bg-blue-100 text-blue-700',
  kitchen: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-600',
  all: 'bg-green-100 text-green-700',
};

interface Props {
  branchId: string;
  agentConnected: boolean;
}

export default function PrinterSettings({ branchId, agentConnected }: Props) {
  const posApi = usePosApi();
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<PrinterType['role']>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null);

  const loadPrinters = useCallback(async () => {
    if (!branchId) return;
    try {
      const res = await posApi.getPrinters(branchId);
      setPrinters(res.printers);
    } catch {
      // silencioso — puede no tener impresoras aún
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadPrinters();
  }, [loadPrinters]);

  async function handleScan() {
    setScanning(true);
    setScanMsg(null);
    try {
      const res = await posApi.scanPrinters(branchId);
      setPrinters(res.printers);
      setScanMsg({
        text: res.found > 0
          ? `${res.found} impresora(s) encontrada(s)`
          : 'Sin impresoras en la red',
        ok: res.found > 0,
      });
    } catch (err: any) {
      setScanMsg({ text: err.message || 'Error al escanear', ok: false });
    } finally {
      setScanning(false);
    }
  }

  function startEdit(printer: PrinterType) {
    setEditingId(printer.id);
    setEditName(printer.name || '');
    setEditRole(printer.role);
  }

  async function saveEdit(printer: PrinterType) {
    try {
      const res = await posApi.updatePrinter(branchId, printer.id, {
        name: editName || undefined,
        role: editRole,
      });
      setPrinters((prev) => prev.map((p) => (p.id === printer.id ? res.printer : p)));
    } catch {
      // mantener estado
    } finally {
      setEditingId(null);
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
    setTestingId(printer.id);
    setTestMsg(null);
    try {
      await posApi.testPrinter(branchId, printer.id);
      setTestMsg({ id: printer.id, ok: true, text: 'Ticket enviado' });
    } catch (err: any) {
      setTestMsg({ id: printer.id, ok: false, text: err.message || 'Error al imprimir' });
    } finally {
      setTestingId(null);
      setTimeout(() => setTestMsg(null), 4000);
    }
  }

  async function toggleActive(printer: PrinterType) {
    try {
      const res = await posApi.updatePrinter(branchId, printer.id, {
        is_active: !printer.is_active,
      });
      setPrinters((prev) => prev.map((p) => (p.id === printer.id ? res.printer : p)));
    } catch {
      // mantener estado
    }
  }

  return (
    <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        {/* Header */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900">
              Impresoras WiFi
            </h3>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Detecta impresoras en la red local y asigna un rol a cada una.
          </p>
          <div className="mt-3">
            <button
              onClick={handleScan}
              disabled={scanning || !agentConnected}
              title={!agentConnected ? 'El agente no está conectado' : undefined}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-custom-green-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Escaneando...' : 'Escanear red'}
            </button>
            {!agentConnected && (
              <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                Agente desconectado
              </p>
            )}
            {scanMsg && (
              <p className={`mt-2 text-xs font-medium ${scanMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                {scanMsg.text}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mt-5 md:mt-0 md:col-span-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              Cargando...
            </div>
          ) : printers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Printer className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sin impresoras registradas</p>
              <p className="text-xs mt-1">Usa "Escanear red" para detectarlas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {printers.map((printer) => (
                <div
                  key={printer.id}
                  className={`border rounded-lg p-3 transition-opacity ${printer.is_active ? 'border-gray-200' : 'border-gray-100 opacity-50'}`}
                >
                  {editingId === printer.id ? (
                    /* Edit mode */
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Nombre (ej. Cocina principal)"
                          className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-green-500"
                        />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {(['bar', 'kitchen', 'other', 'all'] as const).map((r) => (
                          <button
                            key={r}
                            onClick={() => setEditRole(r)}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                              editRole === r
                                ? 'bg-custom-green-500 text-white border-transparent'
                                : 'border-gray-200 text-gray-600 hover:border-gray-400'
                            }`}
                          >
                            {ROLE_LABELS[r]}
                          </button>
                        ))}
                        <button
                          onClick={() => setEditRole(null)}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            editRole === null
                              ? 'bg-custom-green-500 text-white border-transparent'
                              : 'border-gray-200 text-gray-600 hover:border-gray-400'
                          }`}
                        >
                          Sin rol
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(printer)}
                          className="px-3 py-1.5 text-xs font-medium bg-custom-green-500 text-white rounded-md hover:opacity-90"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View mode */
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Printer className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {printer.name || printer.ip}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">
                            {printer.ip}:{printer.port}
                          </p>
                        </div>
                        {printer.role && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ROLE_COLORS[printer.role]}`}>
                            {ROLE_LABELS[printer.role]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => toggleActive(printer)}
                          title={printer.is_active ? 'Desactivar' : 'Activar'}
                          className={`w-8 h-4 rounded-full transition-colors ${printer.is_active ? 'bg-green-500' : 'bg-gray-200'}`}
                        >
                          <span className={`block w-3 h-3 rounded-full bg-white shadow transition-transform mx-0.5 ${printer.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <button
                          onClick={() => handleTest(printer)}
                          disabled={testingId === printer.id || !agentConnected}
                          title="Imprimir ticket de prueba"
                          className="p-1.5 text-gray-400 hover:text-blue-500 rounded-md hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {testingId === printer.id
                            ? <RefreshCw className="h-4 w-4 animate-spin" />
                            : <PrinterCheck className="h-4 w-4" />
                          }
                        </button>
                        <button
                          onClick={() => startEdit(printer)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(printer.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {testMsg?.id === printer.id && (
                        <p className={`text-xs mt-1 ${testMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
                          {testMsg.text}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
