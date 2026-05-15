import { useState, useCallback } from "react";
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

const PEPPER_ONBOARDING_STORAGE_KEY = "even_pepper_onboarding_completed";

// Tema centralizado importado desde utils (re-exportado como pepperJoyrideTheme por compatibilidad)
export {
  joyrideTheme as pepperJoyrideTheme,
  joyrideResponsiveCSS,
} from "../utils/joyrideTheme";

// Definición de los pasos del tour para Pepper (2 pasos)
const pepperOnboardingSteps: Step[] = [
  {
    target: "body",
    content:
      "Bienvenido a Pepper, tu asistente AI especializado en optimización de restaurantes. Te ayudará a conocer tus comensales, analizar datos y aumentar tus ventas.",
    title: "Conoce a Pepper",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="chat-input"]',
    content:
      'Escribe cualquier pregunta sobre tu restaurante aquí. Por ejemplo: "¿Qué platillos son los más consumidos?".',
    title: "Haz tus preguntas",
    placement: "top",
    spotlightPadding: 10,
    disableOverlayClose: true,
    hideFooter: false,
    styles: {
      spotlight: {
        borderRadius: "25px",
      },
      tooltip: {
        marginBottom: "15px",
      },
    },
  },
];

export const usePepperOnboarding = (): OnboardingHook => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const steps = pepperOnboardingSteps;

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, index, action } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Usuario completó o saltó el onboarding
      localStorage.setItem(PEPPER_ONBOARDING_STORAGE_KEY, "true");
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
    const completed = localStorage.getItem(PEPPER_ONBOARDING_STORAGE_KEY);
    if (!completed) {
      setRun(true);
      setStepIndex(0);
    }
  }, []);

  const skipOnboarding = useCallback(() => {
    localStorage.setItem(PEPPER_ONBOARDING_STORAGE_KEY, "true");
    setRun(false);
    setStepIndex(0);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(PEPPER_ONBOARDING_STORAGE_KEY);
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
