import React, { useEffect, useState, useRef, useCallback } from "react";
import Joyride from "react-joyride";
import {
  SaveIcon,
  Upload,
  Camera,
  Edit3,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRestaurant } from "../hooks/useRestaurant";
import { ImageUploadService } from "../services/imageUploadService";
import ImageCropModal from "../components/ImageCropModal";
import { useAdminPortalApi } from "../services/adminPortalApi";
import { usePosApi } from "../services/posApi";
import PrinterSettings from "../components/PrinterSettings";
import {
  useSettingsOnboarding,
  joyrideTheme,
  joyrideResponsiveCSS,
} from "../hooks/useSettingsOnboarding";

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
      allDay?: boolean;
    };
  };
  logo: string;
  orderNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  language: string;
  currency: string;
  tableCount: number;
}

interface BranchData {
  id: string;
  client_id: string;
  name: string;
  address: string;
  tables: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  max_pending_orders?: number | null;
  max_pending_user_orders?: number | null;
  opening_hours?: {
    [key: string]: {
      open_time: string;
      close_time: string;
      is_closed: boolean;
      is_all_day?: boolean;
    };
  };
}

const Settings = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { restaurant, isLoading, isUpdating, error, updateRestaurant } =
    useRestaurant();
  const adminPortalApi = useAdminPortalApi();
  const [settings, setSettings] = useState<SettingsData | null>(null);

  // Settings onboarding tour
  const { run, steps, handleJoyrideCallback, startOnboarding } =
    useSettingsOnboarding();

  // Estados para servicios habilitados
  const [isPickNGoEnabled, setIsPickNGoEnabled] = useState(false);
  const [isFlexBillEnabled, setIsFlexBillEnabled] = useState(false);
  const [isTapOrderPayEnabled, setIsTapOrderPayEnabled] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesLoaded, setServicesLoaded] = useState(false);

  // Estados para sucursales
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [branchesLoading, setBranchesLoading] = useState<boolean>(true);

  // Estados para edición de direcciones
  const [originalAddress, setOriginalAddress] = useState<string>("");
  const [isAddressChanged, setIsAddressChanged] = useState<boolean>(false);
  const [isUpdatingAddress, setIsUpdatingAddress] = useState<boolean>(false);

  // Estados para edición de horarios por sucursal
  const [originalOpeningHours, setOriginalOpeningHours] = useState<any>(null);
  const [areHoursChanged, setAreHoursChanged] = useState<boolean>(false);
  const [isUpdatingHours, setIsUpdatingHours] = useState<boolean>(false);
  const [hideHoursButtons, setHideHoursButtons] = useState<boolean>(false);

  // Estados para control de flujo de órdenes
  const PRESET_LIMITS = [10, 15, 20, 25, 30, 50];
  const FLEXBILL_PRESET_LIMITS = [20, 30, 50, 75, 100];
  const [maxPendingOrders, setMaxPendingOrders] = useState<number | null>(null);
  const [isCustomLimit, setIsCustomLimit] = useState(false);
  const [customLimitValue, setCustomLimitValue] = useState("");
  const [isSavingOrderFlow, setIsSavingOrderFlow] = useState(false);
  const [orderFlowSaveStatus, setOrderFlowSaveStatus] = useState<
    "success" | "error" | null
  >(null);

  // Estados para control de flujo Flexbill (user_orders)
  const [selectedFlowServiceTab, setSelectedFlowServiceTab] = useState<
    "general" | "flex-bill"
  >("general");
  const [flexbillMaxUserOrders, setFlexbillMaxUserOrders] = useState<
    number | null
  >(null);
  const [isCustomFlexbillLimit, setIsCustomFlexbillLimit] = useState(false);
  const [customFlexbillValue, setCustomFlexbillValue] = useState("");
  const [isSavingFlexbillLimit, setIsSavingFlexbillLimit] = useState(false);
  const [flexbillSaveStatus, setFlexbillSaveStatus] = useState<
    "success" | "error" | null
  >(null);

  // Debug del estado de autenticación
  useEffect(() => {
    console.log("🔍 [Settings] Estado de autenticación:", {
      isLoaded,
      isSignedIn,
      user: user
        ? {
            id: user.id,
            email: user.emailAddresses?.[0]?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        : null,
    });
  }, [user, isLoaded, isSignedIn]);

  // Función para validar horarios
  const validateHours = (
    day: string,
    field: string,
    value: string | boolean,
  ): string | null => {
    if (!settings) return null;

    const dayHours = settings.openingHours[day];

    if (field === "closed" || field === "allDay") {
      if (value === true) {
        const newErrors = { ...validationErrors };
        delete newErrors[`${day}_time`];
        setValidationErrors(newErrors);
      }
      return null;
    }

    // Si el día está cerrado o es todo el día, no validar horarios
    if (dayHours.closed || dayHours.allDay) return null;

    let openTime = dayHours.open;
    let closeTime = dayHours.close;

    if (field === "open") openTime = value as string;
    if (field === "close") closeTime = value as string;

    if (openTime && closeTime) {
      let openDate = new Date(`2000-01-01T${openTime}:00`);
      let closeDate = new Date(`2000-01-01T${closeTime}:00`);

      // Si cierre <= apertura, el restaurante cierra al día siguiente (horario nocturno)
      if (closeDate <= openDate) {
        closeDate = new Date(`2000-01-02T${closeTime}:00`);
      }

      const diffHours =
        (closeDate.getTime() - openDate.getTime()) / (1000 * 60 * 60);
      if (diffHours < 1) {
        return "El restaurante debe estar abierto al menos 1 hora";
      }
    }

    return null;
  };

  const fileInputRef = useRef(null);
  const [logoPreview, setLogoPreview] = useState("");

  // Image crop modal state
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState("");

  // Upload states
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "saving" | "success" | "error" | null
  >(null);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  // Pick & Go URL state
  const [copySuccess, setCopySuccess] = useState(false);

  const posApi = usePosApi();

  // POS Integration state
  const [posIntegration, setPosIntegration] = useState<{
    providerId: string;
    syncToken: string | null;
  } | null>(null);
  const [posIntegrationLoading, setPosIntegrationLoading] = useState(false);
  const [agentConnected, setAgentConnected] = useState(false);
  const [copySuccessBranchId, setCopySuccessBranchId] = useState(false);
  const [copySuccessToken, setCopySuccessToken] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Sincronizar estado local con datos del restaurante
  useEffect(() => {
    if (restaurant) {
      console.log("🔍 Restaurant data received in Settings:", restaurant);
      setSettings({
        name: restaurant.name || "Mi Restaurante",
        address: restaurant.address || "",
        phone: restaurant.phone || "",
        email: restaurant.email || "",
        openingHours: restaurant.openingHours || {
          monday: {
            open: "09:00",
            close: "22:00",
            closed: false,
            allDay: false,
          },
          tuesday: {
            open: "09:00",
            close: "22:00",
            closed: false,
            allDay: false,
          },
          wednesday: {
            open: "09:00",
            close: "22:00",
            closed: false,
            allDay: false,
          },
          thursday: {
            open: "09:00",
            close: "22:00",
            closed: false,
            allDay: false,
          },
          friday: {
            open: "09:00",
            close: "23:00",
            closed: false,
            allDay: false,
          },
          saturday: {
            open: "10:00",
            close: "23:00",
            closed: false,
            allDay: false,
          },
          sunday: {
            open: "10:00",
            close: "20:00",
            closed: false,
            allDay: false,
          },
        },
        logo: restaurant.logo_url || "",
        orderNotifications: restaurant.orderNotifications ?? true,
        emailNotifications: restaurant.emailNotifications ?? false,
        smsNotifications: restaurant.smsNotifications ?? false,
        language: restaurant.language || "es",
        currency: restaurant.currency || "MXN",
        tableCount: restaurant.tableCount || 0,
      });
      setLogoPreview(restaurant.logo_url || "");
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

        // Verificar qué servicios están habilitados
        setIsPickNGoEnabled(enabledServiceIds.includes("pick-n-go"));
        setIsFlexBillEnabled(enabledServiceIds.includes("flex-bill"));
        setIsTapOrderPayEnabled(enabledServiceIds.includes("tap-order-pay"));

        console.log("🔍 [Settings] Services enabled:", {
          pickNGo: enabledServiceIds.includes("pick-n-go"),
          flexBill: enabledServiceIds.includes("flex-bill"),
          tapOrderPay: enabledServiceIds.includes("tap-order-pay"),
        });
        console.log("🔍 [Settings] All enabled services:", enabledServiceIds);
      } catch (error) {
        if (!isMounted) return;

        console.error("❌ [Settings] Error loading enabled services:", error);
        // En caso de error, asumir que no están habilitados
        setIsPickNGoEnabled(true);
        setIsFlexBillEnabled(false);
        setIsTapOrderPayEnabled(false);
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
      setIsPickNGoEnabled(true);
      setIsFlexBillEnabled(false);
      setIsTapOrderPayEnabled(false);
      setServicesLoading(false);
      setServicesLoaded(false);
    }

    return () => {
      isMounted = false; // Cleanup function
    };
  }, [user?.id, isSignedIn]); // Solo dependencias esenciales

  // Cargar sucursales del cliente
  useEffect(() => {
    let isMounted = true;

    const loadBranches = async () => {
      try {
        setBranchesLoading(true);
        console.log("🔍 [Settings] Loading branches for user:", user?.id);

        const response = await adminPortalApi.getBranches();

        if (!isMounted) return;

        console.log("✅ [Settings] Branches loaded:", response);
        const loadedBranches = (response.branches || []) as BranchData[];
        setBranches(loadedBranches);

        // Establecer primera sucursal activa como predeterminada si no hay ninguna seleccionada
        if (loadedBranches.length > 0 && !selectedBranch) {
          const defaultBranch =
            loadedBranches.find((b) => b.active) || loadedBranches[0];
          setSelectedBranch(defaultBranch.id);
          console.log(
            "🏢 [Settings] Default branch set:",
            defaultBranch.name,
            "(ID:",
            defaultBranch.id,
            ")",
          );
        }
      } catch (error) {
        if (!isMounted) return;

        console.error("❌ [Settings] Error loading branches:", error);
        setBranches([]);
      } finally {
        if (isMounted) {
          setBranchesLoading(false);
        }
      }
    };

    if (user && isSignedIn) {
      loadBranches();
    } else {
      setBranches([]);
      setBranchesLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id, isSignedIn]);

  // Efecto para cargar datos de sucursal predeterminada cuando las sucursales estén cargadas
  useEffect(() => {
    if (branches.length > 0 && selectedBranch && settings) {
      const selectedBranchData = branches.find(
        (branch) => branch.id === selectedBranch,
      );
      if (selectedBranchData) {
        const branchAddress = selectedBranchData.address || "";

        // Cargar horarios de la sucursal o usar horarios predeterminados
        const branchOpeningHours = selectedBranchData.opening_hours || {
          monday: { open_time: "09:00", close_time: "22:00", is_closed: false },
          tuesday: {
            open_time: "09:00",
            close_time: "22:00",
            is_closed: false,
          },
          wednesday: {
            open_time: "09:00",
            close_time: "22:00",
            is_closed: false,
          },
          thursday: {
            open_time: "09:00",
            close_time: "22:00",
            is_closed: false,
          },
          friday: { open_time: "09:00", close_time: "23:00", is_closed: false },
          saturday: {
            open_time: "10:00",
            close_time: "23:00",
            is_closed: false,
          },
          sunday: { open_time: "10:00", close_time: "20:00", is_closed: false },
        };

        // Convertir formato de base de datos a formato del frontend
        const formattedOpeningHours: {
          [key: string]: {
            open: string;
            close: string;
            closed: boolean;
            allDay: boolean;
          };
        } = {};
        Object.keys(branchOpeningHours).forEach((day) => {
          const dayData = branchOpeningHours[day];
          formattedOpeningHours[day] = {
            open: dayData.open_time || "09:00",
            close: dayData.close_time || "22:00",
            closed: dayData.is_closed || false,
            allDay: dayData.is_all_day || false,
          };
        });

        setSettings((prev) =>
          prev
            ? {
                ...prev,
                address: branchAddress,
                tableCount: selectedBranchData.tables || 0,
                openingHours: formattedOpeningHours,
              }
            : null,
        );

        setOriginalAddress(branchAddress);
        setOriginalOpeningHours(formattedOpeningHours);
        setIsAddressChanged(false);
        setAreHoursChanged(false);
        setHideHoursButtons(false);

        // Cargar límite de flujo de órdenes de la sucursal (general)
        const branchMax = selectedBranchData.max_pending_orders ?? null;
        setMaxPendingOrders(branchMax);
        if (branchMax !== null && !PRESET_LIMITS.includes(branchMax)) {
          setIsCustomLimit(true);
          setCustomLimitValue(String(branchMax));
        } else {
          setIsCustomLimit(false);
          setCustomLimitValue("");
        }

        // Cargar límite de flujo Flexbill (user_orders)
        const flexbillMax = selectedBranchData.max_pending_user_orders ?? null;
        setFlexbillMaxUserOrders(flexbillMax);
        if (
          flexbillMax !== null &&
          !FLEXBILL_PRESET_LIMITS.includes(flexbillMax)
        ) {
          setIsCustomFlexbillLimit(true);
          setCustomFlexbillValue(String(flexbillMax));
        } else {
          setIsCustomFlexbillLimit(false);
          setCustomFlexbillValue("");
        }

        console.log("🏢 [Settings] Loaded default branch data:", {
          name: selectedBranchData.name,
          address: branchAddress,
          tables: selectedBranchData.tables,
          openingHours: formattedOpeningHours,
        });
      }
    }
  }, [branches, selectedBranch, settings?.name]); // Dependencia en settings.name para evitar loops

  // Iniciar tour cuando la página esté completamente cargada
  useEffect(() => {
    if (!isLoading && isSignedIn && user) {
      const timer = setTimeout(() => {
        startOnboarding();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isSignedIn, user?.id, startOnboarding]);

  // Cargar integración POS cuando cambie la sucursal seleccionada
  useEffect(() => {
    let isMounted = true;

    const loadPosIntegration = async () => {
      if (!selectedBranch || !user || !isSignedIn) {
        setPosIntegration(null);
        setShowToken(false);
        return;
      }

      try {
        setPosIntegrationLoading(true);
        setShowToken(false); // Ocultar token al cambiar de sucursal
        console.log(
          "🔍 [Settings] Loading POS integration for branch:",
          selectedBranch,
        );

        const integration =
          await adminPortalApi.getBranchPosIntegration(selectedBranch);

        if (!isMounted) return;

        if (integration) {
          setPosIntegration({
            providerId: integration.provider_id,
            syncToken: integration.sync_token || null,
          });
          console.log(
            "✅ [Settings] POS integration loaded:",
            integration.provider_id,
            "- Token:",
            integration.sync_token ? "presente" : "no requerido",
          );
        } else {
          setPosIntegration(null);
          console.log("ℹ️ [Settings] No POS integration found for this branch");
        }

        // Verificar si el agente está conectado
        try {
          const agentStatus = await posApi.getAgentStatus(selectedBranch);
          if (isMounted) setAgentConnected(agentStatus.isAgentConnected);
        } catch {
          if (isMounted) setAgentConnected(false);
        }
      } catch (error) {
        if (!isMounted) return;

        console.error("❌ [Settings] Error loading POS integration:", error);
        setPosIntegration(null);
      } finally {
        if (isMounted) {
          setPosIntegrationLoading(false);
        }
      }
    };

    loadPosIntegration();

    return () => {
      isMounted = false;
    };
  }, [selectedBranch, user?.id, isSignedIn]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (!settings) return;

    let newSettings = {
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    };

    // Aplicar lógica de dependencias para notificaciones
    if (name === "orderNotifications" && type === "checkbox" && !checked) {
      // Si se deshabilita orderNotifications, deshabilitar las demás
      newSettings.emailNotifications = false;
      newSettings.smsNotifications = false;
    }

    setSettings(newSettings);
  };

  // Manejar cambio de sucursal seleccionada
  const handleBranchChange = (branchId: string) => {
    console.log("🔄 [Settings] Branch change requested to:", branchId);
    setSelectedBranch(branchId);

    if (!settings || !branchId) return;

    // Buscar la sucursal seleccionada
    const selectedBranchData = branches.find(
      (branch) => branch.id === branchId,
    );

    if (selectedBranchData && settings) {
      console.log("🏢 [Settings] Selected branch data found:", {
        id: selectedBranchData.id,
        name: selectedBranchData.name,
        opening_hours: selectedBranchData.opening_hours,
      });

      const branchAddress = selectedBranchData.address || "";

      // Cargar horarios de la sucursal o usar horarios predeterminados
      const branchOpeningHours = selectedBranchData.opening_hours || {
        monday: { open_time: "09:00", close_time: "22:00", is_closed: false },
        tuesday: { open_time: "09:00", close_time: "22:00", is_closed: false },
        wednesday: {
          open_time: "09:00",
          close_time: "22:00",
          is_closed: false,
        },
        thursday: { open_time: "09:00", close_time: "22:00", is_closed: false },
        friday: { open_time: "09:00", close_time: "23:00", is_closed: false },
        saturday: { open_time: "10:00", close_time: "23:00", is_closed: false },
        sunday: { open_time: "10:00", close_time: "20:00", is_closed: false },
      };

      console.log(
        "⏰ [Settings] Raw opening hours from branch:",
        branchOpeningHours,
      );

      // Convertir formato de base de datos a formato del frontend
      const formattedOpeningHours: {
        [key: string]: {
          open: string;
          close: string;
          closed: boolean;
          allDay: boolean;
        };
      } = {};
      Object.keys(branchOpeningHours).forEach((day) => {
        const dayData = branchOpeningHours[day];
        formattedOpeningHours[day] = {
          open: dayData.open_time || "09:00",
          close: dayData.close_time || "22:00",
          closed: dayData.is_closed || false,
          allDay: dayData.is_all_day || false,
        };
      });

      console.log(
        "✨ [Settings] Formatted opening hours for UI:",
        formattedOpeningHours,
      );

      // Actualizar dirección, horarios y número de mesas con datos de la sucursal
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              address: branchAddress,
              tableCount: selectedBranchData.tables || 0,
              openingHours: formattedOpeningHours,
            }
          : null,
      );

      // Actualizar estados originales y resetear estados de cambio
      setOriginalAddress(branchAddress);
      setOriginalOpeningHours(formattedOpeningHours);
      setIsAddressChanged(false);
      setAreHoursChanged(false);
      setHideHoursButtons(false); // Resetear estado de botones ocultos

      console.log(
        "✅ [Settings] Settings state updated for branch:",
        branchId,
        {
          address: branchAddress,
          tableCount: selectedBranchData.tables || 0,
          openingHours: formattedOpeningHours,
        },
      );
    } else {
      console.warn(
        "⚠️ [Settings] Branch not found or settings not available:",
        branchId,
      );
    }
  };

  const handleHoursChange = (
    day: string,
    field: string,
    value: string | null,
  ) => {
    if (!settings) return;

    const validationError = validateHours(
      day,
      field,
      field === "closed" ? !settings.openingHours[day].closed : value!,
    );

    // Actualizar errores de validación
    const newErrors = { ...validationErrors };
    if (validationError) {
      newErrors[`${day}_time`] = validationError;
    } else {
      delete newErrors[`${day}_time`];
    }
    setValidationErrors(newErrors);

    // Actualizar settings
    const newOpeningHours = {
      ...settings.openingHours,
      [day]: {
        ...settings.openingHours[day],
        [field]:
          field === "closed"
            ? !settings.openingHours[day].closed
            : field === "allDay"
              ? !settings.openingHours[day].allDay
              : value,
      },
    };

    setSettings({
      ...settings,
      openingHours: newOpeningHours,
    });

    // Detectar si han cambiado los horarios respecto al original
    if (originalOpeningHours) {
      const hasChanged =
        JSON.stringify(newOpeningHours) !==
        JSON.stringify(originalOpeningHours);
      console.log("🕐 [Settings] Hours change detection:", {
        newOpeningHours,
        originalOpeningHours,
        hasChanged,
        newHoursStr: JSON.stringify(newOpeningHours),
        originalHoursStr: JSON.stringify(originalOpeningHours),
      });
      setAreHoursChanged(hasChanged);
    }
  };

  const handleLogoUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // Mostrar preview para recorte
          const base64 = await ImageUploadService.fileToBase64(file);
          setTempImageSrc(base64);
          setShowCropModal(true);
        } catch (error) {
          console.error("❌ Error preparing image:", error);
          alert("Error al preparar la imagen. Por favor intenta de nuevo.");
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
      const file = new File([blob], `logo_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      const publicUrl = await ImageUploadService.updateImage(
        file,
        "logo",
        logoPreview, // Delete old image if exists
      );

      await updateRestaurant({ logo_url: publicUrl });

      // Update local preview
      setLogoPreview(publicUrl);
      setSettings((prev) => (prev ? { ...prev, logo: publicUrl } : null));
    } catch (error) {
      console.error("❌ Error uploading logo:", error);
      alert("Error al subir el logo. Por favor intenta de nuevo.");
    } finally {
      setIsUploadingLogo(false);
      setShowCropModal(false);
      setTempImageSrc("");
    }
  };

  const handleCropClose = () => {
    setShowCropModal(false);
    setTempImageSrc("");
  };

  const handleLogoDelete = async () => {
    try {
      setIsUploadingLogo(true);
      await updateRestaurant({ logo_url: "" });
      setLogoPreview("");
      setSettings((prev) => (prev ? { ...prev, logo: "" } : null));
    } catch (error) {
      console.error("❌ Error deleting logo:", error);
      alert("Error al eliminar el logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Generar URL de Pick & Go
  const getPickAndGoUrl = () => {
    if (!restaurant?.id) return "";
    return `https://pg.letseven.io/${restaurant.id}/menu`;
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
      console.error("Error copying to clipboard:", error);
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (fallbackError) {
        console.error("Fallback copy failed:", fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  // Abrir URL en nueva pestaña
  const openPickAndGoUrl = () => {
    const url = getPickAndGoUrl();
    if (url) {
      window.open(url, "_blank");
    }
  };

  // Copiar Branch ID al portapapeles
  const copyBranchId = async () => {
    if (!selectedBranch) return;

    try {
      await navigator.clipboard.writeText(selectedBranch);
      setCopySuccessBranchId(true);
      setTimeout(() => setCopySuccessBranchId(false), 2000);
    } catch (error) {
      console.error("Error copying branch ID:", error);
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = selectedBranch;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopySuccessBranchId(true);
        setTimeout(() => setCopySuccessBranchId(false), 2000);
      } catch (fallbackError) {
        console.error("Fallback copy failed:", fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  // Copiar Token POS al portapapeles
  const copyPosToken = async () => {
    const token = posIntegration?.syncToken;
    if (!token) return;

    try {
      await navigator.clipboard.writeText(token);
      setCopySuccessToken(true);
      setTimeout(() => setCopySuccessToken(false), 2000);
    } catch (error) {
      console.error("Error copying POS token:", error);
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = token;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        setCopySuccessToken(true);
        setTimeout(() => setCopySuccessToken(false), 2000);
      } catch (fallbackError) {
        console.error("Fallback copy failed:", fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  // Guardar límite de flujo de órdenes
  const handleSaveOrderFlowLimit = async () => {
    if (!selectedBranch) return;
    try {
      setIsSavingOrderFlow(true);
      setOrderFlowSaveStatus(null);
      const valueToSave = isCustomLimit
        ? customLimitValue
          ? parseInt(customLimitValue, 10)
          : null
        : maxPendingOrders;
      await adminPortalApi.updateBranchOrderFlowLimit(
        selectedBranch,
        valueToSave,
      );
      // makeRequest throws on failure — reaching here means success
      setMaxPendingOrders(valueToSave);
      setBranches((prev) =>
        prev.map((b) =>
          b.id === selectedBranch
            ? { ...b, max_pending_orders: valueToSave }
            : b,
        ),
      );
      setOrderFlowSaveStatus("success");
      setTimeout(() => setOrderFlowSaveStatus(null), 3000);
    } catch {
      setOrderFlowSaveStatus("error");
      setTimeout(() => setOrderFlowSaveStatus(null), 3000);
    } finally {
      setIsSavingOrderFlow(false);
    }
  };

  // Guardar límite de flujo Flexbill (user_orders)
  const handleSaveFlexbillFlowLimit = async () => {
    if (!selectedBranch) return;
    try {
      setIsSavingFlexbillLimit(true);
      setFlexbillSaveStatus(null);
      const valueToSave = isCustomFlexbillLimit
        ? customFlexbillValue
          ? parseInt(customFlexbillValue, 10)
          : null
        : flexbillMaxUserOrders;
      await adminPortalApi.updateBranchOrderFlowLimit(
        selectedBranch,
        undefined,
        valueToSave,
      );
      // makeRequest throws on failure — reaching here means success
      setFlexbillMaxUserOrders(valueToSave);
      setBranches((prev) =>
        prev.map((b) =>
          b.id === selectedBranch
            ? { ...b, max_pending_user_orders: valueToSave }
            : b,
        ),
      );
      setFlexbillSaveStatus("success");
      setTimeout(() => setFlexbillSaveStatus(null), 3000);
    } catch {
      setFlexbillSaveStatus("error");
      setTimeout(() => setFlexbillSaveStatus(null), 3000);
    } finally {
      setIsSavingFlexbillLimit(false);
    }
  };

  // Manejar cambios en el input de dirección
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;

    // Actualizar estado local
    setSettings((prev) => (prev ? { ...prev, address: newAddress } : null));

    // Detectar si ha cambiado respecto a la dirección original
    setIsAddressChanged(newAddress.trim() !== originalAddress.trim());
  };

  // Guardar cambios de dirección
  const handleSaveBranchAddress = async () => {
    if (!selectedBranch || !settings?.address) return;

    try {
      setIsUpdatingAddress(true);

      const response = await adminPortalApi.updateBranchAddress(
        selectedBranch,
        settings.address,
      );

      if (response.success) {
        // Actualizar la branch en el estado local
        setBranches((prev) =>
          prev.map((branch) =>
            branch.id === selectedBranch
              ? { ...branch, address: settings.address }
              : branch,
          ),
        );

        // Actualizar dirección original y resetear estado de cambio
        setOriginalAddress(settings.address);
        setIsAddressChanged(false);

        console.log("✅ Dirección actualizada correctamente");
      }
    } catch (error) {
      console.error("❌ Error actualizando dirección:", error);
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  // Descartar cambios de dirección
  const handleDiscardAddressChanges = () => {
    setSettings((prev) =>
      prev ? { ...prev, address: originalAddress } : null,
    );
    setIsAddressChanged(false);
  };

  // Guardar cambios de horarios por sucursal
  const handleSaveBranchHours = async () => {
    if (!selectedBranch || !settings?.openingHours) return;

    try {
      setIsUpdatingHours(true);

      // Convertir formato del frontend al formato de base de datos
      const dbFormatHours: {
        [key: string]: {
          open_time: string;
          close_time: string;
          is_closed: boolean;
          is_all_day: boolean;
        };
      } = {};
      Object.keys(settings.openingHours).forEach((day) => {
        const dayData = settings.openingHours[day];
        dbFormatHours[day] = {
          open_time: dayData.open,
          close_time: dayData.close,
          is_closed: dayData.closed,
          is_all_day: dayData.allDay || false,
        };
      });

      console.log(
        "💾 [Settings] Saving opening hours for branch:",
        selectedBranch,
        dbFormatHours,
      );

      const response = await adminPortalApi.updateBranchOpeningHours(
        selectedBranch,
        dbFormatHours,
      );

      console.log("📡 [Settings] API Response:", response);

      // Manejar diferentes formatos de respuesta del API
      const isSuccessfulResponse =
        (response as any).success === true ||
        ((response as any).id &&
          (response as any).name &&
          (response as any).opening_hours); // Si es un objeto branch directamente

      if (isSuccessfulResponse) {
        console.log(
          "✅ Opening hours saved successfully, updating local state...",
        );
        console.log(
          "🔍 [Settings] Response detected as successful (format:",
          response.success ? "standard" : "branch object",
          ")",
        );
        console.log(
          "🔍 [Settings] Current settings.openingHours before update:",
          settings.openingHours,
        );
        console.log(
          "🔍 [Settings] Current originalOpeningHours before update:",
          originalOpeningHours,
        );
        console.log(
          "🔍 [Settings] Current areHoursChanged before update:",
          areHoursChanged,
        );

        // Actualizar la branch en el estado local con los nuevos horarios
        setBranches((prev) => {
          const updatedBranches = prev.map((branch) =>
            branch.id === selectedBranch
              ? { ...branch, opening_hours: dbFormatHours }
              : branch,
          );
          console.log(
            "🔄 [Settings] Updated branches state with new opening hours for branch:",
            selectedBranch,
          );
          console.log(
            "🔍 [Settings] Updated branch data:",
            updatedBranches.find((b) => b.id === selectedBranch),
          );
          return updatedBranches;
        });

        // Actualizar horarios originales y resetear estado de cambio
        console.log(
          "🔄 [Settings] Setting originalOpeningHours to:",
          settings.openingHours,
        );
        setOriginalOpeningHours(settings.openingHours);

        console.log("🔄 [Settings] Setting areHoursChanged to false...");
        setAreHoursChanged(false);

        // Recargar branches desde el servidor para obtener los datos más recientes
        console.log(
          "🔄 [Settings] Reloading branches from server to get fresh data...",
        );
        try {
          const freshBranchesResponse = await adminPortalApi.getBranches();
          if (
            (freshBranchesResponse as any).success &&
            (freshBranchesResponse as any).data?.branches
          ) {
            console.log("✅ [Settings] Fresh branches loaded from server");
            setBranches((freshBranchesResponse as any).data.branches);
          }
        } catch (error) {
          console.error("❌ [Settings] Error reloading branches:", error);
        }

        console.log(
          "✅ Horarios de apertura actualizados correctamente en estado local",
        );
      } else {
        console.error("❌ API returned error:", response);
      }
    } catch (error) {
      console.error("❌ Error actualizando horarios de apertura:", error);
    } finally {
      setIsUpdatingHours(false);
    }
  };

  // Descartar cambios de horarios
  const handleDiscardHoursChanges = () => {
    if (originalOpeningHours) {
      setSettings((prev) =>
        prev ? { ...prev, openingHours: originalOpeningHours } : null,
      );
      setAreHoursChanged(false);

      // Ocultar botones temporalmente
      setHideHoursButtons(true);
      setTimeout(() => {
        setHideHoursButtons(false);
      }, 1500); // Ocultar por 1.5 segundos para "Descartar"
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!settings) return;

    // Validar todos los horarios antes de enviar
    const hasValidationErrors = Object.keys(validationErrors).length > 0;
    if (hasValidationErrors) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 5000);
      return;
    }

    try {
      setSaveStatus("saving");

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

      console.log("🚀 Sending update data:", updateData);
      console.log("📊 Current settings state:", settings);

      await updateRestaurant(updateData);

      // Guardar en localStorage solo settings que no están en el backend aún
      const localSettings = {
        language: settings.language,
        currency: settings.currency,
      };
      localStorage.setItem(
        "restaurantLocalSettings",
        JSON.stringify(localSettings),
      );

      setSaveStatus("success");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error("❌ Error saving settings:", error);
      setSaveStatus("error");
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
          <p className="text-red-600">
            Usuario no autenticado. Por favor inicia sesión.
          </p>
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
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
        <div className="flex items-center space-x-6">
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">
            Configuración
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          {/* Selector de Sucursal */}
          <div
            className="flex items-center space-x-1.5 sm:space-x-2 mr-4 sm:mr-8"
            data-tour="branches-tables"
          >
            <label className="text-xs sm:text-sm font-medium text-gray-700">
              Sucursal:
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="text-xs sm:text-sm border border-gray-300 rounded-md px-2 sm:px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:border-transparent max-w-[140px] sm:max-w-none"
              disabled={branchesLoading}
            >
              {branches.length === 0 && !branchesLoading && (
                <option value="">Sin sucursales disponibles</option>
              )}
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs sm:text-sm text-gray-700 hidden sm:inline">
            {user?.firstName || "Usuario"}
          </span>
          <div>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {/* Restaurant Information */}
        <div
          className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6"
          data-tour="restaurant-info"
        >
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900">
                Información del restaurante
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                Información básica sobre tu restaurante que se mostrará a los
                clientes.
              </p>
              <div className="flex justify-center mt-6">
                {logoPreview && (
                  <div className="w-32 h-32 rounded-lg overflow-hidden border border-gray-200 shadow-sm flex items-center justify-center bg-white p-2">
                    <img
                      src={logoPreview}
                      alt="Logo del restaurante"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="grid grid-cols-6 gap-4">
                <div className="col-span-6 sm:col-span-4">
                  <label
                    htmlFor="name"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2"
                  >
                    Nombre del restaurante
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={settings.name}
                    onChange={handleChange}
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md sm:rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-green-500"
                  />
                </div>
                <div className="col-span-6">
                  <label
                    htmlFor="address"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2"
                  >
                    Dirección
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="address"
                      id="address"
                      value={settings.address}
                      onChange={handleAddressChange}
                      className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-blue-300 rounded-md sm:rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-green-500 bg-blue-50"
                      placeholder="Dirección de la sucursal seleccionada"
                    />
                    {selectedBranch && isAddressChanged && (
                      <div className="flex gap-2 mt-1">
                        <button
                          type="button"
                          onClick={handleSaveBranchAddress}
                          disabled={isUpdatingAddress}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {isUpdatingAddress ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <SaveIcon className="w-4 h-4" />
                          )}
                          {isUpdatingAddress ? "Guardando..." : "Guardar"}
                        </button>
                        <button
                          type="button"
                          onClick={handleDiscardAddressChanges}
                          disabled={isUpdatingAddress}
                          className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 disabled:opacity-50"
                        >
                          Descartar
                        </button>
                      </div>
                    )}
                  </div>
                  {selectedBranch !== "all" && (
                    <p className="mt-1 text-xs text-gray-700">
                      {isAddressChanged
                        ? "Has modificado la dirección. Guarda los cambios para aplicarlos."
                        : "Esta dirección corresponde a la sucursal seleccionada."}
                    </p>
                  )}
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <label
                    htmlFor="phone"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2"
                  >
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="phone"
                    id="phone"
                    value={settings.phone}
                    onChange={handleChange}
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md sm:rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-green-500"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <label
                    htmlFor="email"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2"
                  >
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={settings.email}
                    onChange={handleChange}
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md sm:rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-green-500"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <label
                    htmlFor="logo"
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2"
                  >
                    Logo del restaurante
                  </label>
                  <div className="mt-2">
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={handleLogoUpload}
                        disabled={isUploadingLogo}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm sm:text-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploadingLogo ? (
                          <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                        ) : logoPreview ? (
                          <Edit3 className="h-4 w-4 mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {logoPreview ? "Cambiar logo" : "Subir logo"}
                      </button>
                      {logoPreview && (
                        <button
                          type="button"
                          onClick={handleLogoDelete}
                          disabled={isUploadingLogo}
                          className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm sm:text-sm text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-gray-500 text-[10px] sm:text-xs mt-1">
                      JPG, PNG o WEBP. Se redimensionará automáticamente.
                    </p>
                  </div>
                </div>

                {/* Configuración de mesas - Solo mostrar si FlexBill o TapOrderPay están habilitados */}
                {!servicesLoading &&
                  (isFlexBillEnabled || isTapOrderPayEnabled) && (
                    <div className="col-span-6 sm:col-span-3">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700">
                        Número de mesas
                      </label>
                      <div
                        className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md px-3 py-2 ${
                          selectedBranch !== "all"
                            ? " text-gray-800"
                            : " text-gray-800"
                        }`}
                      >
                        <div className="sm:text-sm text-sm font-medium">
                          {selectedBranch !== "all"
                            ? (() => {
                                const selectedBranchData = branches.find(
                                  (b) => b.id === selectedBranch,
                                );
                                return selectedBranchData ? (
                                  <>
                                    {selectedBranchData.tables} mesa
                                    {selectedBranchData.tables !== 1 ? "s" : ""}
                                  </>
                                ) : (
                                  "0 mesas"
                                );
                              })()
                            : `${restaurant?.tableCount || 0} mesa${(restaurant?.tableCount || 0) !== 1 ? "s" : ""} configuradas`}
                        </div>
                      </div>
                    </div>
                  )}

                {/* Pick & Go URL Section - Solo mostrar si el servicio está habilitado */}
                {!servicesLoading && isPickNGoEnabled && (
                  <div className="col-span-6">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      URL de Pick & Go
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <div className="flex-1 bg-gray-50 border border-gray-300 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2 min-w-0">
                        <code className="text-xs sm:text-sm text-gray-700 break-all">
                          {restaurant?.id ? getPickAndGoUrl() : "Cargando..."}
                        </code>
                      </div>

                      {restaurant?.id && (
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          <button
                            type="button"
                            onClick={copyPickAndGoUrl}
                            className="inline-flex items-center px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 transition-colors"
                            title="Copiar URL"
                          >
                            {copySuccess ? (
                              <>
                                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 mr-1" />
                                <span className="text-green-500">
                                  ¡Copiado!
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                                Copiar
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={openPickAndGoUrl}
                            className="inline-flex items-center px-2.5 sm:px-3 py-1.5 sm:py-2 border border-custom-green-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-custom-green-700 bg-custom-green-50 hover:bg-custom-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 transition-colors"
                            title="Abrir en nueva pestaña"
                          >
                            <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                            Abrir
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="hidden sm:inline mt-1 text-xs text-gray-500">
                      Esta es la URL pública de tu menú Pick & Go que los
                      clientes pueden usar para hacer pedidos.
                    </p>
                    <p className="sm:hidden mt-1 text-xs text-gray-500">
                      Esta es tu URL pública.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Opening Hours */}
        <div
          className="bg-white shadow px-3 sm:px-4 py-4 sm:py-5 sm:rounded-lg sm:p-6"
          data-tour="opening-hours"
        >
          <div className="sm:grid sm:grid-cols-3 sm:gap-6">
            <div className="sm:col-span-1">
              <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900">
                Horario de atención
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                Establece los horarios en que tu restaurante está abierto.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:col-span-2">
              <div className="space-y-3 sm:space-y-4">
                {Object.entries(days).map(([day, label]) => (
                  <div
                    key={day}
                    className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-x-4"
                  >
                    {/* Línea 1 en móvil: Día + Checkboxes */}
                    <div className="flex items-center gap-3 sm:gap-0 sm:contents">
                      <div className="w-16 sm:w-24">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          {label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          <input
                            id={`closed-${day}`}
                            name={`closed-${day}`}
                            type="checkbox"
                            checked={settings.openingHours[day].closed}
                            onChange={() =>
                              handleHoursChange(day, "closed", null)
                            }
                            className="h-4 w-4 text-custom-green-600 focus:ring-custom-green-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor={`closed-${day}`}
                            className="ml-1.5 text-xs sm:text-sm text-gray-700"
                          >
                            Cerrado
                          </label>
                        </div>
                        {!settings.openingHours[day].closed && (
                          <div className="flex items-center">
                            <input
                              id={`allday-${day}`}
                              name={`allday-${day}`}
                              type="checkbox"
                              checked={
                                settings.openingHours[day].allDay || false
                              }
                              onChange={() =>
                                handleHoursChange(day, "allDay", null)
                              }
                              className="h-4 w-4 text-custom-green-600 focus:ring-custom-green-500 border-gray-300 rounded"
                            />
                            <label
                              htmlFor={`allday-${day}`}
                              className="ml-1.5 text-xs sm:text-sm text-gray-700"
                            >
                              Todo el día
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Línea 2 en móvil: Inputs de hora o badge 24 hrs */}
                    {!settings.openingHours[day].closed &&
                      (settings.openingHours[day].allDay ? (
                        <div className="mt-1.5 sm:mt-0">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            24 hrs
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 sm:gap-0 sm:contents mt-1.5 sm:mt-0 pl-0 sm:pl-0">
                          <div className="flex items-center">
                            <label htmlFor={`open-${day}`} className="sr-only">
                              Abre
                            </label>
                            <input
                              type="time"
                              id={`open-${day}`}
                              value={settings.openingHours[day].open}
                              onChange={(e) =>
                                handleHoursChange(day, "open", e.target.value)
                              }
                              className="block w-full shadow-sm text-xs sm:text-sm border-gray-300 rounded-md focus:ring-custom-green-500 focus:border-custom-green-500"
                            />
                          </div>
                          <span className="text-xs sm:text-base text-gray-500">
                            a
                          </span>
                          <div className="flex items-center">
                            <label htmlFor={`close-${day}`} className="sr-only">
                              Cierra
                            </label>
                            <input
                              type="time"
                              id={`close-${day}`}
                              value={settings.openingHours[day].close}
                              onChange={(e) =>
                                handleHoursChange(day, "close", e.target.value)
                              }
                              className="block w-full shadow-sm text-xs sm:text-sm border-gray-300 rounded-md focus:ring-custom-green-500 focus:border-custom-green-500"
                            />
                          </div>
                        </div>
                      ))}
                    {/* Mostrar error de validación si existe */}
                    {validationErrors[`${day}_time`] && (
                      <div className="w-full sm:w-auto">
                        <p className="text-xs sm:text-sm text-red-600 mt-1">
                          {validationErrors[`${day}_time`]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Botón para guardar horarios por sucursal */}
              {(() => {
                const shouldShowButtons = selectedBranch && areHoursChanged;
                console.log("🔍 [Settings] Button render check:", {
                  selectedBranch,
                  areHoursChanged,
                  shouldShowButtons,
                  hideHoursButtons,
                });
                return shouldShowButtons;
              })() && (
                <div className="flex gap-2 mt-3 sm:mt-4">
                  <button
                    type="button"
                    onClick={handleSaveBranchHours}
                    disabled={isUpdatingHours}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2"
                  >
                    {isUpdatingHours ? (
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <SaveIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                    {isUpdatingHours ? "Guardando..." : "Guardar horarios"}
                  </button>
                  {!hideHoursButtons && (
                    <button
                      type="button"
                      onClick={handleDiscardHoursChanges}
                      disabled={isUpdatingHours}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-500 text-white text-xs sm:text-sm rounded-md hover:bg-gray-600 disabled:opacity-50"
                    >
                      Descartar
                    </button>
                  )}
                </div>
              )}
              {selectedBranch && areHoursChanged && !hideHoursButtons && (
                <p className="mt-2 text-xs text-gray-700">
                  Has modificado los horarios de esta sucursal. Guarda los
                  cambios para aplicarlos.
                </p>
              )}
              {selectedBranch && areHoursChanged && hideHoursButtons && (
                <p className="mt-2 text-xs text-green-600">
                  Acción procesada correctamente.
                </p>
              )}
              {selectedBranch && !areHoursChanged && (
                <p className="mt-2 text-xs text-gray-700">
                  Estos horarios corresponden a la sucursal seleccionada.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Control de flujo de órdenes */}
        {selectedBranch && (
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900">
                  Control de flujo
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  Límite máximo de órdenes activas al mismo tiempo en esta
                  sucursal. Cuando se alcanza, las nuevas órdenes esperan antes
                  de enviarse a cocina.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                {/* Tabs de servicio — solo si hay al menos un servicio general Y Flexbill habilitados */}
                {isFlexBillEnabled &&
                  (isPickNGoEnabled || isTapOrderPayEnabled) && (
                    <div className="flex gap-2 mb-5">
                      <button
                        type="button"
                        onClick={() => setSelectedFlowServiceTab("general")}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          selectedFlowServiceTab === "general"
                            ? "bg-custom-green-600 hover:bg-custom-green-700 text-white"
                            : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                        }`}
                      >
                        General
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedFlowServiceTab("flex-bill")}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          selectedFlowServiceTab === "flex-bill"
                            ? "bg-custom-green-600 hover:bg-custom-green-700 text-white"
                            : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
                        }`}
                      >
                        Flex Bill
                      </button>
                    </div>
                  )}

                {/* TAB: General (tap-order-pay, pick-and-go, room service) */}
                {(selectedFlowServiceTab === "general" ||
                  !isFlexBillEnabled ||
                  (!isPickNGoEnabled && !isTapOrderPayEnabled)) &&
                  (isPickNGoEnabled || isTapOrderPayEnabled) && (
                    <div>
                      <p className="text-xs text-gray-400 mb-3">
                        Tap Order & Pay, Pick &amp; Go y Room Service combinados
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_LIMITS.map((v) => {
                          const active =
                            !isCustomLimit && maxPendingOrders === v;
                          return (
                            <button
                              key={v}
                              type="button"
                              onClick={() => {
                                setMaxPendingOrders(v);
                                setIsCustomLimit(false);
                                setCustomLimitValue("");
                              }}
                              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                active
                                  ? "bg-custom-green-600 text-white border-gray-900"
                                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                              }`}
                            >
                              {v}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomLimit(true);
                            setMaxPendingOrders(null);
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1 ${
                            isCustomLimit
                              ? "bg-custom-green-600 hover:bg-custom-green-700 text-white"
                              : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Personalizado
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMaxPendingOrders(null);
                            setIsCustomLimit(false);
                            setCustomLimitValue("");
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            !isCustomLimit && maxPendingOrders === null
                              ? "bg-custom-green-600 hover:bg-custom-green-700 text-white"
                              : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                          }`}
                        >
                          Sin límite
                        </button>
                      </div>
                      {isCustomLimit && (
                        <div className="mt-3">
                          <input
                            type="number"
                            min="1"
                            placeholder="Ej. 40"
                            value={customLimitValue}
                            onChange={(e) =>
                              setCustomLimitValue(e.target.value)
                            }
                            className="block w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        </div>
                      )}
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleSaveOrderFlowLimit}
                          disabled={isSavingOrderFlow}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-custom-green-600 hover:bg-custom-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                        >
                          <SaveIcon className="w-4 h-4" />
                          {isSavingOrderFlow
                            ? "Guardando..."
                            : "Guardar límite"}
                        </button>
                        {orderFlowSaveStatus === "success" && (
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            <Check className="w-4 h-4" /> Guardado
                          </span>
                        )}
                        {orderFlowSaveStatus === "error" && (
                          <span className="text-sm text-red-600">
                            Error al guardar
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                {/* TAB: Flex Bill (user_orders) */}
                {isFlexBillEnabled &&
                  (selectedFlowServiceTab === "flex-bill" ||
                    (!isPickNGoEnabled && !isTapOrderPayEnabled)) && (
                    <div>
                      <p className="text-xs text-gray-400 mb-3">
                        Personas activos al mismo tiempo en Flex Bill
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {FLEXBILL_PRESET_LIMITS.map((v) => {
                          const active =
                            !isCustomFlexbillLimit &&
                            flexbillMaxUserOrders === v;
                          return (
                            <button
                              key={v}
                              type="button"
                              onClick={() => {
                                setFlexbillMaxUserOrders(v);
                                setIsCustomFlexbillLimit(false);
                                setCustomFlexbillValue("");
                              }}
                              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                active
                                  ? "bg-custom-green-600 text-white border-gray-900"
                                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                              }`}
                            >
                              {v}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomFlexbillLimit(true);
                            setFlexbillMaxUserOrders(null);
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center gap-1 ${
                            isCustomFlexbillLimit
                              ? "bg-custom-green-600 hover:bg-custom-green-700 text-white"
                              : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Personalizado
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFlexbillMaxUserOrders(null);
                            setIsCustomFlexbillLimit(false);
                            setCustomFlexbillValue("");
                          }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            !isCustomFlexbillLimit &&
                            flexbillMaxUserOrders === null
                              ? "bg-custom-green-600 hover:bg-custom-green-700 text-white "
                              : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                          }`}
                        >
                          Sin límite
                        </button>
                      </div>
                      {isCustomFlexbillLimit && (
                        <div className="mt-3">
                          <input
                            type="number"
                            min="1"
                            placeholder="Ej. 80"
                            value={customFlexbillValue}
                            onChange={(e) =>
                              setCustomFlexbillValue(e.target.value)
                            }
                            className="block w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        </div>
                      )}
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleSaveFlexbillFlowLimit}
                          disabled={isSavingFlexbillLimit}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-custom-green-600 hover:bg-custom-green-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                        >
                          <SaveIcon className="w-4 h-4" />
                          {isSavingFlexbillLimit
                            ? "Guardando..."
                            : "Guardar límite"}
                        </button>
                        {flexbillSaveStatus === "success" && (
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            <Check className="w-4 h-4" /> Guardado
                          </span>
                        )}
                        {flexbillSaveStatus === "error" && (
                          <span className="text-sm text-red-600">
                            Error al guardar
                          </span>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* POS Integration Info */}
        {selectedBranch && posIntegrationLoading && (
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="flex items-center justify-center py-4">
              <div className="h-6 w-6 border-2 border-custom-green-500 border-t-transparent rounded-full animate-spin mr-3"></div>
              <span className="text-sm text-gray-600">
                Cargando información de integración...
              </span>
            </div>
          </div>
        )}

        {selectedBranch && !posIntegrationLoading && !posIntegration && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 sm:px-5 sm:py-4">
            <p className="text-xs sm:text-sm text-blue-700">
              Esta sucursal no tiene integración POS configurada. Puedes
              solicitarla al equipo de Even.
            </p>
          </div>
        )}

        {selectedBranch && !posIntegrationLoading && posIntegration && (
          <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-1">
                <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900">
                  Información de integración POS
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                  Datos de conexión con el sistema punto de venta.
                </p>
              </div>
              <div className="mt-5 md:mt-0 md:col-span-2">
                <div className="space-y-4">
                  {/* Branch ID */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      ID de Sucursal
                    </label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <div className="flex-1 bg-gray-50 border border-gray-300 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2 min-w-0">
                        <code className="text-xs sm:text-sm text-gray-700 break-all">
                          {selectedBranch}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={copyBranchId}
                        className="inline-flex items-center px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 transition-colors flex-shrink-0"
                        title="Copiar ID"
                      >
                        {copySuccessBranchId ? (
                          <>
                            <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 mr-1" />
                            <span className="text-green-500">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                            Copiar
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* POS Token */}
                  {posIntegration.syncToken ? (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Token de Sincronización
                      </label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <div className="flex-1 bg-gray-50 border border-gray-300 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2 min-w-0">
                          <code className="text-xs sm:text-sm text-gray-700 break-all">
                            {showToken
                              ? posIntegration.syncToken
                              : "••••••••••••••••••••••••"}
                          </code>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowToken(!showToken)}
                            className="inline-flex items-center px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 transition-colors"
                            title={
                              showToken ? "Ocultar token" : "Mostrar token"
                            }
                          >
                            {showToken ? (
                              <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={copyPosToken}
                            className="inline-flex items-center px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 transition-colors"
                            title="Copiar Token"
                          >
                            {copySuccessToken ? (
                              <>
                                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 mr-1" />
                                <span className="text-green-500">
                                  ¡Copiado!
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                                Copiar
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Este token se utiliza para sincronizar órdenes con el
                        sistema POS.
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                      ℹ️ Esta integración POS no requiere token de
                      sincronización.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Printer Settings */}
        {selectedBranch && (
          <PrinterSettings
            branchId={selectedBranch}
            agentConnected={agentConnected}
          />
        )}

        {/* Regional Settings */}
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900">
                Configuración regional
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                Configura el idioma y moneda.
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label
                    htmlFor="language"
                    className="block text-xs sm:text-sm font-medium text-gray-700"
                  >
                    Idioma
                  </label>
                  <select
                    id="language"
                    name="language"
                    value={settings.language}
                    onChange={handleChange}
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md sm:rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-green-500"
                  >
                    <option value="es">Español</option>
                    <option value="en">Inglés</option>
                  </select>
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <label
                    htmlFor="currency"
                    className="block text-xs sm:text-sm font-medium text-gray-700"
                  >
                    Moneda
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={settings.currency}
                    onChange={handleChange}
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md sm:rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-green-500"
                  >
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

        {saveStatus === "success" && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-600">
              Configuración guardada exitosamente
            </p>
          </div>
        )}

        {saveStatus === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">
              {Object.keys(validationErrors).length > 0
                ? "Por favor corrige los errores de validación en los horarios antes de guardar."
                : "Error al guardar la configuración. Por favor intenta de nuevo."}
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm sm:text-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            data-tour="save-button"
            disabled={isUpdating || saveStatus === "saving"}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm sm:text-sm text-sm font-medium rounded-md text-white bg-custom-green-600 hover:bg-custom-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating || saveStatus === "saving" ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <SaveIcon className="-ml-1 mr-2 h-5 w-5" />
            )}
            {isUpdating || saveStatus === "saving" ? "Guardando..." : "Guardar"}
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

      {/* Estilos responsive para onboarding */}
      <style dangerouslySetInnerHTML={{ __html: joyrideResponsiveCSS }} />
      {/* Tour guiado para configuraciones */}
      <Joyride
        callback={handleJoyrideCallback}
        continuous
        hideCloseButton
        run={run}
        scrollToFirstStep
        showProgress
        showSkipButton
        steps={steps}
        styles={joyrideTheme}
        locale={{
          back: "Atrás",
          close: "Cerrar",
          last: "Finalizar",
          next: "Siguiente",
          nextLabelWithProgress: `Siguiente {step} de {steps}`,
          skip: "Saltar tour",
        }}
      />
    </div>
  );
};

export default Settings;
