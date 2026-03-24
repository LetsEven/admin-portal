import React, { useState, useEffect } from 'react';
import { RefreshCw, Check, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePosApi, AgentStatus, SyncResult } from '../services/posApi';

interface SyncButtonProps {
  branchId: string | null;
  onSyncComplete?: () => void;
}

const SyncButton: React.FC<SyncButtonProps> = ({ branchId, onSyncComplete }) => {
  const posApi = usePosApi();
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  // Cargar estado del agente cuando cambia la sucursal
  useEffect(() => {
    if (branchId) {
      loadAgentStatus();
    } else {
      setAgentStatus(null);
    }
  }, [branchId]);

  const loadAgentStatus = async () => {
    if (!branchId) return;

    try {
      setIsLoading(true);
      const status = await posApi.getAgentStatus(branchId);
      setAgentStatus(status);
    } catch (error) {
      console.error('Error loading agent status:', error);
      setAgentStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!branchId || !agentStatus?.isAgentConnected) return;

    const loadingToast = toast.loading('Sincronizando menú con POS...');

    try {
      setIsSyncing(true);
      const result = await posApi.syncMenu(branchId);
      setLastSyncResult(result);

      if (result.success) {
        const pulledSections = (result.pulled?.sections.created || 0) + (result.pulled?.sections.updated || 0);
        const pulledItems = (result.pulled?.items.created || 0) + (result.pulled?.items.updated || 0);
        const pushedSections = result.pushed?.sections.created || 0;
        const pushedItems = result.pushed?.items.created || 0;

        toast.success(
          `Sincronización completada:\n` +
          `📥 ${pulledSections} secciones, ${pulledItems} items del POS\n` +
          `📤 ${pushedSections} secciones, ${pushedItems} items al POS`,
          { id: loadingToast, duration: 5000 }
        );

        // Recargar datos del menú
        onSyncComplete?.();
      } else {
        toast.error(
          `Error en sincronización: ${result.errors?.join(', ') || 'Error desconocido'}`,
          { id: loadingToast }
        );
      }
    } catch (error) {
      console.error('Error syncing menu:', error);
      toast.error(
        `Error al sincronizar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        { id: loadingToast }
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // No mostrar si no hay integración POS
  if (!agentStatus?.hasIntegration) {
    return null;
  }

  // Determinar estado visual
  const isConnected = agentStatus.isAgentConnected;
  const isDisabled = isLoading || isSyncing || !isConnected;

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={handleSync}
        disabled={isDisabled}
        className={`inline-flex items-center px-2.5 sm:px-4 py-1.5 sm:py-2 border rounded-md shadow-sm text-xs sm:text-sm font-medium transition-all duration-200 ${
          isDisabled
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        }`}
        title={
          !isConnected
            ? 'Agente POS no conectado'
            : isSyncing
              ? 'Sincronizando...'
              : 'Sincronizar menú con POS'
        }
      >
        {/* Icono de estado de conexión */}
        {isConnected ? (
          <Wifi className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 text-green-500" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 text-red-400" />
        )}

        {/* Icono de sync */}
        <RefreshCw
          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 ${
            isSyncing ? 'animate-spin text-blue-500' : ''
          }`}
        />

        {/* Texto */}
        <span className="hidden sm:inline">
          {isSyncing ? 'Sincronizando...' : 'Sync POS'}
        </span>
        <span className="sm:hidden">
          {isSyncing ? '...' : 'Sync'}
        </span>
      </button>

      {/* Indicador de estado */}
      {!isConnected && (
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
      )}
    </div>
  );
};

export default SyncButton;
