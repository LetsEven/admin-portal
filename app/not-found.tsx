"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NotFound() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        // Si está autenticado, redirigir al dashboard
        router.push("/");
      } else {
        // Si no está autenticado, redirigir al sign-in
        router.push("/sign-in");
      }
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="min-h-screen bg-[#023828] flex items-center justify-center">
      <div className="text-center">
        <div className="h-6 w-6 border-b-2 border-[#82E657] animate-spin mx-auto" />
        <p className="mt-4 text-xs uppercase tracking-widest text-[#82E657]/60">
          Redirigiendo...
        </p>
      </div>
    </div>
  );
}
