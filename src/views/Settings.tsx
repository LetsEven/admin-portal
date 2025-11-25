import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SaveIcon, Upload, Camera, Edit3, Trash2, ExternalLink, Copy, Check } from 'lucide-react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRestaurant } from '../hooks/useRestaurant';
import { ImageUploadService } from '../services/imageUploadService';
import ImageCropModal from '../components/ImageCropModal';
import { useAdminPortalApi } from '../services/adminPortalApi';

interface SettingsData {
  name: string;
  address: string;
  phone: string;
  email: string;
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  logo: string;
  orderNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  language: string;
  currency: string;
}

const Settings = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { restaurant, isLoading, isUpdating, error, updateRestaurant } = useRestaurant();
  const adminPortalApi = useAdminPortalApi();
  const [settings, setSettings] = useState<SettingsData | null>(null);

  // Estados para servicios habilitados
  const [isPickNGoEnabled, setIsPickNGoEnabled] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesLoaded, setServicesLoaded] = useState(false);  

  // Debug del estado de autenticación
  useEffect(() => {
    console.log('🔍 [Settings] Estado de autenticación:', {
      isLoaded,
      isSignedIn,
      user: user ? {
        id: user.id,
        email: user.emailAddresses?.[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName
      } : null
    });
  }, [user, isLoaded, isSignedIn]);

  // Función para validar horarios
  const validateHours = (day: string, field: string, value: string | boolean): string | null => {
    if (!settings) return null;

    const dayHours = settings.openingHours[day];

    if (field === 'closed') {
      // Si se está marcando como cerrado, limpiar errores de ese día
      if (value === true) {
        const newErrors = {...validationErrors};
        delete newErrors[`${day}_time`];
        setValidationErrors(newErrors);
      }
      return null;
    }

    // Si el día está cerrado, no validar horarios
    if (dayHours.closed) return null;

    let openTime = dayHours.open;
    let closeTime = dayHours.close;

    // Actualizar con el nuevo valor
    if (field === 'open') openTime = value as string;
    if (field === 'close') closeTime = value as string;

    // Validar que hora de apertura sea menor que hora de cierre
    if (openTime && closeTime) {
      const open = new Date(`2000-01-01T${openTime}:00`);
      const close = new Date(`2000-01-01T${closeTime}:00`);

      if (open >= close) {
        return 'La hora de apertura debe ser menor que la hora de cierre';
      }

      // Validar duración mínima (1 hora)
      const diffHours = (close.getTime() - open.getTime()) / (1000 * 60 * 60);
      if (diffHours < 1) {
        return 'El restaurante debe estar abierto al menos 1 hora';
      }

      // Validar horarios realistas (entre 5 AM y 2 AM del día siguiente)
      const openHour = open.getHours();
      const closeHour = close.getHours();

      if (openHour < 5) {
        return 'Hora de apertura muy temprana (mínimo 5:00 AM)';
      }

      if (closeHour > 2 && closeHour < 5) {
        return 'Hora de cierre muy tarde (máximo 2:00 AM)';
      }
    }

    return null;
  };

  const fileInputRef = useRef(null);
  const [logoPreview, setLogoPreview] = useState('');

  // Image crop modal state
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState('');

  // Upload states
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  // Pick & Go URL state
  const [copySuccess, setCopySuccess] = useState(false);

  // Sincronizar estado local con datos del restaurante
  useEffect(() => {
    if (restaurant) {
      console.log('🔍 Restaurant data received in Settings:', restaurant);
      setSettings({
        name: restaurant.name || 'Mi Restaurante',
        address: restaurant.address || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        openingHours: restaurant.openingHours || {
          monday: { open: '09:00', close: '22:00', closed: false },
          tuesday: { open: '09:00', close: '22:00', closed: false },
          wednesday: { open: '09:00', close: '22:00', closed: false },
          thursday: { open: '09:00', close: '22:00', closed: false },
          friday: { open: '09:00', close: '23:00', closed: false },
          saturday: { open: '10:00', close: '23:00', closed: false },
          sunday: { open: '10:00', close: '20:00', closed: false }
        },
        logo: restaurant.logo_url || '',
        orderNotifications: restaurant.orderNotifications ?? true,
        emailNotifications: restaurant.emailNotifications ?? false,
        smsNotifications: restaurant.smsNotifications ?? false,
        language: restaurant.language || 'es',
        currency: restaurant.currency || 'MXN'
      });
      setLogoPreview(restaurant.logo_url || '');
    }
  }, [restaurant]);

  // Cargar servicios habilitados - optimizado para evitar re-renderizados
  useEffect(() => {
    let isMounted = true; // Para evitar setState si el componente se desmonta

    const loadEnabledServices = async () => {
      try {
        setServicesLoading(true);
        const response = await adminPortalApi.getEnabledServices();

        if (!isMounted) return; // Component unmounted, don't update state

        const enabledServiceIds = response.enabled_services;

        // Verificar si pick-n-go está habilitado
        setIsPickNGoEnabled(enabledServiceIds.includes('pick-n-go'));

        console.log('🔍 [Settings] Pick & Go enabled:', enabledServiceIds.includes('pick-n-go'));
        console.log('🔍 [Settings] Enabled services:', enabledServiceIds);
      } catch (error) {
        if (!isMounted) return;

        console.error('❌ [Settings] Error loading enabled services:', error);
        // En caso de error, asumir que no está habilitado
        setIsPickNGoEnabled(false);
      } finally {
        if (isMounted) {
          setServicesLoading(false);
          setServicesLoaded(true); // Marcar como cargado para evitar re-cargas
        }
      }
    };

    // Solo cargar una vez cuando el usuario está autenticado
    if (user && isSignedIn && !servicesLoaded) {
      loadEnabledServices();
    } else if (!user || !isSignedIn) {
      // Si no hay usuario, resetear estados
      setIsPickNGoEnabled(false);
      setServicesLoading(false);
      setServicesLoaded(false);
    }

    return () => {
      isMounted = false; // Cleanup function
    };
  }, [user?.id, isSignedIn]); // Solo dependencias esenciales

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {
      name,
      value,
      type
    } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (!settings) return;

    let newSettings = {
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    };

    // Aplicar lógica de dependencias para notificaciones
    if (name === 'orderNotifications' && type === 'checkbox' && !checked) {
      // Si se deshabilita orderNotifications, deshabilitar las demás
      newSettings.emailNotifications = false;
      newSettings.smsNotifications = false;
    }

    setSettings(newSettings);
  };

  const handleHoursChange = (day: string, field: string, value: string | null) => {
    if (!settings) return;

    const validationError = validateHours(day, field, field === 'closed' ? !settings.openingHours[day].closed : value!);

    // Actualizar errores de validación
    const newErrors = {...validationErrors};
    if (validationError) {
      newErrors[`${day}_time`] = validationError;
    } else {
      delete newErrors[`${day}_time`];
    }
    setValidationErrors(newErrors);

    // Actualizar settings
    setSettings({
      ...settings,
      openingHours: {
        ...settings.openingHours,
        [day]: {
          ...settings.openingHours[day],
          [field]: field === 'closed' ? !settings.openingHours[day].closed : value
        }
      }
    });
  };

  const handleLogoUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // Mostrar preview para recorte
          const base64 = await ImageUploadService.fileToBase64(file);
          setTempImageSrc(base64);
          setShowCropModal(true);
        } catch (error) {
          console.error('❌ Error preparing image:', error);
          alert('Error al preparar la imagen. Por favor intenta de nuevo.');
        }
      }
    };
    input.click();
  };

  const handleImageUploadFromModal = async (file: File) => {
    const base64 = await ImageUploadService.fileToBase64(file);
    setTempImageSrc(base64);
  };

  const handleCropSave = async (croppedImage: string) => {
    try {
      setIsUploadingLogo(true);

      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], `logo_${Date.now()}.jpg`, { type: 'image/jpeg' });

      const publicUrl = await ImageUploadService.updateImage(
        file,
        'logo',
        logoPreview // Delete old image if exists
      );

      await updateRestaurant({ logo_url: publicUrl });

      // Update local preview
      setLogoPreview(publicUrl);
      setSettings(prev => prev ? { ...prev, logo: publicUrl } : null);
    } catch (error) {
      console.error('❌ Error uploading logo:', error);
      alert('Error al subir el logo. Por favor intenta de nuevo.');
    } finally {
      setIsUploadingLogo(false);
      setShowCropModal(false);
      setTempImageSrc('');
    }
  };

  const handleCropClose = () => {
    setShowCropModal(false);
    setTempImageSrc('');
  };

  const handleLogoDelete = async () => {
    try {
      setIsUploadingLogo(true);
      await updateRestaurant({ logo_url: '' });
      setLogoPreview('');
      setSettings(prev => prev ? { ...prev, logo: '' } : null);
    } catch (error) {
      console.error('❌ Error deleting logo:', error);
      alert('Error al eliminar el logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Generar URL de Pick & Go
  const getPickAndGoUrl = () => {
    if (!restaurant?.id) return '';
    return `https://pickandgo.xquisito.ai/${restaurant.id}/menu`;
  };

  // Copiar URL al portapapeles
  const copyPickAndGoUrl = async () => {
    const url = getPickAndGoUrl();
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  // Abrir URL en nueva pestaña
  const openPickAndGoUrl = () => {
    const url = getPickAndGoUrl();
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!settings) return;

    // Validar todos los horarios antes de enviar
    const hasValidationErrors = Object.keys(validationErrors).length > 0;
    if (hasValidationErrors) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 5000);
      return;
    }

    try {
      setSaveStatus('saving');

      // Preparar datos para actualizar (incluyendo horarios y notificaciones)
      const updateData = {
        name: settings.name,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        openingHours: settings.openingHours,
        orderNotifications: settings.orderNotifications,
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications,
      };

      console.log('🚀 Sending update data:', updateData);
      console.log('📊 Current settings state:', settings);

      await updateRestaurant(updateData);

      // Guardar en localStorage solo settings que no están en el backend aún
      const localSettings = {
        language: settings.language,
        currency: settings.currency
      };
      localStorage.setItem('restaurantLocalSettings', JSON.stringify(localSettings));

      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  // Mostrar loading mientras se cargan los datos de autenticación
  if (!isLoaded) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-custom-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando autenticación...</p>
        </div>
      </div>
    );
  }

  // Verificar si el usuario está autenticado
  if (!isSignedIn) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600">Usuario no autenticado. Por favor inicia sesión.</p>
        </div>
      </div>
    );
  }

  // Mostrar loading mientras se cargan los datos del restaurante
  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-custom-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  // No mostrar nada si no hay settings
  if (!settings) {
    return null;
  }

  const days = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
  };

  return <div className="w-full">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold text-gray-900">Configuración</h1>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700">
          {user?.firstName || 'Usuario'}
        </span>
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </div>
    <form onSubmit={handleSubmit} className="mt-6 space-y-8">
      {/* Restaurant Information */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Información del restaurante
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Información básica sobre tu restaurante que se mostrará a los
              clientes.
            </p>
            <div className="flex justify-center mt-6">
              {logoPreview && <div className="w-32 h-32 rounded-lg overflow-hidden border border-gray-200 shadow-sm flex items-center justify-center bg-white p-2">
                  <img src={logoPreview} alt="Logo del restaurante" className="max-h-full max-w-full object-contain" />
                </div>}
            </div>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre del restaurante
                </label>
                <input type="text" name="name" id="name" value={settings.name} onChange={handleChange} className="mt-1 focus:ring-custom-green-500 focus:border-custom-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
              </div>
              <div className="col-span-6">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Dirección
                </label>
                <input type="text" name="address" id="address" value={settings.address} onChange={handleChange} className="mt-1 focus:ring-custom-green-500 focus:border-custom-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <input type="text" name="phone" id="phone" value={settings.phone} onChange={handleChange} className="mt-1 focus:ring-custom-green-500 focus:border-custom-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Correo electrónico
                </label>
                <input type="email" name="email" id="email" value={settings.email} onChange={handleChange} className="mt-1 focus:ring-custom-green-500 focus:border-custom-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
              </div>
              <div className="col-span-6">
                <label htmlFor="logo" className="block text-sm font-medium text-gray-700">
                  Logo del restaurante
                </label>
                <div className="mt-2">
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={handleLogoUpload}
                      disabled={isUploadingLogo}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploadingLogo ? (
                        <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : logoPreview ? (
                        <Edit3 className="h-4 w-4 mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {logoPreview ? 'Cambiar logo' : 'Subir logo'}
                    </button>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={handleLogoDelete}
                        disabled={isUploadingLogo}
                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    JPG, PNG o WEBP. Se redimensionará automáticamente.
                  </p>
                </div>
              </div>

              {/* Pick & Go URL Section - Solo mostrar si el servicio está habilitado */}
              {!servicesLoading && isPickNGoEnabled && (
                <div className="col-span-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL de Pick & Go
                  </label>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-gray-50 border border-gray-300 rounded-md px-3 py-2">
                      <code className="text-sm text-gray-700 break-all">
                        {restaurant?.id ? getPickAndGoUrl() : 'Cargando...'}
                      </code>
                    </div>

                    {restaurant?.id && (
                      <>
                        <button
                          type="button"
                          onClick={copyPickAndGoUrl}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 transition-colors"
                          title="Copiar URL"
                        >
                          {copySuccess ? (
                            <>
                              <Check className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-green-500">¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              Copiar
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={openPickAndGoUrl}
                          className="inline-flex items-center px-3 py-2 border border-custom-green-300 shadow-sm text-sm font-medium rounded-md text-custom-green-700 bg-custom-green-50 hover:bg-custom-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 transition-colors"
                          title="Abrir en nueva pestaña"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Abrir
                        </button>
                      </>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Esta es la URL pública de tu menú Pick & Go que los clientes pueden usar para hacer pedidos.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Opening Hours */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Horario de atención
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Establece los horarios en que tu restaurante está abierto.
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <div className="space-y-4">
              {Object.entries(days).map(([day, label]) => <div key={day} className="flex items-center space-x-4">
                  <div className="w-24">
                    <span className="text-sm font-medium text-gray-700">
                      {label}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <input id={`closed-${day}`} name={`closed-${day}`} type="checkbox" checked={settings.openingHours[day].closed} onChange={() => handleHoursChange(day, 'closed', null)} className="h-4 w-4 text-custom-green-600 focus:ring-custom-green-500 border-gray-300 rounded" />
                    <label htmlFor={`closed-${day}`} className="ml-2 text-sm text-gray-700">
                      Cerrado
                    </label>
                  </div>
                  {!settings.openingHours[day].closed && <>
                      <div className="flex items-center">
                        <label htmlFor={`open-${day}`} className="sr-only">
                          Abre
                        </label>
                        <input type="time" id={`open-${day}`} value={settings.openingHours[day].open} onChange={e => handleHoursChange(day, 'open', e.target.value)} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-custom-green-500 focus:border-custom-green-500" />
                      </div>
                      <span className="text-gray-500">a</span>
                      <div className="flex items-center">
                        <label htmlFor={`close-${day}`} className="sr-only">
                          Cierra
                        </label>
                        <input type="time" id={`close-${day}`} value={settings.openingHours[day].close} onChange={e => handleHoursChange(day, 'close', e.target.value)} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-custom-green-500 focus:border-custom-green-500" />
                      </div>
                    </>}
                  {/* Mostrar error de validación si existe */}
                  {validationErrors[`${day}_time`] && (
                    <div className="col-span-full">
                      <p className="text-sm text-red-600 mt-1">
                        {validationErrors[`${day}_time`]}
                      </p>
                    </div>
                  )}
                </div>)}
            </div>
          </div>
        </div>
      </div>
      {/* Notifications */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Notificaciones
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Decide cómo quieres recibir notificaciones sobre pedidos y
              clientes.
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input 
                    id="orderNotifications" 
                    name="orderNotifications" 
                    type="checkbox" 
                    checked={settings.orderNotifications} 
                    onChange={handleChange} 
                    className="focus:ring-custom-green-500 h-4 w-4 text-custom-green-600 border-gray-300 rounded" 
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="orderNotifications" className="font-medium text-gray-700">
                    Notificaciones de pedidos
                  </label>
                  <p className="text-gray-500">
                    Recibe notificaciones cuando lleguen nuevos pedidos.
                  </p>
                </div>
              </div>
              <div className={`flex items-start ${!settings.orderNotifications ? 'opacity-50' : ''}`}>
                <div className="flex items-center h-5">
                  <input
                    id="emailNotifications"
                    name="emailNotifications"
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={handleChange}
                    disabled={!settings.orderNotifications}
                    className={`h-4 w-4 border-gray-300 rounded transition-colors duration-200 ${
                      !settings.orderNotifications
                        ? 'bg-gray-100 cursor-not-allowed'
                        : 'focus:ring-custom-green-500 text-custom-green-600'
                    }`}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="emailNotifications" className={`font-medium ${!settings.orderNotifications ? 'text-gray-400' : 'text-gray-700'}`}>
                    Notificaciones por correo
                  </label>
                  <p className={`${!settings.orderNotifications ? 'text-gray-400' : 'text-gray-500'}`}>
                    {!settings.orderNotifications
                      ? 'Requiere que las notificaciones de pedidos estén habilitadas.'
                      : 'Recibe notificaciones por correo electrónico.'
                    }
                  </p>
                </div>
              </div>
              <div className={`flex items-start ${!settings.orderNotifications ? 'opacity-50' : ''}`}>
                <div className="flex items-center h-5">
                  <input
                    id="smsNotifications"
                    name="smsNotifications"
                    type="checkbox"
                    checked={settings.smsNotifications}
                    onChange={handleChange}
                    disabled={!settings.orderNotifications}
                    className={`h-4 w-4 border-gray-300 rounded transition-colors duration-200 ${
                      !settings.orderNotifications
                        ? 'bg-gray-100 cursor-not-allowed'
                        : 'focus:ring-custom-green-500 text-custom-green-600'
                    }`}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="smsNotifications" className={`font-medium ${!settings.orderNotifications ? 'text-gray-400' : 'text-gray-700'}`}>
                    Notificaciones por SMS
                  </label>
                  <p className={`${!settings.orderNotifications ? 'text-gray-400' : 'text-gray-500'}`}>
                    {!settings.orderNotifications
                      ? 'Requiere que las notificaciones de pedidos estén habilitadas.'
                      : 'Recibe notificaciones por mensaje de texto (pueden aplicar cargos).'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Regional Settings */}
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Configuración regional
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Configura el idioma y moneda.
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                  Idioma
                </label>
                <select id="language" name="language" value={settings.language} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 sm:text-sm">
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                </select>
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                  Moneda
                </label>
                <select id="currency" name="currency" value={settings.currency} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-custom-green-500 focus:border-custom-green-500 sm:text-sm">
                  <option value="MXN">Peso Mexicano (MXN)</option>
                  <option value="USD">Dólar Estadounidense (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {saveStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-sm text-green-600">Configuración guardada exitosamente</p>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">
            {Object.keys(validationErrors).length > 0
              ? 'Por favor corrige los errores de validación en los horarios antes de guardar.'
              : 'Error al guardar la configuración. Por favor intenta de nuevo.'
            }
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button type="button" className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isUpdating || saveStatus === 'saving'}
          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-custom-green-600 hover:bg-custom-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {(isUpdating || saveStatus === 'saving') ? (
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : (
            <SaveIcon className="-ml-1 mr-2 h-5 w-5" />
          )}
          {(isUpdating || saveStatus === 'saving') ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>

    {/* Image Crop Modal */}
    <ImageCropModal
      isOpen={showCropModal}
      imageSrc={tempImageSrc}
      onClose={handleCropClose}
      onSave={handleCropSave}
      onImageUpload={handleImageUploadFromModal}
      title="Ajustar Logo del Restaurante"
    />
  </div>;
};

export default Settings;