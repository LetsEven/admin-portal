import { useState, useCallback } from 'react';
import { CallBackProps, STATUS, Step } from 'react-joyride';

interface ServicesOnboardingHook {
  run: boolean;
  steps: Step[];
  handleJoyrideCallback: (data: CallBackProps) => void;
  startOnboarding: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

const SERVICES_ONBOARDING_STORAGE_KEY = 'xquisito_services_onboarding_completed';

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

// Definición de los pasos del tour para la Gestión de Servicios
const servicesOnboardingSteps: Step[] = [
  {
    target: 'body',
    content: '¡Bienvenido a la gestión de servicios! Aquí puedes ver los diferentes servicios de Xquisito para tu negocio.',
    title: 'Gestión de Servicios',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="services-list"]',
    content: 'Estos son los servicios de Xquisito. Cada uno ofrece una experiencia diferente para tus clientes.',
    title: 'Servicios Disponibles',
    placement: 'top',
  },
  {
    target: '[data-tour="service-status"]',
    content: 'Los servicios pueden estar activos o inactivos. Contacta a soporte para activar los servicios que necesites.',
    title: 'Estado del Servicio',
    placement: 'left',
  }
];

export const useServicesOnboarding = (): ServicesOnboardingHook => {
  const [run, setRun] = useState(false);
  const steps = servicesOnboardingSteps;

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Usuario completó o saltó el onboarding de servicios
      localStorage.setItem(SERVICES_ONBOARDING_STORAGE_KEY, 'true');
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
    localStorage.setItem(SERVICES_ONBOARDING_STORAGE_KEY, 'true');
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
    resetOnboarding
  };
};