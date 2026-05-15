import { useState, useCallback } from "react";
import { CallBackProps, STATUS, Step } from "react-joyride";

interface MenuOnboardingHook {
  run: boolean;
  steps: Step[];
  handleJoyrideCallback: (data: CallBackProps) => void;
  startOnboarding: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

const MENU_ONBOARDING_STORAGE_KEY = "even_menu_onboarding_completed";

// Tema centralizado importado desde utils
export { joyrideTheme, joyrideResponsiveCSS } from "../utils/joyrideTheme";

// Definición de los pasos del tour para la Gestión de Menú
const menuOnboardingSteps: Step[] = [
  {
    target: "body",
    content:
      "¡Bienvenido a la gestión de tu menú! Aquí puedes organizar tus platillos por secciones, editarlos y ver cómo se verán en móvil. Esta guía te mostrará las funcionalidades principales.",
    title: "Gestión de Menú",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="restaurant-header"]',
    content:
      "En esta sección puedes actualizar el nombre de tu restaurante, subir banner y logo, y seleccionar sucursales para filtrar el contenido.",
    title: "Header del Restaurante",
    placement: "bottom",
    offset: 20,
  },
  {
    target: '[data-tour="add-section-btn"]',
    content:
      "Crea secciones para organizar tu menú (ej: Entradas, Platos Principales, Postres). Cada sección agrupa platillos similares.",
    title: "Agregar Sección",
    placement: "bottom",
  },
  {
    target: '[data-tour="mobile-preview-btn"]',
    content:
      "Aquí puedes ver un preview de cómo se verá tu menú en dispositivos móviles.",
    title: "Vista Previa Móvil",
    placement: "bottom",
  },
  {
    target: '[data-tour="section-header"]',
    content:
      "Estas son tus secciones actuales. Puedes reordenarlas, editarlas o eliminarlas desde aquí. El orden aquí es el mismo que verán tus clientes.",
    title: "Secciones del Menú",
    placement: "top",
  },
  {
    target: '[data-tour="menu-item-card"]',
    content:
      "Cada tarjeta representa un platillo. Puedes editarlo, eliminarlo o ver sus detalles desde aquí. También puedes gestionar su disponibilidad por sucursal.",
    title: "Platillos",
    placement: "top",
  },
  {
    target: '[data-tour="add-item-btn"]',
    content:
      "Haz clic aquí para agregar un nuevo platillo a esta sección. Podrás configurar precio, descripción, imagen y disponibilidad por sucursal.",
    title: "Agregar Platillo",
    placement: "top",
  },
];

export const useMenuOnboarding = (): MenuOnboardingHook => {
  const [run, setRun] = useState(false);
  const steps = menuOnboardingSteps;

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Usuario completó o saltó el onboarding del menú
      localStorage.setItem(MENU_ONBOARDING_STORAGE_KEY, "true");
      setRun(false);
    }
  }, []);

  const startOnboarding = useCallback(() => {
    // Verificar si ya completó el onboarding del menú
    const completed = localStorage.getItem(MENU_ONBOARDING_STORAGE_KEY);
    if (!completed) {
      setRun(true);
    }
  }, []);

  const skipOnboarding = useCallback(() => {
    localStorage.setItem(MENU_ONBOARDING_STORAGE_KEY, "true");
    setRun(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(MENU_ONBOARDING_STORAGE_KEY);
    setRun(true);
  }, []);

  return {
    run,
    steps,
    handleJoyrideCallback,
    startOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
};
