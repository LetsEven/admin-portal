"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@clerk/nextjs";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRestaurant: (restaurantId: number) => void;
  leaveRestaurant: (restaurantId: number) => void;
  requestRefresh: (
    restaurantId: number,
    dataType: "all" | "metrics" | "transactions" | "orders",
  ) => void;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para inicializar/reconectar el socket
  const initSocket = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      const token = await getToken();

      if (!token) {
        console.error("No token available for socket connection");
        return;
      }

      // Si ya hay un socket conectado, no crear otro
      if (socketRef.current?.connected) {
        return;
      }

      // Desconectar socket existente si hay uno desconectado
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const newSocket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        timeout: 20000,
      });

      newSocket.on("connect", () => {
        console.log("🟢 Socket connected:", newSocket.id);
        setIsConnected(true);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("🔴 Socket disconnected:", reason);
        setIsConnected(false);

        // Si fue desconectado por el servidor, intentar reconectar
        if (reason === "io server disconnect") {
          newSocket.connect();
        }
      });

      newSocket.on("reconnect", (attemptNumber) => {
        console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
      });

      newSocket.on("reconnect_attempt", (attemptNumber) => {
        console.log("🔄 Reconnection attempt:", attemptNumber);
      });

      newSocket.on("reconnect_error", (error) => {
        console.error("Reconnection error:", error.message);
      });

      newSocket.on("connection:authenticated", (data) => {
        console.log("✅ Socket authenticated:", data);
      });

      newSocket.on("connection:error", async (error) => {
        console.error("Socket connection error:", error);
        // Si el error es de autenticación, obtener nuevo token y reconectar
        if (error.message?.includes("auth") || error.message?.includes("token")) {
          const newToken = await getToken({ skipCache: true });
          if (newToken && socketRef.current) {
            socketRef.current.auth = { token: newToken };
            socketRef.current.connect();
          }
        }
      });

      newSocket.on("connect_error", async (error) => {
        console.error("Socket connect error:", error.message);
        setIsConnected(false);

        // Si el error puede ser de token expirado, refrescar token
        if (error.message?.includes("auth") || error.message?.includes("unauthorized")) {
          const newToken = await getToken({ skipCache: true });
          if (newToken && socketRef.current) {
            socketRef.current.auth = { token: newToken };
          }
        }
      });

      newSocket.on("room:joined", (data) => {
        console.log("📍 Joined room:", data);
      });

      newSocket.on("room:left", (data) => {
        console.log("📍 Left room:", data);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    } catch (error) {
      console.error("Error initializing socket:", error);
    }
  }, [isSignedIn, getToken]);

  // Efecto principal para inicializar el socket
  useEffect(() => {
    if (!isSignedIn) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    initSocket();

    // Verificar conexión periódicamente y reconectar si es necesario
    reconnectIntervalRef.current = setInterval(() => {
      if (isSignedIn && socketRef.current && !socketRef.current.connected) {
        console.log("🔄 Periodic check: Socket disconnected, attempting reconnect...");
        initSocket();
      }
    }, 10000); // Verificar cada 10 segundos

    return () => {
      if (reconnectIntervalRef.current) {
        clearInterval(reconnectIntervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isSignedIn, initSocket]);

  const joinRestaurant = useCallback(
    (restaurantId: number) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("join:restaurant", { restaurantId });
      }
    },
    [isConnected],
  );

  const leaveRestaurant = useCallback(
    (restaurantId: number) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("leave:restaurant", { restaurantId });
      }
    },
    [isConnected],
  );

  const requestRefresh = useCallback(
    (
      restaurantId: number,
      dataType: "all" | "metrics" | "transactions" | "orders",
    ) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("request:refresh", { restaurantId, dataType });
      }
    },
    [isConnected],
  );

  // Función para forzar reconexión manual
  const reconnect = useCallback(() => {
    console.log("🔄 Manual reconnect triggered");
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    initSocket();
  }, [initSocket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        reconnect,
        joinRestaurant,
        leaveRestaurant,
        requestRefresh,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }
  return context;
}
