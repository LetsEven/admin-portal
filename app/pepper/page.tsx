'use client'

import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, MicIcon, SendIcon } from 'lucide-react';
import Layout from '../../src/components/Layout';

// Custom hook for responsive screen size
const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 640 : false,
    isTablet: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 768 : true,
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

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      handleResize(); // Set initial size
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return screenSize;
};

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
  const { isMobile, isTablet, isDesktop, width } = useResponsive();

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
            // Empty State - Responsive
            <div className="h-full flex flex-col">
              {/* Header responsive */}
              <div
                className="flex-none text-center transition-all duration-300 ease-in-out px-4"
                style={{
                  paddingTop: isTablet ? '40px' : '60px',
                  paddingBottom: isTablet ? '16px' : '32px',
                  transform: sidebarExpanded ? 'translateX(30px)' : 'translateX(0)'
                }}
              >
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

              {/* Espacio flexible */}
              <div className="flex-1"></div>
            </div>
          ) : (
            // Messages Area - Responsive
            <div
              className="h-full overflow-y-auto px-3 sm:px-4 md:px-6"
              style={{
                paddingTop: isTablet ? '60px' : '80px',
                paddingBottom: isTablet ? '60px' : '80px'
              }}
            >
              <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 md:space-y-10">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 relative ${
                        message.role === 'user'
                          ? 'bg-[#173E44] text-white max-w-[85%] sm:max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl'
                          : 'bg-white text-gray-900 shadow-sm border border-gray-200 max-w-[90%] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl'
                      }`}
                    >
                      {/* Pepper Icon Video - Solo para respuestas de Pepper - Responsive */}
                      {message.role === 'assistant' && (
                        <div
                          className="absolute rounded-full bg-gradient-to-br from-purple-400 via-purple-500 to-emerald-400 shadow-lg flex items-center justify-center overflow-hidden
                            w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
                          style={{
                            bottom: '-2px',
                            left: isMobile ? '-28px' : '-35px'
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

                      <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p className={`text-xs mt-1 sm:mt-2 ${
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
                    <div className="bg-white text-gray-900 shadow-sm border border-gray-200 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 max-w-[90%] sm:max-w-xs">
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

        {/* Chat Input Bar - Responsive Fixed */}
        <div
          className="fixed z-10 transition-all duration-300 ease-in-out"
          style={{
            bottom: messages.length === 0
              ? isMobile ? '60px' : isTablet ? '250px' : '50px'
              : isMobile ? '20px' : '40px',
            left: sidebarExpanded && !isTablet ? '280px' : isTablet ? '16px' : '80px',
            right: '16px'
          }}
        >
          <div
            className="mx-auto transition-all duration-300 ease-in-out"
            style={{
              maxWidth: isMobile ? '400px' : isTablet ? '500px' : '700px'
            }}
          >
            <div className="bg-white rounded-full shadow-md px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-3 flex items-center space-x-2 sm:space-x-3">
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
                    ? 'bg-[#173E44] text-white hover:bg-[#0f2c31]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <SendIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PepperPage;