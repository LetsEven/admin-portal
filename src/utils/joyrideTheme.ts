// Tema centralizado de Joyride para Xquisito
// Usado por todos los hooks de onboarding (Dashboard, Settings, Menu, Rewards, Services, Pepper)

export const joyrideTheme = {
  options: {
    primaryColor: '#2A5A62',
    backgroundColor: '#ffffff',
    textColor: '#173E44',
    overlayColor: 'rgba(23, 62, 68, 0.4)',
    arrowColor: '#2A5A62',
    zIndex: 10000,
    width: undefined, // Controlado por CSS responsive
    beaconSize: 36
  },
  tooltip: {
    borderRadius: 12,
    padding: '16px 16px',
    maxWidth: '92vw',
  },
  tooltipContent: {
    padding: '12px 0'
  },
  tooltipTitle: {
    color: '#173E44',
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '6px'
  },
  tooltipBody: {
    color: '#555555',
    fontSize: '0.875rem',
    lineHeight: '1.5'
  },
  buttonNext: {
    backgroundColor: '#2A5A62',
    fontSize: '0.8rem',
    padding: '8px 16px',
    borderRadius: '8px'
  },
  buttonBack: {
    color: '#2A5A62',
    fontSize: '0.8rem',
    padding: '8px 16px'
  },
  buttonSkip: {
    color: '#888888',
    fontSize: '0.8rem'
  }
};

// CSS responsive para los tooltips de Joyride
// Inyectar con <style dangerouslySetInnerHTML={{ __html: joyrideResponsiveCSS }} />
export const joyrideResponsiveCSS = `
  /* Base móvil */
  .react-joyride__tooltip {
    max-width: calc(100vw - 32px) !important;
    width: auto !important;
    font-size: 0.875rem !important;
  }

  .__floater {
    max-width: none !important;
    padding: 0 12px !important;
    width: 100% !important;
    display: block !important;
    box-sizing: border-box !important;
  }

  .__floater__body {
    max-width: calc(100vw - 24px) !important;
  }

  .react-joyride__tooltip button[data-action="primary"] {
    font-size: 0.8rem !important;
    padding: 8px 16px !important;
  }

  .react-joyride__tooltip button[data-action="back"] {
    font-size: 0.8rem !important;
    padding: 8px 16px !important;
  }

  .react-joyride__tooltip button[data-action="skip"] {
    font-size: 0.75rem !important;
  }

  /* Desktop (>= 640px) */
  @media (min-width: 640px) {
    /* Fix posición del floater del sidebar (placement right) */
    .__floater[x-placement="right"] {
      left: 40px !important;
      transform: translate3d(30px, 110px, 0px) !important;
    }
    .react-joyride__tooltip {
      max-width: 400px !important;
      width: 400px !important;
      font-size: 1rem !important;
    }

    .__floater {
      max-width: 420px !important;
      display: inline-block !important;
      padding: 0 !important;
      box-sizing: content-box !important;
    }

    .__floater__body {
      max-width: 420px !important;
    }

    .react-joyride__tooltip button[data-action="primary"] {
      font-size: 0.9rem !important;
      padding: 10px 20px !important;
    }

    .react-joyride__tooltip button[data-action="back"] {
      font-size: 0.9rem !important;
      padding: 10px 20px !important;
    }

    .react-joyride__tooltip button[data-action="skip"] {
      font-size: 0.85rem !important;
    }
  }
`;
