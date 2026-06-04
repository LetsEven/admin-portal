"use client";

import React from "react";
import SettingsModal from "./SettingsModal";
import PromotionsManagement from "../../views/PromotionsManagement";

interface DineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DineModal: React.FC<DineModalProps> = ({ isOpen, onClose }) => {
  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Dine"
      description="Gestiona los servicios clave de tu restaurante u hotel para ofrecer
            una operación más eficiente y moderna."
      maxWidthClass="max-w-5xl"
    >
      <PromotionsManagement />
    </SettingsModal>
  );
};

export default DineModal;
