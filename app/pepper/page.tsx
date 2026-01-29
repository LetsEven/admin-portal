"use client";

import React, { useState, useRef, useEffect } from "react";
import { PlusIcon, MicIcon, SendIcon } from "lucide-react";
import Joyride from "react-joyride";
import Layout from "../../src/components/Layout";
import { useRestaurant } from "../../src/contexts/RestaurantContext";
import { useUser } from "@clerk/nextjs";
import {
  usePepperOnboarding,
  pepperJoyrideTheme,
} from "../../src/hooks/usePepperOnboarding";

// Tipo para los eventos del stream (basado en la API real de AI Spine)
interface StreamEvent {
  type:
    | "token"
    | "done"
    | "error"
    | "conversation_start"
    | "thinking_start"
    | "thinking_end"
    | "node_start"
    | "node_end"
    | "final_response"
    | "tool_start"
    | "tool_end";
  content?: string;
  session_id?: string;
  tool_name?: string;
  node_name?: string;
  node_type?: string;
  phase?: string;
}

// Mapeo de nombres de herramientas a nombres amigables
const toolDisplayNames: Record<string, string> = {
  thinking: "Pensando...",
  extracts_image_urls: "Obteniendo imagen",
  retrieves_restaurant_information: "Obteniendo información del restaurante",
  extract_restaurant_dish: "Obteniendo estadísticas del platillo",
  herramienta_para_limpiar: "Limpiando datos",
  extrae_datos_completos: "Obteniendo datos completos",
  query_supabase_restaurant: "Consultando base de datos",
  actualiza_la_cantidad: "Actualizando datos",
  remove_item_from: "Eliminando elemento",
  add_items_to: "Agregando elemento",
  herramienta_de_supabase: "Consultando Supabase",
};

// Función para streaming con el agente
async function streamFromAgent(
  message: string,
  sessionId: string | null = null,
  onToken: (token: string) => void,
  onSessionId: (sessionId: string) => void,
  onToolStart: (toolName: string) => void,
  onToolEnd: () => void,
  onFinalResponse?: (content: string) => void,
): Promise<void> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}/api/ai-agent/chat/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        session_id: sessionId,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Error del servidor: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No se pudo obtener el reader del stream");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const event: StreamEvent = JSON.parse(line.slice(6));

          // Debug: mostrar todos los eventos recibidos
          if (event.type !== "token") {
            console.log("🔄 Evento recibido:", event);
          }

          if (event.type === "token" && event.content) {
            onToken(event.content);
          } else if (event.type === "conversation_start" && event.session_id) {
            // Session ID viene en conversation_start
            onSessionId(event.session_id);
          } else if (event.type === "thinking_start") {
            // Mostrar indicador de "pensando"
            onToolStart("thinking");
          } else if (event.type === "thinking_end") {
            onToolEnd();
          } else if (event.type === "tool_start" && event.tool_name) {
            onToolStart(event.tool_name);
          } else if (event.type === "tool_end") {
            onToolEnd();
          } else if (event.type === "final_response" && event.content) {
            // La respuesta final viene completa - reemplazar, no agregar
            if (onFinalResponse) {
              onFinalResponse(event.content);
            } else {
              onToken(event.content);
            }
          } else if (event.type === "error") {
            throw new Error(event.content || "Error del agente");
          }
        } catch (e) {
          console.warn("Error parseando evento:", line);
        }
      }
    }
  }
}

// Custom hook for responsive screen size
const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    isMobile: typeof window !== "undefined" ? window.innerWidth < 640 : false,
    isTablet: typeof window !== "undefined" ? window.innerWidth < 768 : false,
    isDesktop: typeof window !== "undefined" ? window.innerWidth >= 768 : true,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenSize({
        width,
        isMobile: width < 640,
        isTablet: width < 768,
        isDesktop: width >= 768,
      });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      handleResize(); // Set initial size
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  return screenSize;
};

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

// Componente de puntos de carga
const LoadingDots = () => (
  <div className="flex space-x-1">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
    <div
      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
      style={{ animationDelay: "0.1s" }}
    ></div>
    <div
      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
      style={{ animationDelay: "0.2s" }}
    ></div>
  </div>
);

