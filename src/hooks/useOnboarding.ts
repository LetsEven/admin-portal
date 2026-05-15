import { useState, useCallback, useMemo } from "react";
import { CallBackProps, STATUS, Step } from "react-joyride";

interface OnboardingHook {
  run: boolean;
  steps: Step[];
  stepIndex: number;
  handleJoyrideCallback: (data: CallBackProps) => void;
  startOnboarding: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

const ONBOARDING_STORAGE_KEY = "even_onboarding_completed";

// Tema centralizado importado desde utils
export { joyrideTheme, joyrideResponsiveCSS } from "../utils/joyrideTheme";

// Genera los pasos del tour con placement responsive para el sidebar
const getOnboardingSteps = (isMobile: boolean): Step[] => [
  {
    target: "body",
    content:
      "Bienvenido al portal de administración. Esta guía rápida te ayudará a comprender las principales funcionalidades y a aprovechar al máximo la información de tu establecimiento.",
    title: "Bienvenida al portal",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="home-dashboard"]',
    content:
      "Este es el botón Home, tu panel principal. Desde aquí puedes visualizar de forma centralizada la actividad general de tu establecimiento.",
    title: "Home (Dashboard principal)",
    placement: isMobile ? "center" : "right",
    offset: 20,
  },
  {
    target: '[data-tour="consumo-activity"]',
    content:
      "En el dashboard podrás consultar la actividad de consumo a lo largo del tiempo, incluyendo ingresos y comportamiento diario de tus ventas.",
    title: "Actividad de consumo",
    placement: "top",
  },
  {
    target: '[data-tour="filtros-avanzados"]',
    content:
      "Utiliza los filtros para profundizar en la información. Puedes segmentar por género, sucursal, edad y granularidad del tiempo lo que te permite analizar con mayor precisión el comportamiento de tus consumidores.",
    title: "Filtros avanzados",
    placement: "bottom",
  },
  {
    target: '[data-tour="actualizar-datos"]',
    content:
      "Haz clic en Actualizar para refrescar los datos y asegurarte de estar visualizando la información más reciente disponible.",
    title: "Actualizar información",
    placement: "bottom",
  },
  {
    target: '[data-tour="indicadores-clave"]',
    content:
      "Aquí encontrarás indicadores generales que resumen el desempeño del establecimiento, como ventas totales, órdenes, ticket promedio y tiempos de atención.",
    title: "Indicadores clave",
    placement: "top",
  },
  {
    target: '[data-tour="actividad-reciente"]',
    content:
      "En esta sección se muestra la actividad reciente, reflejando las órdenes realizadas y el estado actual de la operación.",
    title: "Actividad reciente",
    placement: "top",
  },
];

export const useOnboarding = (): OnboardingHook => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const steps = useMemo(() => getOnboardingSteps(isMobile), [isMobile]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, index, action } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      // Usuario completó o saltó el onboarding
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      setRun(false);
      setStepIndex(0);
    } else if (type === "step:after") {
      if (action === "next") {
        // Avanzar al siguiente paso
        setStepIndex(index + 1);
      } else if (action === "prev") {
        // Retroceder al paso anterior
        setStepIndex(index - 1);
      }
    } else if (type === "step:before") {
      // Actualizar índice del paso actual
      setStepIndex(index);
    }
  }, []);

  const startOnboarding = useCallback(() => {
    // Verificar si ya completó el onboarding
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!completed) {
      setRun(true);
      setStepIndex(0);
    }
  }, []);

  const skipOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setRun(false);
    setStepIndex(0);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setRun(true);
    setStepIndex(0);
  }, []);

  return {
    run,
    steps,
    stepIndex,
    handleJoyrideCallback,
    startOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
};
