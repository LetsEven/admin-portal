"use client";

import React from "react";
import SettingsModal from "./SettingsModal";
import PrinterSettings from "../PrinterSettings";

interface ImpresorasModalProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  agentConnected: boolean;
}

const ImpresorasModal: React.FC<ImpresorasModalProps> = ({
  isOpen,
  onClose,
  branchId,
  agentConnected,
}) => {
  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Impresoras WiFi & USB"
      description="Detecta y administra las impresoras de esta sucursal."
      maxWidthClass="max-w-4xl"
    >
      <PrinterSettings branchId={branchId} agentConnected={agentConnected} />
    </SettingsModal>
  );
};

export default ImpresorasModal;
