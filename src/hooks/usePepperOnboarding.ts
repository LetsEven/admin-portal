import { useState, useCallback } from 'react';
import { CallBackProps, STATUS, Step } from 'react-joyride';

interface OnboardingHook {
  run: boolean;
  steps: Step[];
  stepIndex: number;
  handleJoyrideCallback: (data: CallBackProps) => void;
  startOnboarding: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

const PEPPER_ONBOARDING_STORAGE_KEY = 'xquisito_pepper_onboarding_completed';

// Configuración del tema Xquisito para Joyride
export const pepperJoyrideTheme = {
  options: {
    primaryColor: '#2A5A62',    // Verde Xquisito
    backgroundColor: '#ffffff',
    textColor: '#173E44',       // Azul oscuro Xquisito
    overlayColor: 'rgba(23, 62, 68, 0.4)',
    arrowColor: '#2A5A62',
    zIndex: 10000,
    width: 400,
    beaconSize: 36
  },
  tooltip: {
    borderRadius: 12,
    padding: 20
  },
  tooltipContent: {
    padding: '20px 24px'
  },
  tooltipTitle: {
    color: '#173E44',
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '8px'
  },
  tooltipBody: {
    color: '#555555',
    fontSize: '0.95rem',
    lineHeight: '1.5'
  },
  buttonNext: {
    backgroundColor: '#2A5A62',
    fontSize: '0.9rem',
    padding: '10px 20px',
    borderRadius: '8px'
  },
  buttonBack: {
    color: '#2A5A62',
    fontSize: '0.9rem',
    padding: '10px 20px'
  },
  buttonSkip: {
    color: '#888888',
    fontSize: '0.85rem'
  }
};

// Definición de los pasos del tour para Pepper (3 pasos)
const pepperOnboardingSteps: Step[] = [
  {
    target: 'body',
    content: 'Bienvenido a Pepper, tu asistente AI especializado en optimización de restaurantes. Te ayudará a conocer tus comensales, analizar datos y aumentar tus ventas.',
    title: 'Conoce a Pepper',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="pepper-logo"]',
    content: 'Este es Pepper, tu asistente inteligente. Puede ayudarte con análisis de ventas, optimización de precios, sugerencias de promociones y mucho más.',
    title: 'Tu Asistente AI 🎯',
    placement: 'bottom',
  },
  {
    target: '[data-tour="chat-input"]',
    content: 'Escribe cualquier pregunta sobre tu restaurante aquí. Por ejemplo: "¿Qué platillos son los más consumidos?" o "¿Cómo optimizo mi menú?" y presiona enviar.',
    title: 'Haz tus preguntas 💬',
    placement: 'top',
    spotlightPadding: 10,
    disableOverlayClose: true,
    hideFooter: false,
    styles: {
      spotlight: {
        borderRadius: '25px',
      },
      tooltip: {
        marginBottom: '15px'
      }
    }
  }
];

export const usePepperOnboarding = (): OnboardingHook => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const steps = pepperOnboardingSteps;

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, index, action } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Usuario completó o saltó el onboarding
      localStorage.setItem(PEPPER_ONBOARDING_STORAGE_KEY, 'true');
      setRun(false);
      setStepIndex(0);
    } else if (type === 'step:after') {
      if (action === 'next') {
        // Avanzar al siguiente paso
        setStepIndex(index + 1);
      } else if (action === 'prev') {
        // Retroceder al paso anterior
        setStepIndex(index - 1);
      }
    } else if (type === 'step:before') {
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
    localStorage.setItem(PEPPER_ONBOARDING_STORAGE_KEY, 'true');
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
    resetOnboarding
  };
};