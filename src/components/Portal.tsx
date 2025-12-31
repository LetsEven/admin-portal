import { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
  containerId?: string;
}

const Portal: React.FC<PortalProps> = ({ children, containerId = 'portal-root' }) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Try to find existing container
    let containerElement = document.getElementById(containerId);

    // If container doesn't exist, create it
    if (!containerElement) {
      containerElement = document.createElement('div');
      containerElement.id = containerId;
      containerElement.style.position = 'absolute';
      containerElement.style.top = '0';
      containerElement.style.left = '0';
      containerElement.style.zIndex = '9999';
      containerElement.style.pointerEvents = 'none'; // Allow clicks to pass through container
      document.body.appendChild(containerElement);
    }

    setContainer(containerElement);

    // Cleanup function
    return () => {
      // Only remove if we created it and it's empty
      if (containerElement && containerElement.children.length === 0) {
        document.body.removeChild(containerElement);
      }
    };
  }, [containerId]);

  if (!container) return null;

  return createPortal(children, container);
};

export default Portal;