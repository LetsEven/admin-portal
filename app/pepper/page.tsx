"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import { PlusIcon, MicIcon, SendIcon, X, History, Trash2 } from "lucide-react";
import Joyride from "react-joyride";
import ReactMarkdown from "react-markdown";
import Layout from "../../src/components/Layout";
import { useRestaurant } from "../../src/contexts/RestaurantContext";
import { useUser } from "@clerk/nextjs";
import {
  usePepperOnboarding,
  pepperJoyrideTheme,
  joyrideResponsiveCSS,
} from "../../src/hooks/usePepperOnboarding";
import { ArtifactBlock } from "./artifacts/ArtifactBlock";
import type { Artifact } from "./artifacts/types";

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
    | "tool_end"
    | "artifact";
  content?: string;
  session_id?: string;
  tool_name?: string;
  node_name?: string;
  node_type?: string;
  phase?: string;
  artifact?: Artifact;
}

const toolDisplayNames: Record<string, string> = {
  thinking: "Pensando...",
  get_current_datetime: "Pensando...",
  get_restaurant_info: "Obteniendo información del restaurante...",
  get_branches: "Consultando sucursales...",
  get_menu: "Consultando el menú...",
  get_dashboard_metrics: "Obteniendo estadísticas...",
  get_recent_transactions: "Consultando transacciones...",
  get_selling_items: "Analizando ventas...",
  get_revenue_breakdown: "Analizando ingresos y comisiones...",
  get_customer_demographics: "Analizando tu clientela...",
  render_chart: "Generando gráfica...",
  render_metric: "Generando indicadores...",
  // Legacy AI Spine tools
  admin_obtener_fecha_actual: "Pensando...",
  admin_get_charts: "Obteniendo gráficas...",
  dashboard_metrics_all_services: "Obteniendo estadísticas...",
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
  onArtifact?: (artifact: Artifact) => void,
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
            onSessionId(event.session_id);
          } else if (event.type === "artifact" && event.artifact) {
            onArtifact?.(event.artifact);
          } else if (event.type === "thinking_start") {
            onToolStart("thinking");
          } else if (event.type === "thinking_end") {
            onToolEnd();
          } else if (event.type === "tool_start" && event.tool_name) {
            onToolStart(event.tool_name);
          } else if (event.type === "tool_end") {
            onToolEnd();
          } else if (event.type === "final_response" && event.content) {
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
  artifacts?: Artifact[];
}

interface StoredMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
  artifacts?: Artifact[];
}

interface StoredConversation {
  id: string;
  title: string;
  messages: StoredMessage[];
  sessionId: string | null;
  createdAt: string;
  updatedAt: string;
}

function groupConversationsByDate(convs: StoredConversation[]) {
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: Record<string, StoredConversation[]> = {
    Hoy: [],
    Ayer: [],
    "Últimos 7 días": [],
    "Más antiguo": [],
  };

  for (const conv of convs) {
    const d = new Date(conv.updatedAt);
    if (d.toDateString() === todayStr) groups["Hoy"].push(conv);
    else if (d.toDateString() === yesterdayStr) groups["Ayer"].push(conv);
    else if (d > weekAgo) groups["Últimos 7 días"].push(conv);
    else groups["Más antiguo"].push(conv);
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

// Detecta frases de pensamiento/proceso y las convierte a cursiva con salto de línea
function preprocessThinkingText(content: string): string {
  if (!content.includes("...")) return content;

  return (
    content
      // Inline: "frase..." seguida de una nueva oración con mayúscula
      .replace(
        /(?<![*_`\\])([A-Za-záéíóúüñÁÉÍÓÚÜÑ¿][^_*`\n]{4,}?\.\.\.)(?![*_`.]) +(?=[A-ZÁÉÍÓÚÜÑ¿¡])/g,
        (_, sentence) => `_${sentence.trim()}_\n\n`,
      )
      // Línea completa que termina con "..."
      .replace(/^(?![#\-*>|`\d])(.{5,}?\.\.\.)[ \t]*$/gm, (_, sentence) =>
        `_${sentence.trim()}_`,
      )
  );
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

// Función para detectar si hay una URL de imagen incompleta al final del contenido
const hasIncompleteImageUrl = (text: string): boolean => {
  // Detectar markdown de imagen incompleto: ![...] o ![...]( o ![...](url incompleta
  if (/!\[[^\]]*\]?\(?[^)]*$/.test(text)) {
    return true;
  }
  // Detectar URL de imagen incompleta al final (empieza con http pero no termina con extensión de imagen completa)
  if (/https?:\/\/[^\s)]*$/.test(text)) {
    const urlMatch = text.match(/https?:\/\/[^\s)]*$/);
    if (urlMatch) {
      const partialUrl = urlMatch[0];
      // Si parece que está escribiendo una URL de imagen pero no está completa
      if (
        !/\.(jpg|jpeg|png|gif|webp|svg|avif)(\?[^\s)]*)?$/i.test(partialUrl)
      ) {
        return true;
      }
    }
  }
  return false;
};

