import { useState, useCallback } from 'react';
import { CallBackProps, STATUS, Step } from 'react-joyride';

interface RewardsOnboardingHook {
  run: boolean;
  steps: Step[];
  handleJoyrideCallback: (data: CallBackProps) => void;
  startOnboarding: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

const REWARDS_ONBOARDING_STORAGE_KEY = 'xquisito_rewards_onboarding_completed';

// Configuración del tema Xquisito para Joyride (reutilizamos el tema)
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

// Definición de los pasos del tour para la Gestión de Recompensas
const rewardsOnboardingSteps: Step[] = [
  {
    target: 'body',
    content: '¡Bienvenido a la gestión de recompensas Scala! Aquí puedes crear y gestionar campañas de fidelización para tus clientes.',
    title: 'Gestión de Recompensas',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="plan-info"]',
    content: 'Aquí puedes ver tu plan actual y cuántas campañas puedes crear este mes. Haz clic en "Ver Planes" para conocer más opciones.',
    title: 'Información del Plan',
    placement: 'bottom',
  },
  {
    target: '[data-tour="new-campaign-btn"]',
    content: 'Haz clic aquí para crear una nueva campaña de recompensas. Podrás configurar promociones, segmentos de clientes y plantillas de mensajes.',
    title: 'Nueva Campaña',
    placement: 'bottom',
  },
  {
    target: '[data-tour="kpi-filters"]',
    content: 'Usa estos filtros para ver campañas por estado: todas, activas, pausadas o expiradas. Los números muestran cuántas tienes de cada tipo.',
    title: 'Filtros de Estado',
    placement: 'top',
  },
  {
    target: '[data-tour="campaigns-grid"]',
    content: 'Aquí aparecen tus campañas creadas. Haz clic en cualquier tarjeta para ver detalles, estadísticas y gestionar la campaña.',
    title: 'Campañas Existentes',
    placement: 'top',
  }
];

export const useRewardsOnboarding = (): RewardsOnboardingHook => {
  const [run, setRun] = useState(false);
  const steps = rewardsOnboardingSteps;

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Usuario completó o saltó el onboarding de recompensas
      localStorage.setItem(REWARDS_ONBOARDING_STORAGE_KEY, 'true');
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
    localStorage.setItem(REWARDS_ONBOARDING_STORAGE_KEY, 'true');
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
    resetOnboarding
  };
};