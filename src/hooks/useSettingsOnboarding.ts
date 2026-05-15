import { useState, useCallback } from "react";
import { CallBackProps, STATUS, Step } from "react-joyride";

interface SettingsOnboardingHook {
  run: boolean;
  steps: Step[];
  handleJoyrideCallback: (data: CallBackProps) => void;
  startOnboarding: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

const SETTINGS_ONBOARDING_STORAGE_KEY = "even_settings_onboarding_completed";

// Tema centralizado importado desde utils
export { joyrideTheme, joyrideResponsiveCSS } from "../utils/joyrideTheme";

// Definición de los pasos del tour para Configuraciones
const settingsOnboardingSteps: Step[] = [
  {
    target: "body",
    content:
      "¡Bienvenido a la configuración! Aquí puedes personalizar la información de tu restaurante, horarios y preferencias.",
    title: "Configuraciones",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="restaurant-info"]',
    content:
      "Configura los datos básicos de tu restaurante: nombre, dirección, contacto y logo. Esta información se mostrará a tus clientes.",
    title: "Información del Restaurante",
    placement: "top",
  },
  {
    target: '[data-tour="opening-hours"]',
    content:
      "Define los horarios de apertura por día. Puedes marcar días como cerrados y establecer horarios específicos para cada día de la semana.",
    title: "Horarios de Apertura",
    placement: "top",
  },
  {
    target: '[data-tour="branches-tables"]',
    content:
      "Alterna entre tus sucursales y comprueba tu información. Aqui podrás alternar entre tus sucursales y podras validar la información de cada una de ellas.",
    title: "Sucursales y Mesas",
    placement: "top",
  },
  {
    target: '[data-tour="notifications"]',
    content:
      "Configura cómo quieres recibir notificaciones: por email, SMS sobre nuevos pedidos. Personaliza tu experiencia.",
    title: "Notificaciones",
    placement: "top",
  },
  {
    target: '[data-tour="save-button"]',
    content:
      "¡No olvides guardar! Haz clic aquí para aplicar todos los cambios realizados en la configuración.",
    title: "Guardar Cambios",
    placement: "top",
  },
];

export const useSettingsOnboarding = (): SettingsOnboardingHook => {
  const [run, setRun] = useState(false);
  const steps = settingsOnboardingSteps;

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Usuario completó o saltó el onboarding de configuraciones
      localStorage.setItem(SETTINGS_ONBOARDING_STORAGE_KEY, "true");
      setRun(false);
    }
  }, []);

  const startOnboarding = useCallback(() => {
    // Verificar si ya completó el onboarding de configuraciones
    const completed = localStorage.getItem(SETTINGS_ONBOARDING_STORAGE_KEY);
    if (!completed) {
      setRun(true);
    }
  }, []);

  const skipOnboarding = useCallback(() => {
    localStorage.setItem(SETTINGS_ONBOARDING_STORAGE_KEY, "true");
    setRun(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(SETTINGS_ONBOARDING_STORAGE_KEY);
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
