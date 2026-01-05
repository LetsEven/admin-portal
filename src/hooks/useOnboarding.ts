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

const ONBOARDING_STORAGE_KEY = 'xquisito_onboarding_completed';

// Configuración del tema Xquisito para Joyride
export const joyrideTheme = {
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

// Definición de los pasos del tour para el Dashboard
const onboardingSteps: Step[] = [
  {
    target: 'body',
    content: 'Bienvenido al portal de administración. Esta guía rápida te ayudará a comprender las principales funcionalidades y a aprovechar al máximo la información de tu establecimiento.',
    title: 'Bienvenida al portal',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="home-dashboard"]',
    content: 'Este es el botón Home, tu panel principal. Desde aquí puedes visualizar de forma centralizada la actividad general de tu establecimiento.',
    title: 'Home (Dashboard principal)',
    placement: 'right',
    offset: 20
  },
  {
    target: '[data-tour="consumo-activity"]',
    content: 'En el dashboard podrás consultar la actividad de consumo a lo largo del tiempo, incluyendo ingresos y comportamiento diario de tus ventas.',
    title: 'Actividad de consumo 📊',
    placement: 'top',
  },
  {
    target: '[data-tour="filtros-avanzados"]',
    content: 'Utiliza los filtros para profundizar en la información. Puedes segmentar por género, sucursal, edad y granularidad del tiempo lo que te permite analizar con mayor precisión el comportamiento de tus consumidores.',
    title: 'Filtros avanzados 🔍',
    placement: 'bottom',
  },
  {
    target: '[data-tour="actualizar-datos"]',
    content: 'Haz clic en Actualizar para refrescar los datos y asegurarte de estar visualizando la información más reciente disponible.',
    title: 'Actualizar información 🔄',
    placement: 'bottom',
  },
  {
    target: '[data-tour="indicadores-clave"]',
    content: 'Aquí encontrarás indicadores generales que resumen el desempeño del establecimiento, como ventas totales, órdenes, ticket promedio y tiempos de atención.',
    title: 'Indicadores clave 📈',
    placement: 'top',
  },
  {
    target: '[data-tour="actividad-reciente"]',
    content: 'En esta sección se muestra la actividad reciente, reflejando las órdenes realizadas y el estado actual de la operación.',
    title: 'Actividad reciente 📝',
    placement: 'top',
  }
];

export const useOnboarding = (): OnboardingHook => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const steps = onboardingSteps;

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, index, action } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Usuario completó o saltó el onboarding
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
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
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!completed) {
      setRun(true);
      setStepIndex(0);
    }
  }, []);

  const skipOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
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
    resetOnboarding
  };
};