// Función para detectar URLs de imagen incompletas durante streaming
function hasIncompleteImageUrl(content: string): boolean {
  // Si el contenido termina con algo que parece una URL incompleta
  const lastPart = content.split(/\s/).pop() || "";

  // Verificar si parece una URL en construcción (tiene http pero no termina en espacio o formato conocido)
  if (
    lastPart.startsWith("http") &&
    !lastPart.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)(\?[^\s]*)?\s*$/i)
  ) {
    return true;
  }

  return false;
}

// Componente para renderizar mensajes con imágenes
function MessageContent({
  content,
  isStreaming = false,
  activeTool = null,
}: {
  content: string;
  isStreaming?: boolean;
  activeTool?: string | null;
}) {
  // Si no hay contenido, mostrar indicador apropiado
  if (!content) {
    if (activeTool) {
      return (
        <div className="flex items-center gap-2">
          <Spinner />
          <span className="text-gray-500">
            {toolDisplayNames[activeTool] || activeTool}
          </span>
        </div>
      );
    }
    return <LoadingDots />;
  }

  // Regex para detectar URLs de imágenes (incluyendo avif)
  const imageUrlRegex =
    /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|svg|avif)(?:\?[^\s]*)?)/gi;

  // Durante streaming, si hay una URL de imagen incompleta, mostrar solo texto
  if (isStreaming && hasIncompleteImageUrl(content)) {
    return (
      <div className="space-y-2">
        <p>{content}</p>
      </div>
    );
  }

  // Dividir el contenido en partes (texto e imágenes)
  const parts = content.split(imageUrlRegex);

  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        // Si la parte coincide con una URL de imagen
        if (part.match(imageUrlRegex)) {
          return (
            <img
              key={index}
              src={part}
              alt="Imagen del agente"
              className="rounded-lg max-w-full h-auto"
              onError={(e) => {
                // Si la imagen falla, mostrar el URL como texto
                e.currentTarget.style.display = "none";
                const textNode = document.createTextNode(part);
                e.currentTarget.parentNode?.appendChild(textNode);
              }}
            />
          );
        }
        // Si es texto normal
        return part ? <p key={index}>{part}</p> : null;
      })}
    </div>
  );
}

