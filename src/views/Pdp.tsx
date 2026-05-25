"use client";

import React, { useState, useEffect } from "react";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import Image from "next/image";
import { useAdminPortalApi } from "../services/adminPortalApi";
import { usePaymentProviderApi } from "../services/paymentProviderApi";

interface PaymentProvider {
  id: string;
  name: string;
  description: string;
  logo: string;
  gradient: string;
  headerBg: string;
  accentColor: string;
  websiteUrl: string;
  comingSoon?: boolean;
}

const paymentProviders: PaymentProvider[] = [
  {
    id: "ecartpay",
    name: "eCartPay",
    description: "Solución de pagos integrada con Even.",
    logo: "/ecartpay_logo.webp",
    gradient: "from-emerald-500 to-teal-600",
    headerBg: "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700",
    accentColor: "emerald",
    websiteUrl: "https://app.ecart.com/partners/69d7debb422e65a9a33fe42b",
  },
  {
    id: "clip",
    name: "Clip",
    description: "PROXIMAMENTE",
    logo: "/clip_logo.png",
    gradient: "from-orange-500 to-amber-600",
    headerBg: "bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600",
    accentColor: "orange",
    websiteUrl: "https://clip.mx",
    comingSoon: true,
  },
];

const Pdp = () => {
  const [isHovering, setIsHovering] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const adminPortalApi = useAdminPortalApi();
  const paymentProviderApi = usePaymentProviderApi();

  useEffect(() => {
    const loadProviderData = async () => {
      try {
        setIsLoading(true);

        const servicesData = await adminPortalApi.getEnabledServices();
        const cid = servicesData.client_id;
        setClientId(cid);

        const result = await paymentProviderApi.getClientProvider(cid);
        if (result.provider) {
          setSelectedProvider(result.provider);
        }
      } catch (error) {
        console.error("Error cargando proveedor de pago:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProviderData();
  }, []);

  const handleSelectProvider = async (providerId: string) => {
    if (!clientId || isSaving) return;

    const previousProvider = selectedProvider;
    setSelectedProvider(providerId);
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await paymentProviderApi.setClientProvider(clientId, providerId);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error guardando proveedor:", error);
      setSelectedProvider(previousProvider);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenWebsite = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-3 sm:gap-0">
        <div>
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">
            Proveedores de Pago
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Selecciona el proveedor de pago activo para tu negocio
          </p>
        </div>

        {(isSaving || saveSuccess) && (
          <div
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg ${
              saveSuccess
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-50 text-gray-600"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Guardado
              </>
            )}
          </div>
        )}
      </div>

      {/* Skeleton de carga */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl shadow-lg overflow-hidden animate-pulse"
            >
              <div className="h-32 bg-gray-200" />
              <div className="bg-white p-6 sm:p-8 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-10 bg-gray-200 rounded-xl" />
                <div className="h-12 bg-gray-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {paymentProviders.map((provider) => {
            const isHovered = isHovering === provider.id;
            const isSelected = selectedProvider === provider.id;

            return (
              <div
                key={provider.id}
                onMouseEnter={() => setIsHovering(provider.id)}
                onMouseLeave={() => setIsHovering(null)}
                onClick={() =>
                  !provider.comingSoon &&
                  !isSaving &&
                  handleSelectProvider(provider.id)
                }
                className={`
                  relative overflow-hidden rounded-2xl transition-all duration-300 group
                  ${provider.comingSoon || isSaving ? "opacity-60" : "cursor-pointer"}
                  ${isSelected ? "ring-4 ring-offset-2 ring-emerald-500" : ""}
                  shadow-lg hover:shadow-xl
                `}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 z-10 bg-white rounded-full p-1.5 shadow-lg">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                )}

                <div
                  className={`${provider.headerBg} p-6 sm:p-8 relative overflow-hidden`}
                >
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/30" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/20" />
                    <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/10" />
                  </div>

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-white shadow-lg transition-transform duration-300 flex items-center justify-center p-2 sm:p-3">
                        <Image
                          src={provider.logo}
                          alt={`${provider.name} logo`}
                          width={90}
                          height={90}
                          className="object-contain w-full h-full"
                        />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-sm">
                          {provider.name}
                        </h2>
                        {provider.comingSoon && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white font-medium">
                            Próximamente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 sm:p-8">
                  <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed">
                    {provider.description}
                  </p>

                  <div className="mt-8 flex flex-col gap-3">
                    <div
                      className={`
                        w-full py-3 px-6 rounded-xl font-semibold text-sm sm:text-base
                        flex items-center justify-center gap-2 transition-all duration-300
                        ${
                          isSelected
                            ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-500"
                            : "bg-gray-100 text-gray-600 border-2 border-transparent"
                        }
                      `}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-5 h-5" />
                          Seleccionado
                        </>
                      ) : (
                        "Clic para seleccionar"
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        !provider.comingSoon &&
                          handleOpenWebsite(provider.websiteUrl);
                      }}
                      disabled={provider.comingSoon}
                      className={`
                        w-full py-3.5 px-6 rounded-xl font-semibold text-sm sm:text-base
                        transition-all duration-300 flex items-center justify-center gap-2
                        ${
                          provider.comingSoon
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : `${provider.headerBg} text-white shadow-lg cursor-pointer`
                        }
                      `}
                    >
                      {provider.comingSoon ? (
                        "Próximamente"
                      ) : (
                        <>
                          Visitar {provider.name}
                          <ExternalLink
                            className={`w-5 h-5 transition-transform duration-300 ${isHovered ? "translate-x-0.5 -translate-y-0.5" : ""}`}
                          />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Pdp;
