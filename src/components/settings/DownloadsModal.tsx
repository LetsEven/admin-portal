"use client";

import React, { useEffect, useState } from "react";
import { DownloadIcon } from "lucide-react";
import SettingsModal from "./SettingsModal";
import { useAdminPortalApi } from "../../services/adminPortalApi";

interface DownloadFile {
  name: string;
  filename: string;
  url: string;
}

interface DownloadsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DownloadsModal: React.FC<DownloadsModalProps> = ({ isOpen, onClose }) => {
  const adminPortalApi = useAdminPortalApi();
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchFiles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await adminPortalApi.getDownloads();
        setFiles(data);
      } catch {
        setError("No se pudieron cargar los archivos. Intenta de nuevo.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, [isOpen]);

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Descargas"
      description="Descarga las aplicaciones de Even para tu operación."
      maxWidthClass="max-w-lg"
    >
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-7 w-7 border-2 border-custom-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 py-4 text-center">{error}</p>
      )}

      {!isLoading && !error && files.length === 0 && (
        <p className="text-sm text-gray-500 py-4 text-center">
          No hay archivos disponibles.
        </p>
      )}

      {!isLoading && !error && files.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {files.map((file) => (
            <li
              key={file.name}
              className="flex items-center justify-between py-4 gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {file.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{file.filename}</p>
              </div>
              <a
                href={file.url}
                download={file.filename}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border border-custom-green-300 text-custom-green-700 bg-custom-green-50 hover:bg-custom-green-100 transition-colors"
              >
                <DownloadIcon className="h-4 w-4" />
                Descargar
              </a>
            </li>
          ))}
        </ul>
      )}
    </SettingsModal>
  );
};

export default DownloadsModal;
