import { useState, useCallback } from "react";
import { CallBackProps, STATUS, Step } from "react-joyride";

interface ServicesOnboardingHook {
  run: boolean;
  steps: Step[];
  handleJoyrideCallback: (data: CallBackProps) => void;
  startOnboarding: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

const SERVICES_ONBOARDING_STORAGE_KEY = "even_services_onboarding_completed";

// Tema centralizado importado desde utils
export { joyrideTheme, joyrideResponsiveCSS } from "../utils/joyrideTheme";

// Definición de los pasos del tour para la Gestión de Servicios
const servicesOnboardingSteps: Step[] = [
  {
    target: "body",
    content:
      "¡Bienvenido a la gestión de servicios! Aquí puedes ver los diferentes servicios de Even para tu negocio.",
    title: "Gestión de Servicios",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="service-status"]',
    content:
      "Los servicios pueden estar activos o inactivos. Contacta a soporte para activar los servicios que necesites.",
    title: "Estado del Servicio",
    placement: "left",
  },
];

export const useServicesOnboarding = (): ServicesOnboardingHook => {
  const [run, setRun] = useState(false);
  const steps = servicesOnboardingSteps;

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Usuario completó o saltó el onboarding de servicios
      localStorage.setItem(SERVICES_ONBOARDING_STORAGE_KEY, "true");
      setRun(false);
    }
  }, []);

  const startOnboarding = useCallback(() => {
    // Verificar si ya completó el onboarding de servicios
    const completed = localStorage.getItem(SERVICES_ONBOARDING_STORAGE_KEY);
    if (!completed) {
      setRun(true);
    }
  }, []);

  const skipOnboarding = useCallback(() => {
    localStorage.setItem(SERVICES_ONBOARDING_STORAGE_KEY, "true");
    setRun(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(SERVICES_ONBOARDING_STORAGE_KEY);
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
