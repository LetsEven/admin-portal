import React, { useEffect, useState, useRef, useCallback } from "react";
import Joyride from "react-joyride";
import {
  SaveIcon,
  Camera,
  Edit3,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Clock,
  SlidersHorizontal,
  Server,
  Printer,
  Tag,
} from "lucide-react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRestaurant } from "../hooks/useRestaurant";
import { ImageUploadService } from "../services/imageUploadService";
import ImageCropModal from "../components/ImageCropModal";
import { useAdminPortalApi } from "../services/adminPortalApi";
import { usePosApi } from "../services/posApi";
import {
  useSettingsOnboarding,
  joyrideTheme,
  joyrideResponsiveCSS,
} from "../hooks/useSettingsOnboarding";
import DineModal from "../components/settings/DineModal";
import HorarioModal from "../components/settings/HorarioModal";
import ControlFlujoModal from "../components/settings/ControlFlujoModal";
import PosConfigModal from "../components/settings/PosConfigModal";
import ImpresorasModal from "../components/settings/ImpresorasModal";

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
  branch_number?: number;
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
  const [isTapPayEnabled, setIsTapPayEnabled] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesLoaded, setServicesLoaded] = useState(false);

  // Tap & Pay print setting (restaurant-level)
  const [tapPayPrint, setTapPayPrint] = useState(true);

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
  const ORDER_LIMIT_OPTIONS = Array.from({ length: 100 }, (_, i) => i + 1);
  const [maxPendingOrders, setMaxPendingOrders] = useState<number | null>(null);
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

  // Modal abierto en la sección de configuración
  const [openModal, setOpenModal] = useState<
    null | "dine" | "horario" | "flujo" | "pos" | "impresoras"
  >(null);

  // Sincronizar estado local con datos del restaurante
  useEffect(() => {
    if (restaurant) {
      console.log("🔍 Restaurant data received in Settings:", restaurant);
      if (restaurant.tapPayPrint !== undefined) setTapPayPrint(restaurant.tapPayPrint);
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
        setIsTapPayEnabled(enabledServiceIds.includes("tap-pay"));

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

        // Cargar límite de flujo Flexbill (user_orders)
        const flexbillMax = selectedBranchData.max_pending_user_orders ?? null;
        setFlexbillMaxUserOrders(flexbillMax);

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

  const handleTapPayPrintChange = async (val: boolean) => {
    try {
      await updateRestaurant({ tapPayPrint: val });
      setTapPayPrint(val);
    } catch (error) {
      console.error("❌ Error saving tap_pay_print:", error);
    }
  };

  // Generar URL de Pick & Go (por sucursal, usando branch_number)
  const getPickAndGoUrl = () => {
    if (!restaurant?.id) return "";
    const baseUrl = `https://pg.letseven.io/${restaurant.id}/menu`;
    const branch = branches.find((b) => b.id === selectedBranch);
    return branch?.branch_number != null
      ? `${baseUrl}?branch=${branch.branch_number}`
      : baseUrl;
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
      const valueToSave = maxPendingOrders;
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
      const valueToSave = flexbillMaxUserOrders;
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
          <span className="text-xs sm:text-sm text-gray-700 hidden sm:inline">
            {user?.firstName || "Usuario"}
          </span>
          <div>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {/* === Tarjeta principal de configuración === */}
        <div
          className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6"
          data-tour="restaurant-info"
        >
          {/* === Sección 1: Información general del restaurante === */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-6">
            {/* Logo circular */}
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleLogoUpload}
                disabled={isUploadingLogo}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border border-gray-200 shadow-sm flex items-center justify-center bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                title={logoPreview ? "Cambiar logo" : "Subir logo"}
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo del restaurante"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="h-8 w-8 text-gray-400" />
                )}
              </button>
              {/* Acciones debajo del logo */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleLogoUpload}
                  disabled={isUploadingLogo}
                  title="Cambiar logo"
                  className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleLogoDelete}
                    disabled={isUploadingLogo}
                    title="Quitar logo"
                    className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Grid: Nombre · Teléfono · Correo · Dine [· Tap&Pay mode] */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
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
              <div>
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
              <div>
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
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Dine
                </label>
                <button
                  type="button"
                  onClick={() => setOpenModal("dine")}
                  className="w-full inline-flex items-center gap-2 px-4 py-2 border border-gray-300 shadow-sm sm:text-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-green-500 transition-colors"
                >
                  <Tag className="h-4 w-4 text-custom-green-600" />
                  Gestionar servicios
                </button>
              </div>

            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-6"></div>

          {/* === Sección 2: Configuración por sucursal === */}
          <div className="space-y-4">
            {/* Sucursal (izquierda) + Dirección (derecha) en la misma fila */}
            <div
              className="grid grid-cols-1 sm:grid-cols-4 gap-4"
              data-tour="branches-tables"
            >
              {/* Selector de sucursal */}
              <div className="sm:col-span-1">
                <label
                  htmlFor="branch-select"
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2"
                >
                  Sucursal
                </label>
                <select
                  id="branch-select"
                  value={selectedBranch}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  disabled={branchesLoading}
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md sm:rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-custom-green-500"
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

              {/* Dirección */}
              <div className="sm:col-span-3">
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
                    className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md sm:rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-950"
                    placeholder="Dirección de la sucursal seleccionada"
                  />
                  {selectedBranch && isAddressChanged && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveBranchAddress}
                        disabled={isUpdatingAddress}
                        className="px-3 py-1 bg-custom-green-600 hover:bg-custom-green-700 text-white text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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
              </div>
            </div>

            {/* Número de mesas + URL — misma cuadrícula que Sucursal/Dirección */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Configuración de mesas - Solo si FlexBill o TapOrderPay habilitados */}
              {!servicesLoading &&
                (isFlexBillEnabled || isTapOrderPayEnabled) && (
                  <div className="sm:col-span-1">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Número de mesas
                    </label>
                    <div className="bg-gray-50 border border-gray-300 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2">
                      <span className="text-xs sm:text-sm text-gray-700">
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
                      </span>
                    </div>
                  </div>
                )}

              {/* Pick & Go URL - Solo si el servicio está habilitado */}
              {!servicesLoading && isPickNGoEnabled && (
                <div className="sm:col-span-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    URL de Pick & Go
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-50 border border-gray-300 rounded-md px-2.5 sm:px-3 py-1.5 sm:py-2 min-w-0">
                      <code className="text-xs sm:text-sm text-gray-700 break-all">
                        {restaurant?.id ? getPickAndGoUrl() : "Cargando..."}
                      </code>
                    </div>

                    {restaurant?.id && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={copyPickAndGoUrl}
                          className="inline-flex items-center px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                          title="Copiar URL"
                        >
                          {copySuccess ? (
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

                        <button
                          type="button"
                          onClick={openPickAndGoUrl}
                          className="inline-flex items-center px-2.5 sm:px-3 py-1.5 sm:py-2 border border-custom-green-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-custom-green-700 bg-custom-green-50 hover:bg-custom-green-100 focus:outline-none  transition-colors"
                          title="Abrir en nueva pestaña"
                        >
                          <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                          Abrir
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-6"></div>

          {/* === Sección 3: Acciones por sucursal (cada botón abre un modal) === */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setOpenModal("horario")}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-custom-green-500 hover:bg-gray-50 transition-colors text-left"
            >
              <Clock className="h-5 w-5 text-custom-green-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">Horario</span>
            </button>
            <button
              type="button"
              onClick={() => setOpenModal("flujo")}
              disabled={!selectedBranch}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-custom-green-500 hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent"
            >
              <SlidersHorizontal className="h-5 w-5 text-custom-green-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Control de flujo
              </span>
            </button>
            <button
              type="button"
              onClick={() => setOpenModal("pos")}
              disabled={!selectedBranch}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-custom-green-500 hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent"
            >
              <Server className="h-5 w-5 text-custom-green-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Configuración POS
              </span>
            </button>
            <button
              type="button"
              onClick={() => setOpenModal("impresoras")}
              disabled={!selectedBranch}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-custom-green-500 hover:bg-gray-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-transparent"
            >
              <Printer className="h-5 w-5 text-custom-green-600 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700">
                Impresoras
              </span>
            </button>
          </div>
        </div>

        {/* Horario, Control de flujo e Integración POS → ahora en sus modales
            (HorarioModal, ControlFlujoModal, PosConfigModal) */}
        {/* Impresoras → ImpresorasModal */}

        {/* Configuración regional — TODO: re-add later (idioma / moneda).
            Desactivada por ahora; reactivar cuando se requiera. */}
        {false && (
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
                      value={settings?.language}
                      onChange={handleChange}
                      className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md sm:rounded-lg focus:outline-none"
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
                      value={settings?.currency}
                      onChange={handleChange}
                      className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-md sm:rounded-lg focus:outline-none"
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
        )}

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
            type="submit"
            data-tour="save-button"
            disabled={isUpdating || saveStatus === "saving"}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm sm:text-sm text-sm font-medium rounded-md text-white bg-custom-green-600 hover:bg-custom-green-700 focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Modales de configuración avanzada */}
      <DineModal
        isOpen={openModal === "dine"}
        onClose={() => setOpenModal(null)}
      />

      <HorarioModal
        isOpen={openModal === "horario"}
        onClose={() => setOpenModal(null)}
        days={days}
        openingHours={settings.openingHours}
        validationErrors={validationErrors}
        onHoursChange={handleHoursChange}
        onSave={handleSaveBranchHours}
        isSaving={isUpdatingHours}
        areHoursChanged={areHoursChanged}
      />

      <ControlFlujoModal
        isOpen={openModal === "flujo"}
        onClose={() => setOpenModal(null)}
        isFlexBillEnabled={isFlexBillEnabled}
        isPickNGoEnabled={isPickNGoEnabled}
        isTapOrderPayEnabled={isTapOrderPayEnabled}
        selectedFlowServiceTab={selectedFlowServiceTab}
        setSelectedFlowServiceTab={setSelectedFlowServiceTab}
        maxPendingOrders={maxPendingOrders}
        setMaxPendingOrders={setMaxPendingOrders}
        onSaveGeneral={handleSaveOrderFlowLimit}
        isSavingGeneral={isSavingOrderFlow}
        generalSaveStatus={orderFlowSaveStatus}
        flexbillMaxUserOrders={flexbillMaxUserOrders}
        setFlexbillMaxUserOrders={setFlexbillMaxUserOrders}
        onSaveFlexbill={handleSaveFlexbillFlowLimit}
        isSavingFlexbill={isSavingFlexbillLimit}
        flexbillSaveStatus={flexbillSaveStatus}
      />

      <PosConfigModal
        isOpen={openModal === "pos"}
        onClose={() => setOpenModal(null)}
        branchId={selectedBranch}
        isLoading={posIntegrationLoading}
        posIntegration={posIntegration}
        showToken={showToken}
        setShowToken={setShowToken}
        onCopyBranchId={copyBranchId}
        copySuccessBranchId={copySuccessBranchId}
        onCopyToken={copyPosToken}
        copySuccessToken={copySuccessToken}
      />

      <ImpresorasModal
        isOpen={openModal === "impresoras"}
        onClose={() => setOpenModal(null)}
        branchId={selectedBranch}
        agentConnected={agentConnected}
        tapPayPrint={tapPayPrint}
        onTapPayPrintChange={handleTapPayPrintChange}
        isTapPayEnabled={isTapPayEnabled}
      />

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