// Spinner component para indicador de herramienta
const Spinner = () => (
  <svg
    className="h-4 w-4 text-[#ebb2f4]"
    style={{ animation: "spin 1s linear infinite" }}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const PepperPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isMobile, isTablet, isDesktop, width } = useResponsive();

  // Obtener contextos
  const { restaurant } = useRestaurant();
  const { user } = useUser();

  // Hook para onboarding
  const {
    run: runTour,
    steps: tourSteps,
    stepIndex: tourStepIndex,
    handleJoyrideCallback,
    startOnboarding,
  } = usePepperOnboarding();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTool]);

  // Iniciar onboarding cuando el componente esté listo
  useEffect(() => {
    if (isHydrated && user && restaurant) {
      // Esperar un poco para que los elementos del DOM estén disponibles
      setTimeout(() => {
        startOnboarding();
      }, 1000);
    }
  }, [isHydrated, user, restaurant, startOnboarding]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageContent = inputValue.trim();
    setInputValue("");
    setIsLoading(true);
    setIsStreaming(true);

    // Crear mensaje vacío del asistente para ir llenándolo
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: "",
      role: "assistant",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Determinar userId (en admin-portal solo hay usuarios autenticados)
      const userId = user?.id || null;
      const restaurantId = restaurant?.id || null;

      // Construir el mensaje con el contexto separado
      const contextualMessage = `[CONTEXT: service=admin_portal, restaurant_id=${restaurantId || "null"}, user_id=${userId || "null"}]
[USER_MESSAGE: ${messageContent}]`;

      console.log("📤 Enviando mensaje a Pepper (Admin Portal):", {
        originalMessage: messageContent,
        contextualMessage,
        restaurantId,
        userId,
      });

      // Llamar al agente con streaming
      await streamFromAgent(
        contextualMessage,
        sessionId,
        // onToken - actualizar el mensaje con el nuevo token
        (token: string) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + token }
                : msg,
            ),
          );
        },
        // onSessionId - guardar el session_id
        (newSessionId: string) => {
          console.log("📥 Session ID recibido:", newSessionId);
          if (!sessionId) {
            setSessionId(newSessionId);
            console.log("✅ Session ID guardado:", newSessionId);
          }
        },
        // onToolStart - mostrar qué herramienta se está ejecutando
        (toolName: string) => {
          setActiveTool(toolName);
        },
        // onToolEnd - ocultar indicador de herramienta
        () => {
          setActiveTool(null);
        },
        // onFinalResponse - reemplazar contenido completo (no agregar)
        (content: string) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: content }
                : msg,
            ),
          );
        },
      );
    } catch (error) {
      console.error("Error al comunicarse con Pepper:", error);

      // Actualizar el mensaje del asistente con el error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  "Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.",
              }
            : msg,
        ),
      );
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setActiveTool(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  // Detectar cuando el sidebar se expande/contrae
  useEffect(() => {
    const sidebar = document.querySelector(".hidden.md\\:flex .group");
    if (sidebar) {
      const handleMouseEnter = () => setSidebarExpanded(true);
      const handleMouseLeave = () => setSidebarExpanded(false);

      sidebar.addEventListener("mouseenter", handleMouseEnter);
      sidebar.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        sidebar.removeEventListener("mouseenter", handleMouseEnter);
        sidebar.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, []);

  return (
    <>
      {/* Componente Joyride para onboarding de Pepper - Solo después de hidratación */}
      {isHydrated && (
        <Joyride
          steps={tourSteps}
          run={runTour}
          stepIndex={tourStepIndex}
          callback={handleJoyrideCallback}
          continuous={true}
          showProgress={true}
          showSkipButton={true}
          showBackButton={true}
          spotlightClicks={false}
          disableOverlayClose={true}
          disableScrollParentFix={false}
          scrollToFirstStep={true}
          scrollDuration={300}
          styles={pepperJoyrideTheme}
          options={{
            arrowColor: "#2A5A62",
            backgroundColor: "#ffffff",
            overlayColor: "rgba(0, 0, 0, 0.5)",
            primaryColor: "#2A5A62",
            textColor: "#173E44",
            width: 400,
            zIndex: 10000,
          }}
          locale={{
            back: "Atrás",
            close: "Cerrar",
            last: "Finalizar",
            next: "Siguiente",
            nextLabelWithProgress: `Siguiente {step} of {steps}`,
            skip: "Saltar",
          }}
        />
      )}

      <style jsx global>{`
        main > div {
          padding-top: 0 !important;
          padding-bottom: 0 !important;
        }

        /* Corrección del posicionamiento para el step 3 del tour de Pepper */
        .__floater[data-placement="top"] .react-joyride__spotlight {
          position: fixed !important;
          border-radius: 25px !important;
          min-height: 60px !important;
          min-width: 200px !important;
        }

        /* Asegurar que el spotlight encuentre correctamente el textarea */
        [data-tour="chat-input"] {
          position: relative;
          z-index: 1;
        }

        /* Ajuste específico del tooltip para el chat-input */
        .react-joyride__tooltip[data-step="2"] {
          margin-bottom: 20px !important;
        }

        /* Forzar posicionamiento correcto cuando es el último paso */
        .react-joyride__spotlight {
          transition: all 0.3s ease-in-out !important;
        }

        /* Contenedor del chat input debe ser detectable */
        .react-joyride__spotlight[style*="top: -10px"] {
          top: auto !important;
          bottom: 120px !important;
        }

        /* Animación para el spinner */
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <Layout>
        <div className="relative min-h-screen overflow-hidden">
          {/* Main Content Area */}
          <div className="h-[calc(100vh-140px)] overflow-hidden">
            {messages.length === 0 ? (
              // Empty State - Responsive
              <div className="h-full flex flex-col">
                {/* Header responsive */}
                <div
                  className="flex-none transition-all duration-300 ease-in-out px-3 sm:px-4 md:px-6"
                  style={{
                    paddingTop: isTablet ? "40px" : "200px",
                    paddingBottom: isTablet ? "16px" : "32px",
                    transform: sidebarExpanded
                      ? "translateX(30px)"
                      : "translateX(0)",
                  }}
                >
                  <div className="max-w-4xl mx-auto text-center">
                    {/* Gradient Circle Icon - Responsive */}
                    <div
                      className={`mx-auto rounded-full bg-gradient-to-br from-purple-400 via-purple-500 to-emerald-400 shadow-lg flex items-center justify-center overflow-hidden
                      w-16 h-16 mb-4 sm:w-20 sm:h-20 sm:mb-5 md:w-24 md:h-24 md:mb-6`}
                    >
                      <video
                        src="/video-icon-pepper.webm"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>

                    {/* Welcome Text - Responsive */}
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 mb-2 sm:mb-3">
                      Pepper
                    </h1>
                    <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mt-8 sm:mt-12 md:mt-16 lg:mt-20">
                      ¿En qué te puedo ayudar hoy?
                    </p>
                  </div>
                </div>

                {/* Espacio flexible */}
                <div className="flex-1"></div>
              </div>
            ) : (
              // Messages Area - Responsive
              <div
                className="h-full overflow-y-auto px-3 sm:px-4 md:px-9"
                style={{
                  paddingTop: isTablet ? "60px" : "80px",
                  paddingBottom: isTablet ? "60px" : "80px",
                }}
              >
                <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 md:space-y-10">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 relative ${
                          message.role === "user"
                            ? "bg-[#173E44] text-white max-w-[85%] sm:max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl"
                            : "bg-white text-gray-900 shadow-sm border border-gray-200 max-w-[90%] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl"
                        }`}
                      >
                        {/* Pepper Icon Video - Solo para respuestas de Pepper - Responsive */}
                        {message.role === "assistant" && (
                          <div
                            className="absolute rounded-full bg-gradient-to-br from-purple-400 via-purple-500 to-emerald-400 shadow-lg flex items-center justify-center overflow-hidden
                              w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
                            style={{
                              bottom: "-2px",
                              left: isMobile ? "-28px" : "-35px",
                            }}
                          >
                            <video
                              src="/video-icon-pepper.webm"
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-full h-full object-cover rounded-full"
                            />
                          </div>
                        )}

                        <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                          <MessageContent
                            content={message.content}
                            isStreaming={
                              isStreaming &&
                              message.role === "assistant" &&
                              message === messages[messages.length - 1]
                            }
                            activeTool={
                              isStreaming &&
                              message.role === "assistant" &&
                              message === messages[messages.length - 1]
                                ? activeTool
                                : null
                            }
                          />
                        </div>
                        <p
                          className={`text-xs mt-1 sm:mt-2 ${
                            message.role === "user"
                              ? "text-green-100"
                              : "text-gray-500"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Bar - Responsive Fixed */}
          <div
            className="fixed z-10 transition-all duration-300 ease-in-out"
            style={{
              bottom:
                messages.length === 0
                  ? isMobile
                    ? "60px"
                    : isTablet
                      ? "250px"
                      : "50px"
                  : isMobile
                    ? "20px"
                    : "40px",
              left:
                sidebarExpanded && !isTablet
                  ? "280px"
                  : isTablet
                    ? "16px"
                    : "80px",
              right: "16px",
            }}
          >
            <div
              className="mx-auto transition-all duration-300 ease-in-out"
              style={{
                maxWidth: isMobile ? "400px" : isTablet ? "500px" : "700px",
              }}
            >
              <div
                className="bg-white rounded-full shadow-md px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-3 flex items-center space-x-2 sm:space-x-3"
                data-tour="chat-input"
              >
                {/* Plus Button - Hidden on small screens */}
                <button className="hidden sm:flex w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gray-100 hover:bg-gray-200 rounded-full items-center justify-center transition-colors flex-shrink-0">
                  <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                </button>

                {/* Input Field - Responsive */}
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Pregunta lo que necesites..."
                  className="flex-1 bg-transparent border-none resize-none outline-none focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500 min-h-[24px] sm:min-h-[28px] md:min-h-[32px] max-h-[80px] sm:max-h-[100px] md:max-h-[120px] py-1 px-1 sm:px-2 text-sm sm:text-base"
                  rows={1}
                  disabled={isLoading}
                />

                {/* Mic Button - Hidden on mobile, optional on larger screens */}
                <button className="hidden md:flex w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gray-100 hover:bg-gray-200 rounded-full items-center justify-center transition-colors flex-shrink-0">
                  <MicIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                </button>

                {/* Send Button - Always visible */}
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                    inputValue.trim() && !isLoading
                      ? "bg-[#173E44] text-white hover:bg-[#0f2c31]"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <SendIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default PepperPage;
