"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRestaurant } from "../hooks/useRestaurant";
import {
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

interface Invoice {
  id: string;
  folio_number: number;
  series: string;
  created_at: string;
  customer: {
    legal_name: string;
    tax_id: string;
  };
  total: number;
  currency: string;
  status: string;
  uuid?: string;
}

interface InvoicesResponse {
  data: Invoice[];
  total_pages: number;
  total_results: number;
  page: number;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  valid: {
    label: "Válida",
    className: "bg-green-100 text-green-800",
  },
  canceled: {
    label: "Cancelada",
    className: "bg-red-100 text-red-800",
  },
};

type InvoiceType = "moral" | "fisica" | "publico_general" | "unknown";

const TYPE_LABELS: Record<InvoiceType, { label: string; className: string }> = {
  moral: { label: "Persona moral", className: "bg-blue-100 text-blue-800" },
  fisica: {
    label: "Persona física",
    className: "bg-purple-100 text-purple-800",
  },
  publico_general: {
    label: "Público en general",
    className: "bg-gray-100 text-gray-700",
  },
  unknown: { label: "—", className: "bg-gray-100 text-gray-500" },
};

// Mirrors getInvoiceType in even-backend's invoiceController.js — keep in sync.
function getInvoiceType(taxId?: string): InvoiceType {
  if (!taxId) return "unknown";
  if (taxId === "XAXX010101000") return "publico_general";
  if (taxId.length === 12) return "moral";
  if (taxId.length === 13) return "fisica";
  return "unknown";
}

type SortField =
  | "created_at"
  | "total"
  | "folio"
  | "tax_id"
  | "legal_name"
  | "status"
  | "type";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number, currency = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
  }).format(amount);
}

