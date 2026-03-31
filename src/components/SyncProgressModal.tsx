import React, { useEffect, useState, useCallback } from "react";
import {
  X,
  CheckCircle,
  XCircle,
  Loader2,
  Database,
  Upload,
  Download,
  RefreshCw,
} from "lucide-react";
import { useSocketContext } from "../contexts/SocketContext";
import { SyncResult } from "../services/posApi";

interface ProgressInfo {
  current: number;
  total: number;
  type: string;
}

interface StepProgress {
  sections?: { current: number; total: number };
  items?: { current: number; total: number };
}

interface SyncStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: "pending" | "in_progress" | "completed" | "error";
  progress?: StepProgress;
}

interface SyncProgressEvent {
  branchId: string;
  step: "connecting" | "pulling" | "pushing" | "finalizing" | "error";
  status: "started" | "in_progress" | "completed" | "error";
  details: {
    message: string;
    progress?: ProgressInfo;
    totalGroups?: number;
    totalProducts?: number;
    totalSections?: number;
    totalItems?: number;
    sections?: { created: number; updated: number };
    items?: { created: number; updated: number };
    result?: SyncResult;
    errors?: string[];
  };
  timestamp: string;
}

interface SyncProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string | null;
  onSyncComplete?: () => void;
}

const SyncProgressModal: React.FC<SyncProgressModalProps> = ({
  isOpen,
  onClose,
  branchId,
  onSyncComplete,
}) => {
  const { socket } = useSocketContext();
  const [steps, setSteps] = useState<SyncStep[]>([
    {
      id: "pulling",
      label: "Obteniendo datos del POS",
      icon: <Download className="h-5 w-5" />,
      status: "pending",
    },
    {
      id: "pushing",
      label: "Enviando cambios al POS",
      icon: <Upload className="h-5 w-5" />,
      status: "pending",
    },
  ]);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSteps([
        {
          id: "pulling",
          label: "Obteniendo datos del POS",
          icon: <Download className="h-5 w-5" />,
          status: "pending",
        },
        {
          id: "pushing",
          label: "Enviando cambios al POS",
          icon: <Upload className="h-5 w-5" />,
          status: "pending",
        },
      ]);
      setSyncResult(null);
      setError(null);
      setIsComplete(false);
    }
  }, [isOpen]);

  // Listen for sync progress events
  const handleSyncProgress = useCallback(
    (event: SyncProgressEvent) => {
      console.log("📡 Sync progress received:", event);

      // Only process events for this branch
      if (event.branchId !== branchId) return;

      // Update step status and progress (only for pulling and pushing)
      if (event.step === "pulling" || event.step === "pushing") {
        setSteps((prev) =>
          prev.map((step) => {
            if (step.id === event.step) {
              let newStatus: SyncStep["status"] = "pending";
              if (
                event.status === "started" ||
                event.status === "in_progress"
              ) {
                newStatus = "in_progress";
              } else if (event.status === "completed") {
                newStatus = "completed";
              } else if (event.status === "error") {
                newStatus = "error";
              }

              // Update progress info
              let progress = step.progress || {};

              // Handle totals from initial messages
              if (event.details.totalGroups !== undefined) {
                progress.sections = {
                  current: 0,
                  total: event.details.totalGroups,
                };
              }
              if (event.details.totalProducts !== undefined) {
                progress.items = {
                  current: 0,
                  total: event.details.totalProducts,
                };
              }
              if (event.details.totalSections !== undefined) {
                progress.sections = {
                  current: 0,
                  total: event.details.totalSections,
                };
              }
              if (event.details.totalItems !== undefined) {
                progress.items = {
                  current: 0,
                  total: event.details.totalItems,
                };
              }

              // Handle progress updates
              if (event.details.progress) {
                const { current, total, type } = event.details.progress;
                if (type === "sections") {
                  progress.sections = { current, total };
                } else if (type === "items") {
                  progress.items = { current, total };
                }
              }

              return { ...step, status: newStatus, progress };
            }
            return step;
          }),
        );
      }

      // Handle completion
      if (event.step === "finalizing" && event.status === "completed") {
        setIsComplete(true);
        if (event.details.result) {
          setSyncResult(event.details.result);
        }
        onSyncComplete?.();
      }

      // Handle error
      if (event.status === "error") {
        setError(event.details.message);
        setIsComplete(true);
        setSteps((prev) =>
          prev.map((step) =>
            step.status === "pending" ? { ...step, status: "error" } : step,
          ),
        );
      }
    },
    [branchId, onSyncComplete],
  );

  useEffect(() => {
    if (!socket || !isOpen) return;

    socket.on("sync:progress", handleSyncProgress);

    return () => {
      socket.off("sync:progress", handleSyncProgress);
    };
  }, [socket, isOpen, handleSyncProgress]);

  if (!isOpen) return null;

  const getStatusIcon = (status: SyncStep["status"]) => {
    switch (status) {
      case "pending":
        return (
          <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
        );
      case "in_progress":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const renderProgressBar = (current: number, total: number, color: string) => {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    return (
      <div className="w-full">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>
            {current} / {total}
          </span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const canClose = isComplete;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-35 backdrop-blur-[6px]"
        onClick={canClose ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md p-6 mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-200 ease-out">
        {/* Close button */}
        {canClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {error
              ? "Error en Sincronización"
              : syncResult?.success
                ? "Sincronización Completada"
                : "Sincronizando con POS"}
          </h2>
          {!isComplete && (
            <p className="text-xs text-amber-600 mt-1">
              Por favor no cierres esta ventana hasta que termine el proceso
            </p>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`p-3 rounded-lg transition-colors ${
                step.status === "in_progress"
                  ? "bg-blue-50"
                  : step.status === "completed"
                    ? "bg-green-50"
                    : step.status === "error"
                      ? "bg-red-50"
                      : "bg-gray-50"
              }`}
            >
              {/* Step header */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-shrink-0 text-gray-400">{step.icon}</div>
                <span
                  className={`text-sm font-medium ${
                    step.status === "in_progress"
                      ? "text-blue-700"
                      : step.status === "completed"
                        ? "text-green-700"
                        : step.status === "error"
                          ? "text-red-700"
                          : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Progress details */}
              {step.status === "in_progress" && step.progress && (
                <div className="mt-3 pl-8 space-y-2">
                  {step.progress.sections &&
                    step.progress.sections.total > 0 && (
                      <div>
                        <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          <span>Secciones</span>
                        </div>
                        {renderProgressBar(
                          step.progress.sections.current,
                          step.progress.sections.total,
                          "bg-blue-500",
                        )}
                      </div>
                    )}
                  {step.progress.items && step.progress.items.total > 0 && (
                    <div>
                      <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" />
                        <span>Items</span>
                      </div>
                      {renderProgressBar(
                        step.progress.items.current,
                        step.progress.items.total,
                        "bg-green-500",
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Completed summary */}
              {step.status === "completed" && step.progress && (
                <div className="mt-2 pl-8 flex gap-4 text-xs text-gray-600">
                  {step.progress.sections &&
                    step.progress.sections.total > 0 && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {step.progress.sections.total} secciones
                      </span>
                    )}
                  {step.progress.items && step.progress.items.total > 0 && (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {step.progress.items.total} items
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Results */}
        {syncResult?.success && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Resumen:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600">
                  {(syncResult.pulled?.sections.created || 0) +
                    (syncResult.pulled?.sections.updated || 0)}{" "}
                  secciones,{" "}
                  {(syncResult.pulled?.items.created || 0) +
                    (syncResult.pulled?.items.updated || 0)}{" "}
                  items del POS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-green-500" />
                <span className="text-gray-600">
                  {syncResult.pushed?.sections.created || 0} secciones,{" "}
                  {syncResult.pushed?.items.created || 0} items al POS
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Close button */}
        {canClose && (
          <button
            onClick={onClose}
            className={`w-full py-2.5 px-4 rounded-lg font-medium text-white transition-colors ${
              error
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {error ? "Cerrar" : "Listo"}
          </button>
        )}
      </div>
    </div>
  );
};

export default SyncProgressModal;
