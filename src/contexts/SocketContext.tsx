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
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

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

    const initSocket = async () => {
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

        const newSocket = io(SOCKET_URL, {
          auth: { token },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
        });

        newSocket.on("connect", () => {
          console.log("Socket connected:", newSocket.id);
          setIsConnected(true);
        });

        newSocket.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason);
          setIsConnected(false);
        });

        newSocket.on("connection:authenticated", (data) => {
          console.log("Socket authenticated:", data);
        });

        newSocket.on("connection:error", (error) => {
          console.error("Socket connection error:", error);
        });

        newSocket.on("connect_error", (error) => {
          console.error("Socket connect error:", error.message);
          setIsConnected(false);
        });

        newSocket.on("room:joined", (data) => {
          console.log("Joined room:", data);
        });

        newSocket.on("room:left", (data) => {
          console.log("Left room:", data);
        });

        socketRef.current = newSocket;
        setSocket(newSocket);
      } catch (error) {
        console.error("Error initializing socket:", error);
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isSignedIn, getToken]);

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

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
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