function SortableHeader({
  label,
  field,
  sortBy,
  sortDir,
  onSort,
  align = "left",
}: {
  label: string;
  field: SortField;
  sortBy: SortField;
  sortDir: "asc" | "desc";
  onSort: (field: SortField) => void;
  align?: "left" | "right" | "center";
}) {
  const isActive = sortBy === field;
  const Icon = isActive
    ? sortDir === "asc"
      ? ChevronUp
      : ChevronDown
    : ChevronsUpDown;
  const justify =
    align === "right"
      ? "justify-end"
      : align === "center"
        ? "justify-center"
        : "justify-start";

  return (
    <th
      className={`px-4 py-3 text-${align} text-xs font-medium text-gray-500 uppercase tracking-wider`}
    >
      <button
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 ${justify} hover:text-gray-700 transition-colors w-full`}
      >
        {label}
        <Icon
          className={`h-3 w-3 ${isActive ? "text-custom-green-600" : "text-gray-400"}`}
        />
      </button>
    </th>
  );
}

export default function InvoicesList() {
  const { getToken } = useAuth();
  const { restaurant, isLoading: restaurantLoading } = useRestaurant();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(e.target as Node)
      ) {
        setIsDatePickerOpen(false);
      }
    }
    if (isDatePickerOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDatePickerOpen]);

  const [rfcFilter, setRfcFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<InvoiceType | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const toggleSort = (field: SortField) => {
    setPage(1);
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [earliestMonth, setEarliestMonth] = useState<{
    year: number;
    month: number;
  } | null>(null);

  const isCurrentMonth =
    month === now.getMonth() + 1 && year === now.getFullYear();

  const isEarliestMonth =
    !earliestMonth ||
    year < earliestMonth.year ||
    (year === earliestMonth.year && month <= earliestMonth.month);

  const goToPreviousMonth = () => {
    if (isEarliestMonth) return;
    setPage(1);
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    setPage(1);
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  const pad = (n: number) => String(n).padStart(2, "0");
  const monthRangeStart = `${year}-${pad(month)}-01`;
  const monthLastDay = new Date(year, month, 0).getDate();
  const monthRangeEnd = `${year}-${pad(month)}-${pad(monthLastDay)}`;

  // Date filters are scoped to the selected month, so switching months clears
  // any range that would now fall outside it instead of silently zeroing results.
  useEffect(() => {
    setDateFrom("");
    setDateTo("");
  }, [month, year]);

  const restaurantId = restaurant?.id;

  const fetchInvoices = useCallback(async () => {
    if (!restaurantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const params = new URLSearchParams({
        restaurantId: String(restaurantId),
        page: String(page),
        limit: "15",
        month: String(month),
        year: String(year),
        sortBy,
        sortDir,
      });
      if (rfcFilter) params.set("rfc", rfcFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`${API_BASE_URL}/api/invoices?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Error al cargar facturas");
      }

      const json: { success: boolean; data: InvoicesResponse } =
        await res.json();
      setInvoices(json.data.data || []);
      setTotalPages(json.data.total_pages || 1);
      setTotalResults(json.data.total_results || 0);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }, [
    restaurantId,
    page,
    month,
    year,
    rfcFilter,
    typeFilter,
    dateFrom,
    dateTo,
    sortBy,
    sortDir,
    getToken,
  ]);

  useEffect(() => {
    if (!restaurantLoading && restaurantId) {
      fetchInvoices();
    }
  }, [fetchInvoices, restaurantLoading, restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(
          `${API_BASE_URL}/api/invoices/earliest-month?restaurantId=${restaurantId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) return;
        const json: {
          success: boolean;
          data: { year: number; month: number } | null;
        } = await res.json();
        setEarliestMonth(json.data || null);
      } catch {
        // Selector still works without this; "previous" just won't be capped.
      }
    })();
  }, [restaurantId, getToken]);

  const handleDownload = async (invoice: Invoice) => {
    setDownloadingId(invoice.id);
    try {
      const token = await getToken();
      const res = await fetch(
        `${API_BASE_URL}/api/invoices/${invoice.id}/pdf?restaurantId=${restaurantId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) throw new Error("Error al descargar PDF");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `factura-${invoice.series}${invoice.folio_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading invoice PDF:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const noFacturapiKey = !restaurant?.facturapiApiKey;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            Facturas
          </h1>
          {totalResults > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {totalResults} factura{totalResults !== 1 ? "s" : ""} en total
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div ref={datePickerRef} className="relative">
            <div className="flex items-center gap-1 px-1 py-1 bg-white border border-gray-300 rounded-lg">
              <button
                onClick={goToPreviousMonth}
                disabled={isLoading || isEarliestMonth}
                className="inline-flex items-center justify-center p-1.5 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-40 transition-colors"
                title="Mes anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsDatePickerOpen((o) => !o)}
                className="px-2 text-sm font-medium text-gray-700 capitalize min-w-[140px] text-center hover:bg-gray-100 rounded-md py-0.5 transition-colors"
              >
                {monthLabel}
                {(dateFrom || dateTo) && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-custom-green-500 align-middle" />
                )}
              </button>
              <button
                onClick={goToNextMonth}
                disabled={isLoading || isCurrentMonth}
                className="inline-flex items-center justify-center p-1.5 text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-40 transition-colors"
                title="Mes siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            {isDatePickerOpen && (
              <div className="absolute top-full left-0 mt-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex flex-col gap-3 min-w-[220px]">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Desde
                  </p>
                  <input
                    type="date"
                    value={dateFrom}
                    min={monthRangeStart}
                    max={dateTo || monthRangeEnd}
                    onChange={(e) => {
                      setPage(1);
                      setDateFrom(e.target.value);
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-custom-green-500"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Hasta
                  </p>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || monthRangeStart}
                    max={monthRangeEnd}
                    onChange={(e) => {
                      setPage(1);
                      setDateTo(e.target.value);
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-custom-green-500"
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => {
                      setPage(1);
                      setDateFrom("");
                      setDateTo("");
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 text-left transition-colors"
                  >
                    Limpiar fechas
                  </button>
                )}
              </div>
            )}
          </div>
          <input
            type="text"
            value={rfcFilter}
            onChange={(e) => {
              setPage(1);
              setRfcFilter(e.target.value);
            }}
            placeholder="Buscar por RFC"
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-custom-green-500 w-40"
          />
          <select
            value={typeFilter}
            onChange={(e) => {
              setPage(1);
              setTypeFilter(e.target.value as InvoiceType | "");
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-custom-green-500"
          >
            <option value="">Todos los tipos</option>
            <option value="moral">Persona moral</option>
            <option value="fisica">Persona física</option>
            <option value="publico_general">Público en general</option>
          </select>
          {(rfcFilter || typeFilter || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setPage(1);
                setRfcFilter("");
                setTypeFilter("");
                setDateFrom("");
                setDateTo("");
              }}
              className="px-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Limpiar
            </button>
          )}
          <button
            onClick={fetchInvoices}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* No API key warning */}
      {!restaurantLoading && noFacturapiKey && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">
              Este restaurante aún no tiene configurada la facturación
              electrónica.
            </p>
            <p className="text-xs mt-0.5 text-amber-700">
              Contacta a Even para que se configuren los datos fiscales del
              negocio.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="h-8 w-8 border-2 border-custom-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-red-600">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchInvoices}
              className="text-xs underline text-gray-500 hover:text-gray-700"
            >
              Reintentar
            </button>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
            <p className="text-sm">No hay facturas emitidas aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortableHeader
                    label="Folio"
                    field="folio"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Fecha"
                    field="created_at"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="RFC receptor"
                    field="tax_id"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Razón Social"
                    field="legal_name"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortableHeader
                    label="Tipo"
                    field="type"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={toggleSort}
                    align="center"
                  />
                  <SortableHeader
                    label="Total"
                    field="total"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={toggleSort}
                    align="right"
                  />
                  <SortableHeader
                    label="Estado"
                    field="status"
                    sortBy={sortBy}
                    sortDir={sortDir}
                    onSort={toggleSort}
                    align="center"
                  />
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PDF
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {invoices.map((inv) => {
                  const status = STATUS_LABELS[inv.status] || {
                    label: inv.status,
                    className: "bg-gray-100 text-gray-700",
                  };
                  const type =
                    TYPE_LABELS[getInvoiceType(inv.customer?.tax_id)];
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">
                        {inv.series}
                        {inv.folio_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(inv.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-700">
                        {inv.customer?.tax_id || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                        {inv.customer?.legal_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${type.className}`}
                        >
                          {type.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(inv.total, inv.currency)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDownload(inv)}
                          disabled={downloadingId === inv.id}
                          className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-custom-green-700 hover:bg-custom-green-50 rounded-lg transition-colors disabled:opacity-40"
                          title="Descargar PDF"
                        >
                          {downloadingId === inv.id ? (
                            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Siguiente
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
