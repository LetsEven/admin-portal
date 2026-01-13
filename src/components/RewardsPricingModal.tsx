import React, { useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import { useSubscriptionsApi, SubscriptionPlan, Subscription } from "../services/subscriptionsApi";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import CardPaymentModal, { CardData } from "./CardPaymentModal";

// ===============================================
// TIPOS E INTERFACES
// ===============================================

interface RewardsPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
}

interface PlanForDisplay {
  id: string;
  name: string;
  price: string;
  features: string[];
  gradient: string;
  borderColor: string;
  isCurrentPlan: boolean;
  planData: SubscriptionPlan;
}

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================

const RewardsPricingModal: React.FC<RewardsPricingModalProps> = ({
  isOpen,
  onClose,
  currentPlan = "Básico",
}) => {
  const subscriptionsApi = useSubscriptionsApi();

  // Estados
  const [plans, setPlans] = useState<PlanForDisplay[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  // Estados del modal de tarjeta
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Cargar datos cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      loadSubscriptionData();
    }
  }, [isOpen]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar planes disponibles y suscripción actual en paralelo
      const [plansData, subscriptionData] = await Promise.all([
        subscriptionsApi.getPlans(),
        subscriptionsApi.getCurrentSubscription()
      ]);

      // Obtener el plan actual de la suscripción
      const currentPlanType = subscriptionData?.plan_type || 'basico';

      // Transformar datos del API para el componente
      const transformedPlans: PlanForDisplay[] = plansData.map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: plan.price === 0 ? "Gratis" : `$${plan.price} ${plan.currency}`,
        features: plan.features,
        gradient: plan.id === currentPlanType
          ? "from-green-400/20 to-green-600/20"
          : "from-gray-400/20 to-gray-600/20",
        borderColor: plan.id === currentPlanType
          ? "border-green-400/30"
          : "border-gray-300/30",
        isCurrentPlan: plan.id === currentPlanType,
        planData: plan,
      }));

      console.log(subscriptionData)
      console.log({currentSubscription});
      
      setPlans(transformedPlans);
      setCurrentSubscription(subscriptionData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar datos');
      toast.error('Error al cargar planes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: PlanForDisplay) => {
    if (plan.isCurrentPlan) {
      return;
    }

    // Si es plan gratuito, usar lógica inteligente (crear o cambiar)
    if (plan.planData.free || plan.planData.price === 0) {
      await createOrChangePlan(plan.planData.id);
      return;
    }

    // Para planes pagos, abrir modal de tarjeta
    setSelectedPlan(plan.planData);
    setShowCardModal(true);
  };

  // Función inteligente que decide si crear suscripción o cambiar plan
  const createOrChangePlan = async (planType: string) => {
    try {
      setProcessingPayment(planType);

      let result;
      if (currentSubscription && currentSubscription.id) {
        // Si ya existe una suscripción, usar changePlan
        result = await subscriptionsApi.changePlan({
          plan_type: planType,
          auto_renew: true,
        });
      } else {
        // Si no existe suscripción, crear nueva
        result = await subscriptionsApi.createSubscription({
          plan_type: planType,
          auto_renew: true,
        });
      }

      if (result.success) {
        toast.success(
          currentSubscription ? 'Plan cambiado exitosamente' : 'Suscripción activada exitosamente'
        );
        await loadSubscriptionData(); // Recargar datos
      } else {
        throw new Error(result.error || 'Error al procesar suscripción');
      }
    } catch (error) {
      console.error('Error processing subscription:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar suscripción');
    } finally {
      setProcessingPayment(null);
    }
  };

  const processPayment = async (plan: SubscriptionPlan, cardData: CardData) => {
    try {
      setProcessingPayment(plan.id);

      const paymentData = {
        plan_type: plan.id,
        auto_renew: true,
        // Agregar datos de la tarjeta para EcartPay
        payment_data: {
          fullName: cardData.fullName,
          email: cardData.email,
          cardNumber: cardData.cardNumber,
          expDate: cardData.expDate,
          cvv: cardData.cvv,
        },
      };

      let result;
      if (currentSubscription && currentSubscription.id) {
        // Si ya existe una suscripción, usar changePlan
        result = await subscriptionsApi.changePlan(paymentData);
      } else {
        // Si no existe suscripción, crear nueva
        result = await subscriptionsApi.createSubscription(paymentData);
      }

      if (result.success && result.payment_url) {
        // Redirigir a la página de pago de EcartPay
        toast.success('Redirigiendo a procesamiento de pago...');
        window.location.href = result.payment_url;
      } else if (result.success && !result.payment_url) {
        // Suscripción creada/cambiada sin necesidad de pago
        const successMessage = currentSubscription ?
          'Plan cambiado exitosamente' :
          'Suscripción activada exitosamente';
        toast.success(successMessage);
        setShowCardModal(false);
        await loadSubscriptionData();
      } else {
        throw new Error(result.error || 'Error al procesar pago');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error instanceof Error ? error.message : 'Error al procesar pago');
    } finally {
      setProcessingPayment(null);
    }
  };

  // Manejador del modal de tarjeta
  const handleCardSubmit = async (cardData: CardData) => {
    if (!selectedPlan) return;
    await processPayment(selectedPlan, cardData);
  };

  const handleCardModalClose = () => {
    setShowCardModal(false);
    setSelectedPlan(null);
  };

  const getPlanButtonText = (plan: PlanForDisplay) => {
    if (processingPayment === plan.id) {
      return plan.planData.free ? "Cambiando..." : "Procesando pago...";
    }
    if (plan.isCurrentPlan) {
      return "Tu Plan Actual";
    }

    // Determinar si es un cambio o nueva suscripción
    const hasSubscription = currentSubscription && currentSubscription.id;

    if (plan.planData.free) {
      return hasSubscription ? "Cambiar a este Plan" : "Activar Plan";
    }

    return hasSubscription ? "Cambiar Plan" : "Seleccionar Plan";
  };

  const isPlanButtonDisabled = (plan: PlanForDisplay) => {
    return plan.isCurrentPlan || processingPayment !== null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>
      <div className="relative max-w-4xl w-full mx-4 p-4">
        <button
          onClick={onClose}
          className="absolute -top-6 right-2 text-white hover:text-gray-300 z-10 p-2 rounded-full hover:bg-white/20 transition-all duration-200"
        >
          <XIcon className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Planes de Suscripción</h2>
          {currentSubscription && (
            <p className="text-white/80 text-sm">
              Plan actual: <span className="font-semibold">{currentSubscription.plan_type}</span>
              {currentSubscription.days_remaining !== null && (
                <span className="ml-2">
                  ({currentSubscription.days_remaining} días restantes)
                </span>
              )}
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-2 text-white">Cargando planes...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-4">
            <p className="text-white text-sm">Error: {error}</p>
            <button
              onClick={loadSubscriptionData}
              className="mt-2 text-red-300 hover:text-white text-sm underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Plans Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.id} className="group relative">
                {/* Glass morphism card */}
                <div
                  className={`relative bg-white/10 backdrop-blur-md rounded-xl p-4 border ${plan.borderColor} shadow-xl transition-all duration-300 transform hover:scale-105 hover:bg-white/15 ${plan.isCurrentPlan ? "ring-2 ring-white/50 bg-white/15" : ""} h-80`}
                >
                  {/* Background gradient overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} rounded-xl opacity-50`}
                  ></div>

                  {/* Current plan badge */}
                  {plan.isCurrentPlan && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-white text-custom-green-600 px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                        Plan Actual
                      </span>
                    </div>
                  )}

                  {/* Popular badge */}
                  {plan.planData.popular && !plan.isCurrentPlan && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r px-3 py-1 rounded-full text-xs font-medium shadow-lg text-black bg-[#EAB3F4]" >
                        Más Popular
                      </span>
                    </div>
                  )}

                  {/* Card content */}
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-white mb-1">
                        {plan.name}
                      </h3>
                      <div className="text-2xl font-extrabold text-white mb-1">
                        {plan.price}
                      </div>
                      {!plan.planData.free && (
                        <p className="text-white/70 text-xs">por mes</p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className={`space-y-2 mb-4 flex-grow ${plan.planData.free ? "mt-4" : ""}`}>
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <div className="flex-shrink-0 w-4 h-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mt-0.5 mr-2">
                            <svg
                              className="w-2 h-2 text-white"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <span className="text-white/90 text-xs leading-relaxed">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isPlanButtonDisabled(plan)}
                      className={`w-full py-2 px-4 rounded-lg text-xs font-semibold transition-all duration-300 mt-auto ${
                        plan.isCurrentPlan
                          ? "bg-white/20 text-white cursor-default backdrop-blur-sm border border-white/30"
                          : processingPayment === plan.id
                          ? "bg-orange-500/80 text-white cursor-wait backdrop-blur-sm"
                          : "bg-white text-gray-900 hover:bg-white/90 hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer"
                      }`}
                    >
                      {getPlanButtonText(plan)}
                    </button>
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute top-2 right-2 w-4 h-4 bg-white/10 rounded-full blur-sm"></div>
                  <div className="absolute bottom-2 left-2 w-3 h-3 bg-white/5 rounded-full blur-sm"></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de datos de tarjeta */}
      <CardPaymentModal
        isOpen={showCardModal}
        onClose={handleCardModalClose}
        onSubmit={handleCardSubmit}
        plan={selectedPlan}
        loading={processingPayment !== null}
      />
    </div>
  );
};

export default RewardsPricingModal;