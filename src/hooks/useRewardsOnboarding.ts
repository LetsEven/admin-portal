import { useState, useCallback } from "react";
import { CallBackProps, STATUS, Step } from "react-joyride";

interface RewardsOnboardingHook {
  run: boolean;
  steps: Step[];
  handleJoyrideCallback: (data: CallBackProps) => void;
  startOnboarding: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

const REWARDS_ONBOARDING_STORAGE_KEY = "even_rewards_onboarding_completed";

// Tema centralizado importado desde utils
export { joyrideTheme, joyrideResponsiveCSS } from "../utils/joyrideTheme";

// Definición de los pasos del tour para la Gestión de Recompensas
const rewardsOnboardingSteps: Step[] = [
  {
    target: "body",
    content:
      "¡Bienvenido a la gestión de recompensas Scala! Aquí puedes crear y gestionar campañas de fidelización para tus clientes.",
    title: "Gestión de Recompensas",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="plan-info"]',
    content:
      'Aquí puedes ver tu plan actual y cuántas campañas puedes crear este mes. Haz clic en "Ver Planes" para conocer más opciones.',
    title: "Información del Plan",
    placement: "bottom",
  },
  {
    target: '[data-tour="new-campaign-btn"]',
    content:
      "Haz clic aquí para crear una nueva campaña de recompensas. Podrás configurar promociones, segmentos de clientes y plantillas de mensajes.",
    title: "Nueva Campaña",
    placement: "bottom",
  },
  {
    target: '[data-tour="kpi-filters"]',
    content:
      "Usa estos filtros para ver campañas por estado: todas, activas, pausadas o expiradas. Los números muestran cuántas tienes de cada tipo.",
    title: "Filtros de Estado",
    placement: "top",
  },
  {
    target: '[data-tour="campaigns-grid"]',
    content:
      "Aquí aparecen tus campañas creadas. Haz clic en cualquier tarjeta para ver detalles, estadísticas y gestionar la campaña.",
    title: "Campañas Existentes",
    placement: "top",
  },
];

export const useRewardsOnboarding = (): RewardsOnboardingHook => {
  const [run, setRun] = useState(false);
  const steps = rewardsOnboardingSteps;

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Usuario completó o saltó el onboarding de recompensas
      localStorage.setItem(REWARDS_ONBOARDING_STORAGE_KEY, "true");
      setRun(false);
    }
  }, []);

  const startOnboarding = useCallback(() => {
    // Verificar si ya completó el onboarding de recompensas
    const completed = localStorage.getItem(REWARDS_ONBOARDING_STORAGE_KEY);
    if (!completed) {
      setRun(true);
    }
  }, []);

  const skipOnboarding = useCallback(() => {
    localStorage.setItem(REWARDS_ONBOARDING_STORAGE_KEY, "true");
    setRun(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(REWARDS_ONBOARDING_STORAGE_KEY);
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
