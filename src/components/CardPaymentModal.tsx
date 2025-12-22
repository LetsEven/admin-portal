import React, { useState } from "react";
import { XIcon, CreditCardIcon, LockIcon } from "lucide-react";
import { SubscriptionPlan } from "../services/subscriptionsApi";

// ===============================================
// TIPOS E INTERFACES
// ===============================================

export interface CardData {
  fullName: string;
  cardNumber: string;
  expDate: string;
  cvv: string;
  email: string;
}

interface CardPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cardData: CardData) => void;
  plan: SubscriptionPlan | null;
  loading?: boolean;
}

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================

const CardPaymentModal: React.FC<CardPaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  plan,
  loading = false,
}) => {
  // Estados del formulario
  const [fullName, setFullName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expDate, setExpDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [email, setEmail] = useState("");

  // Estados de validación
  const [errors, setErrors] = useState<Partial<CardData>>({});

  // Funciones de formateo
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpDate = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  // Manejadores de cambio
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const textOnlyRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s'-]*$/;

    if (textOnlyRegex.test(value)) {
      setFullName(value);
      if (errors.fullName) {
        setErrors(prev => ({ ...prev, fullName: "" }));
      }
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numbersOnlyRegex = /^[0-9\s]*$/;

    if (numbersOnlyRegex.test(value)) {
      const formatted = formatCardNumber(value);
      setCardNumber(formatted);
      if (errors.cardNumber) {
        setErrors(prev => ({ ...prev, cardNumber: "" }));
      }
    }
  };

  const handleExpDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const expDateRegex = /^[0-9/]*$/;

    if (expDateRegex.test(value)) {
      const formatted = formatExpDate(value);
      setExpDate(formatted);
      if (errors.expDate) {
        setErrors(prev => ({ ...prev, expDate: "" }));
      }
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numbersOnlyRegex = /^[0-9]*$/;

    if (numbersOnlyRegex.test(value)) {
      setCvv(value.substring(0, 4)); // Máximo 4 dígitos
      if (errors.cvv) {
        setErrors(prev => ({ ...prev, cvv: "" }));
      }
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: "" }));
    }
  };

  // Función de validación
  const validateForm = (): boolean => {
    const newErrors: Partial<CardData> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "El nombre completo es requerido";
    }

    if (!cardNumber.trim()) {
      newErrors.cardNumber = "El número de tarjeta es requerido";
    } else if (cardNumber.replace(/\s/g, "").length < 13) {
      newErrors.cardNumber = "Número de tarjeta inválido";
    }

    if (!expDate.trim()) {
      newErrors.expDate = "La fecha de expiración es requerida";
    } else if (!/^\d{2}\/\d{2}$/.test(expDate)) {
      newErrors.expDate = "Formato de fecha inválido (MM/YY)";
    }

    if (!cvv.trim()) {
      newErrors.cvv = "El CVV es requerido";
    } else if (cvv.length < 3) {
      newErrors.cvv = "CVV inválido";
    }

    if (!email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejador de envío
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const cardData: CardData = {
      fullName: fullName.trim(),
      cardNumber: cardNumber.replace(/\s/g, ""),
      expDate,
      cvv,
      email: email.trim(),
    };

    onSubmit(cardData);
  };

  // Función para llenar datos de prueba (solo desarrollo)
  const fillTestCard = () => {
    setFullName("Test User");
    setCardNumber("4242 4242 4242 4242");
    setExpDate("12/25");
    setCvv("123");
    setEmail("test@example.com");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 rounded-t-xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCardIcon className="h-6 w-6 text-custom-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Datos de Pago</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Plan Info */}
          {plan && (
            <div className="mt-4 p-3 bg-custom-green-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-custom-green-800">
                  {plan.name}
                </span>
                <span className="text-lg font-bold text-custom-green-600">
                  ${plan.price} {plan.currency}
                </span>
              </div>
              <p className="text-xs text-custom-green-600 mt-1">
                {plan.period === 'monthly' ? 'por mes' : plan.period}
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Test Card Helper (solo desarrollo) */}
          {process.env.NODE_ENV === "development" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-800 font-medium text-sm">Modo Desarrollo</p>
                  <p className="text-blue-600 text-xs">Usar datos de prueba EcartPay</p>
                </div>
                <button
                  type="button"
                  onClick={fillTestCard}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                >
                  Llenar Test
                </button>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="tu@email.com"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:border-transparent ${
                errors.email ? "border-red-300" : "border-gray-300"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Full Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={handleFullNameChange}
              placeholder="Juan Pérez"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:border-transparent ${
                errors.fullName ? "border-red-300" : "border-gray-300"
              }`}
            />
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Card Number Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Tarjeta *
            </label>
            <input
              type="text"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="4242 4242 4242 4242"
              maxLength={19}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:border-transparent ${
                errors.cardNumber ? "border-red-300" : "border-gray-300"
              }`}
            />
            {errors.cardNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
            )}
          </div>

          {/* Exp Date & CVV Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiración *
              </label>
              <input
                type="text"
                value={expDate}
                onChange={handleExpDateChange}
                placeholder="12/25"
                maxLength={5}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:border-transparent ${
                  errors.expDate ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.expDate && (
                <p className="text-red-500 text-xs mt-1">{errors.expDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV *
              </label>
              <input
                type="text"
                value={cvv}
                onChange={handleCvvChange}
                placeholder="123"
                maxLength={4}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-green-500 focus:border-transparent ${
                  errors.cvv ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.cvv && (
                <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>
              )}
            </div>
          </div>

          {/* Security Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <LockIcon className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-600">
                Tus datos están protegidos con encriptación SSL
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-custom-green-600 text-white rounded-lg hover:bg-custom-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : (
                `Pagar ${plan ? `$${plan.price} ${plan.currency}` : ""}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CardPaymentModal;