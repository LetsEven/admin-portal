import React, { useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import Image from "next/image";

interface PaymentProvider {
  id: string;
  name: string;
  description: string;
  features: string[];
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
    description:
      "Solución de pagos integrada con Xquisito. Acepta tarjetas, transferencias y más.",
    features: [
      "Hasta 18 MSI",
      "2.9% de comisión",
      "Soporte 24/7 en español",
      "Integración Apple Pay & Google Pay",
    ],
    logo: "/ecartpay_logo.webp",
    gradient: "from-emerald-500 to-teal-600",
    headerBg: "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700",
    accentColor: "emerald",
    websiteUrl: "https://ecartpay.com",
  },
  {
    id: "clip",
    name: "Clip",
    description:
      "Pasarela de pago líder en México. Acepta todas las tarjetas y ofrece múltiples opciones de cobro.",
    features: [
      "Hasta 24 MSI",
      "3.6% de comisión",
      "Acepta todas las tarjetas",
      "Pagos sin contacto (NFC)",
    ],
    logo: "/clip_logo.png",
    gradient: "from-orange-500 to-amber-600",
    headerBg: "bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600",
    accentColor: "orange",
    websiteUrl: "https://clip.mx",
  },
];

const Pvp = () => {
  const [isHovering, setIsHovering] = useState<string | null>(null);

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
            Conoce los proveedores de pago disponibles para tu negocio
          </p>
        </div>
      </div>

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {paymentProviders.map((provider) => {
          const isHovered = isHovering === provider.id;

          return (
            <div
              key={provider.id}
              onMouseEnter={() => setIsHovering(provider.id)}
              onMouseLeave={() => setIsHovering(null)}
              className={`
                  relative overflow-hidden rounded-2xl transition-all duration-300 group
                  ${provider.comingSoon ? "opacity-60" : ""}
                  shadow-lg
                `}
            >
              {/* Card Header with Gradient and Logo */}
              <div
                className={`${provider.headerBg} p-6 sm:p-8 relative overflow-hidden`}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/30" />
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/20" />
                  <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/10" />
                </div>

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4 sm:gap-5">
                    {/* Logo Container */}
                    <div
                      className={`
                        relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden
                        bg-white shadow-lg
                        transition-transform duration-300
                        flex items-center justify-center p-2 sm:p-3
                      `}
                    >
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

              {/* Card Body */}
              <div className="bg-white p-6 sm:p-8">
                <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed">
                  {provider.description}
                </p>

                {/* Features List */}
                <div className="space-y-3">
                  {provider.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 group/feature"
                    >
                      <div
                        className={`
                          flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                          transition-all duration-200
                          ${
                            provider.accentColor === "emerald"
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-orange-100 text-orange-600"
                          }
                        `}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <div className="mt-8">
                  <button
                    onClick={() =>
                      !provider.comingSoon &&
                      handleOpenWebsite(provider.websiteUrl)
                    }
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
                        Configurar {provider.name}
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
    </div>
  );
};

export default Pvp;