const markdownComponents = {
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-bold">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic text-gray-400 font-normal">{children}</em>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-2 last:mb-0">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li>{children}</li>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="bg-gray-100 rounded px-1 text-sm font-mono">{children}</code>
  ),
};

// Componente para renderizar mensajes con imágenes (memoizado para evitar re-renders innecesarios)
const MessageContent = memo(
  ({
    content,
    isStreaming,
    activeTool,
  }: {
    content: string;
    isStreaming?: boolean;
    activeTool?: string | null;
  }) => {
    // Si el contenido está vacío, mostrar herramienta o puntos de carga
    if (!content) {
      if (activeTool) {
        const displayName = toolDisplayNames[activeTool] || activeTool;
        return (
          <div className="flex items-center gap-3 py-0.5">
            {/* Radar pulse */}
            <div className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-400" />
            </div>
            <span className="text-sm text-gray-400 italic animate-pulse">
              {displayName}
            </span>
          </div>
        );
      }
      return <LoadingDots />;
    }

    // Si está en streaming, reemplazar URLs de imagen con LoadingDots inline
    if (isStreaming) {
      const IMAGE_PLACEHOLDER = "\u0000IMG\u0000";
      let processed = content
        .replace(
          /!\[[^\]]*\]\(https?:\/\/[^\s)]+\.(?:jpg|jpeg|png|gif|webp|svg|avif)(?:\?[^\s)]*)?\)/gi,
          IMAGE_PLACEHOLDER,
        )
        .replace(/!\[[^\]]*\]?\(?https?:\/\/[^\s)]*$/, IMAGE_PLACEHOLDER)
        .replace(
          /(?<![(\[])(https?:\/\/[^\s)]+\.(?:jpg|jpeg|png|gif|webp|svg|avif)(?:\?[^\s)]*)?)/gi,
          IMAGE_PLACEHOLDER,
        );
      if (hasIncompleteImageUrl(processed)) {
        processed = processed.replace(/https?:\/\/[^\s)]*$/, IMAGE_PLACEHOLDER);
      }

      const parts = processed.split(IMAGE_PLACEHOLDER);
      const elements: React.ReactNode[] = [];
      parts.forEach((part, i) => {
        if (part) {
          elements.push(
            <ReactMarkdown key={`t${i}`} components={markdownComponents}>
              {part}
            </ReactMarkdown>,
          );
        }
        if (i < parts.length - 1) {
          elements.push(<LoadingDots key={`d${i}`} />);
        }
      });

      // Si hay una herramienta activa mientras se hace streaming, mostrarla al final
      if (activeTool) {
        const displayName = toolDisplayNames[activeTool] || activeTool;
        elements.push(
          <div key="tool-indicator" className="flex items-center gap-3 mt-2 py-0.5">
            <div className="relative flex h-2.5 w-2.5 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-400" />
            </div>
            <span className="text-sm text-gray-400 italic animate-pulse">
              {displayName}
            </span>
          </div>,
        );
      }

      return <div>{elements}</div>;
    }

    // Aplicar preprocesamiento de texto de pensamiento
    const processedContent = preprocessThinkingText(content);

    // Regex para detectar imágenes en formato Markdown: ![alt](url)
    const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;

    // Regex para detectar URLs directas de imágenes
    const directImageRegex =
      /(?<![(\[])(https?:\/\/[^\s)]+\.(?:jpg|jpeg|png|gif|webp|svg|avif)(?:\?[^\s)]*)?)/gi;

    // Procesar el contenido
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let key = 0;

    // Primero, encontrar todas las imágenes Markdown
    const matches: Array<{
      index: number;
      length: number;
      type: "markdown" | "direct";
      url: string;
      alt?: string;
    }> = [];

    let match;
    while ((match = markdownImageRegex.exec(processedContent)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        type: "markdown",
        alt: match[1],
        url: match[2],
      });
    }

    // Luego, encontrar URLs directas (que no estén dentro de Markdown)
    while ((match = directImageRegex.exec(processedContent)) !== null) {
      // Verificar que no esté dentro de un match de Markdown
      const isInsideMarkdown = matches.some(
        (m) => match!.index >= m.index && match!.index < m.index + m.length,
      );
      if (!isInsideMarkdown) {
        matches.push({
          index: match.index,
          length: match[0].length,
          type: "direct",
          url: match[0],
        });
      }
    }

    // Ordenar por posición
    matches.sort((a, b) => a.index - b.index);

    // Construir los elementos
    for (const m of matches) {
      // Agregar texto antes de la imagen
      if (m.index > lastIndex) {
        const text = processedContent.slice(lastIndex, m.index);
        if (text.trim()) {
          elements.push(
            <ReactMarkdown key={key++} components={markdownComponents}>
              {text}
            </ReactMarkdown>,
          );
        }
      }

      // Agregar la imagen
      elements.push(
        <img
          key={key++}
          src={m.url}
          alt={m.alt || "Imagen del agente"}
          className="rounded-lg max-w-full h-auto"
          loading="lazy"
        />,
      );

      lastIndex = m.index + m.length;
    }

    // Agregar texto restante
    if (lastIndex < processedContent.length) {
      const text = processedContent.slice(lastIndex);
      if (text.trim()) {
        elements.push(
          <ReactMarkdown key={key++} components={markdownComponents}>
            {text}
          </ReactMarkdown>,
        );
      }
    }

    // Si no hay elementos (solo espacios), mostrar el contenido original
    if (elements.length === 0) {
      return (
        <ReactMarkdown components={markdownComponents}>
          {processedContent}
        </ReactMarkdown>
      );
    }

    return <div className="space-y-2">{elements}</div>;
  },
);

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
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevIsLoadingRef = useRef(false);
  const activeConvIdRef = useRef<string | null>(null);
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

  // Keep ref in sync with state for use inside async callbacks
  useEffect(() => {
    activeConvIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // Load conversations from localStorage
  useEffect(() => {
    if (!isHydrated) return;
    try {
      const stored = localStorage.getItem("pepper_conversations");
      if (stored) setConversations(JSON.parse(stored));
    } catch {
      // ignore corrupt data
    }
  }, [isHydrated]);

  // Auto-save conversation when a response finishes
  useEffect(() => {
    const wasLoading = prevIsLoadingRef.current;
    prevIsLoadingRef.current = isLoading;

    if (!isHydrated || isLoading || !wasLoading) return;
    const convId = activeConvIdRef.current;
    if (messages.length === 0 || !convId) return;

    const title =
      messages.find((m) => m.role === "user")?.content.slice(0, 60) ??
      "Nueva conversación";
    const serialized: StoredMessage[] = messages.map((m) => ({
      ...m,
      timestamp:
        m.timestamp instanceof Date
          ? m.timestamp.toISOString()
          : (m.timestamp as string),
    }));

    setConversations((prev) => {
      const existing = prev.find((c) => c.id === convId);
      let updated: StoredConversation[];
      if (existing) {
        updated = prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: serialized,
                sessionId,
                updatedAt: new Date().toISOString(),
              }
            : c,
        );
      } else {
        updated = [
          {
            id: convId,
            title,
            messages: serialized,
            sessionId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...prev,
        ];
      }
      localStorage.setItem("pepper_conversations", JSON.stringify(updated));
      return updated;
    });
  }, [isLoading, isHydrated, messages, sessionId]);

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

  const startNewConversation = () => {
    setMessages([]);
    setSessionId(null);
    setActiveConversationId(null);
    activeConvIdRef.current = null;
    setInputValue("");
  };

  const loadConversation = (conv: StoredConversation) => {
    setMessages(
      conv.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
    );
    setSessionId(conv.sessionId);
    setActiveConversationId(conv.id);
    activeConvIdRef.current = conv.id;
  };

  const deleteConversation = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== convId);
      localStorage.setItem("pepper_conversations", JSON.stringify(updated));
      return updated;
    });
    if (activeConvIdRef.current === convId) startNewConversation();
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Ensure a conversation ID exists before the first message
    if (!activeConvIdRef.current) {
      const newId = `conv-${Date.now()}`;
      setActiveConversationId(newId);
      activeConvIdRef.current = newId;
    }

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
          if (!sessionId) setSessionId(newSessionId);
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
        // onArtifact - añadir artefacto visual al mensaje
        (artifact: Artifact) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    artifacts: [...(msg.artifacts ?? []), artifact],
                  }
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

      {/* Estilos responsive para onboarding */}
      <style dangerouslySetInnerHTML={{ __html: joyrideResponsiveCSS }} />

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

          {/* History Toggle Button */}
          <button
            onClick={() => setShowHistory((v) => !v)}
            title="Historial de conversaciones"
            className="fixed top-4 right-4 z-30 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border border-gray-200 transition-colors"
          >
            <History className="w-5 h-5 text-gray-600" />
          </button>

          {/* History Panel */}
          <div
            className={`fixed top-0 right-0 h-full bg-white border-l border-gray-200 shadow-xl flex flex-col z-20 transition-all duration-300 ease-in-out ${
              showHistory ? "w-64 opacity-100" : "w-0 opacity-0 pointer-events-none overflow-hidden"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-sm font-semibold text-gray-900">Historial</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Nueva conversación */}
            <div className="px-3 py-3 flex-shrink-0">
              <button
                onClick={() => { startNewConversation(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#173E44] hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors font-medium"
              >
                <PlusIcon className="w-4 h-4" />
                Nueva conversación
              </button>
            </div>

            {/* Lista de conversaciones */}
            <div className="flex-1 overflow-y-auto px-2 pb-4">
              {conversations.length === 0 ? (
                <p className="text-xs text-gray-400 text-center px-4 py-8">
                  No hay conversaciones guardadas
                </p>
              ) : (
                groupConversationsByDate(conversations).map((group) => (
                  <div key={group.label} className="mb-4">
                    <p className="text-xs font-medium text-gray-400 px-2 py-1 uppercase tracking-wide">
                      {group.label}
                    </p>
                    {group.items.map((conv) => (
                      <div
                        key={conv.id}
                        className={`group/item relative flex items-center rounded-lg mb-0.5 cursor-pointer transition-colors ${
                          conv.id === activeConversationId
                            ? "bg-[#173E44] text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => loadConversation(conv)}
                      >
                        <p
                          className={`flex-1 truncate text-xs px-3 py-2 pr-8 leading-5 ${
                            conv.id === activeConversationId ? "text-white" : "text-gray-700"
                          }`}
                        >
                          {conv.title}
                        </p>
                        <button
                          onClick={(e) => deleteConversation(conv.id, e)}
                          className={`absolute right-2 p-1 rounded opacity-0 group-hover/item:opacity-100 transition-opacity ${
                            conv.id === activeConversationId
                              ? "hover:bg-white/20 text-white/70"
                              : "hover:bg-gray-200 text-gray-400"
                          }`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div
            className="h-[calc(100vh-140px)] overflow-hidden transition-all duration-300 ease-in-out"
            style={{ paddingRight: showHistory && !isTablet ? "264px" : "0px" }}
          >
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
                            className="absolute rounded-full bg-gradient-to-br from-purple-400 via-purple-500 to-emerald-400 shadow-lg flex items-center justify-center overflow-hidden w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
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

                        <div className="text-sm sm:text-base leading-relaxed">
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
                        {/* Artifacts: charts and metric cards */}
                        {message.artifacts && message.artifacts.length > 0 && (
                          <div className="mt-3 flex flex-col gap-3">
                            {message.artifacts.map((artifact) => (
                              <ArtifactBlock
                                key={artifact.id}
                                artifact={artifact}
                              />
                            ))}
                          </div>
                        )}
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
              right: showHistory && !isTablet ? "280px" : "16px",
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
