'use client'

import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, MicIcon, SendIcon } from 'lucide-react';
import Layout from '../../src/components/Layout';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const PepperPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulated AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: `Hola! Soy Pepper, tu asistente de IA para el restaurante. He recibido tu pregunta: "${userMessage.content}".

Por ahora estoy en modo de desarrollo, pero pronto podré ayudarte con:
• Análisis de ventas y métricas
• Información sobre clientes y órdenes
• Reportes de rendimiento
• Recomendaciones para tu negocio

¿En qué más te gustaría que te ayude?`,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  // Detectar cuando el sidebar se expande/contrae
  useEffect(() => {
    const sidebar = document.querySelector('.hidden.md\\:flex .group');
    if (sidebar) {
      const handleMouseEnter = () => setSidebarExpanded(true);
      const handleMouseLeave = () => setSidebarExpanded(false);

      sidebar.addEventListener('mouseenter', handleMouseEnter);
      sidebar.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        sidebar.removeEventListener('mouseenter', handleMouseEnter);
        sidebar.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  return (
    <Layout>
      <div className="relative min-h-screen overflow-hidden">
        {/* Main Content Area */}
        <div className="h-[calc(100vh-140px)] overflow-hidden">
          {messages.length === 0 ? (
            // Empty State - Layout separado
            <div className="h-full flex flex-col">
              {/* Header fijo arriba - AJUSTABLE: Cambia estos valores para mover el header */}
              <div
                className="flex-none text-center transition-all duration-300 ease-in-out"
                style={{
                  paddingTop: '60px',    // CAMBIA ESTE VALOR: Distancia desde arriba
                  paddingBottom: '32px', // CAMBIA ESTE VALOR: Espacio debajo del header
                  transform: sidebarExpanded ? 'translateX(30px)' : 'translateX(0)' // CAMBIA ESTE VALOR: posición horizontal con sidebar (80px = más a la izquierda)
                }}
              >
                {/* Gradient Circle Icon - AJUSTABLE */}
                <div
                  className="mx-auto rounded-full bg-gradient-to-br from-purple-400 via-purple-500 to-emerald-400 shadow-lg flex items-center justify-center overflow-hidden"
                  style={{
                    width: '96px',      // CAMBIA ESTOS VALORES: Tamaño del círculo
                    height: '96px',     // CAMBIA ESTOS VALORES: Tamaño del círculo
                    marginBottom: '24px' // CAMBIA ESTE VALOR: Espacio debajo del icono
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

                {/* Welcome Text - AJUSTABLE */}
                <h1
                  className="font-semibold text-gray-900"
                  style={{
                    fontSize: '30px',    // CAMBIA ESTE VALOR: Tamaño del título
                    marginBottom: '12px' // CAMBIA ESTE VALOR: Espacio debajo del título
                  }}
                >
                  Pepper
                </h1>
                <p
                  className="text-gray-600"
                  style={{
                    fontSize: '22px',     // CAMBIA ESTE VALOR: Tamaño del subtítulo
                    marginTop: '100px'     // CAMBIA ESTE VALOR: Distancia del título - MÁS ALTO = MÁS ABAJO
                  }}
                >
                  En qué te puedo ayudar hoy?
                </p>
              </div>

              {/* Espacio flexible para empujar la barra hacia el centro */}
              <div className="flex-1"></div>
            </div>
          ) : (
            // Messages Area - AJUSTABLE: Cambia estos valores para mover el área de mensajes
            <div
              className="h-full overflow-y-auto px-4"
              style={{
                paddingTop: '100px',    // CAMBIA ESTE VALOR: Distancia desde arriba del área de mensajes
                paddingBottom: '80px'  // CAMBIA ESTE VALOR: Espacio abajo para la barra de entrada
              }}
            >
              <div
                className="max-w-4xl mx-auto"
                style={{
                  gap: '50px',  // CAMBIA ESTE VALOR: Espaciado entre mensajes (más alto = más separación)
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 relative ${
                      message.role === 'user'
                        ? 'bg-[#173E44] text-white max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl'
                        : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    }`}
                    style={{
                      maxWidth: message.role === 'assistant' ? '600px' : undefined  // CAMBIA ESTE VALOR: Ancho de respuestas de Pepper (más alto = más ancho)
                    }}
                  >
                    {/* Pepper Icon Video - Solo para respuestas de Pepper */}
                    {message.role === 'assistant' && (
                      <div
                        className="absolute rounded-full bg-gradient-to-br from-purple-400 via-purple-500 to-emerald-400 shadow-lg flex items-center justify-center overflow-hidden"
                        style={{
                          width: '32px',      // CAMBIA ESTE VALOR: Tamaño del icono pequeño
                          height: '32px',     // CAMBIA ESTE VALOR: Tamaño del icono pequeño
                          bottom: '-4px',     // CAMBIA ESTE VALOR: Posición vertical
                          left: '-39px'        // CAMBIA ESTE VALOR: Posición horizontal
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

                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-900 shadow-sm border border-gray-200 rounded-2xl px-4 py-3 max-w-xs">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-500">Pepper está escribiendo...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

        {/* Chat Input Bar - AJUSTABLE: Cambia estos valores para mover la barra */}
        <div
          className="fixed z-10 w-full px-4 transition-all duration-300 ease-in-out"
          style={{
            bottom: messages.length === 0 ? '350px' : '40px',                    // CAMBIA ESTOS VALORES: posición vertical
            left: sidebarExpanded ? 'calc(54% + 100px)' : '54%',                 // CAMBIA ESTOS VALORES: posición horizontal normal vs con sidebar
            transform: 'translateX(-50%)'                                         // Mantiene centrado automáticamente
          }}
        >
          <div
            className="mx-auto transition-all duration-300 ease-in-out"
            style={{
              width: '100%',
              maxWidth: sidebarExpanded ? '600px' : '1024px'  // CAMBIA ESTOS VALORES: ancho cuando sidebar expandido vs normal
            }}
          >
            <div className="bg-white rounded-full shadow-md px-6 py-3 flex items-center space-x-3">
              {/* Plus Button */}
              <button className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors flex-shrink-0">
                <PlusIcon className="w-4 h-4 text-gray-600" />
              </button>

              {/* Input Field */}
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregunta lo que necesites..."
                className="flex-1 bg-transparent border-none resize-none outline-none focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500 min-h-[32px] max-h-[120px] py-1 px-2 text-sm"
                rows={1}
                disabled={isLoading}
              />

              {/* Mic Button */}
              <button className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors flex-shrink-0">
                <MicIcon className="w-4 h-4 text-gray-600" />
              </button>

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                  inputValue.trim() && !isLoading
                    ? 'bg-[#173E44] text-white hover:bg-[#0f2c31]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <SendIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PepperPage;