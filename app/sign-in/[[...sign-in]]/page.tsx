"use client";

import { useUser, useSignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, KeyRound, Eye, EyeOff } from "lucide-react";
import { Field, Input, FieldError } from "@clerk/elements/common";
import { Root, Step, Action, Strategy } from "@clerk/elements/sign-in";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  const { isLoaded, isSignedIn } = useUser();
  const { signIn, setActive } = useSignIn();
  const router = useRouter();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState(""); // '', 'sending', 'code', 'resetting', 'success'
  const [resetError, setResetError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Usuario ya está logueado, redirigir al dashboard
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  // Función para manejar reset password
  const handleResetPassword = async (e: any) => {
    e.preventDefault();

    if (!resetEmail || !signIn) return;

    try {
      setResetStatus("sending");
      setResetError("");

      // Crear una nueva instancia de sign-in y enviar email de reset
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: resetEmail,
      });

      setResetStatus("code");
    } catch (error) {
      console.error("Error sending reset email:", error);
      setResetError(
        "Error al enviar el código. Verifica que el email sea correcto.",
      );
    }
  };

  // Función para verificar código y establecer nueva contraseña
  const handleVerifyCodeAndSetPassword = async (e: any) => {
    e.preventDefault();

    if (!verificationCode || !newPassword || !signIn) return;

    try {
      setResetStatus("resetting");
      setResetError("");

      // Verificar el código y establecer nueva contraseña
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: verificationCode,
        password: newPassword,
      });

      if (result.status === "complete") {
        // Login exitoso - establecer la sesión
        await setActive({ session: result.createdSessionId });
        setResetStatus("success");
        // Redirigir al dashboard después de un breve delay
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        setResetError("Error inesperado. Inténtalo de nuevo.");
      }
    } catch (error) {
      console.error("Error verifying code or setting password:", error);
      setResetError(
        "Código incorrecto o error al establecer contraseña. Inténtalo de nuevo.",
      );
    }
  };

  // Mostrar loading mientras Clerk se carga
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-2 text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si el usuario ya está logueado, no mostrar nada (se está redirigiendo)
  if (isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  // Mostrar Clerk SignIn para forgot password
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col justify-center items-center px-4">
        <div className="relative z-10 w-full max-w-md text-center flex flex-col items-center">
          {/* Logo */}
          <div className="mb-6">
            <img
              src="/even-assets/asterisk-evergreen.png"
              alt="Even Logo"
              className="size-16 justify-self-center"
            />
          </div>

          <div className="mb-4">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setResetStatus("");
                setResetError("");
                setResetEmail("");
                setVerificationCode("");
                setNewPassword("");
              }}
              className="text-white text-sm underline cursor-pointer bg-transparent border-none"
            >
              ← Volver al login
            </button>
          </div>

          {/* Formulario custom de reset password */}
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            {/* PASO 1: Ingresar email */}
            {resetStatus === "" || resetStatus === "sending" ? (
              <>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  ¿Olvidaste tu contraseña?
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Ingresa tu email y te enviaremos un código de verificación
                </p>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
                        placeholder="Email"
                        required
                        disabled={resetStatus === "sending"}
                      />
                    </div>
                  </div>

                  {resetError &&
                    resetStatus !== "code" &&
                    resetStatus !== "resetting" && (
                      <div className="text-rose-500 text-sm">{resetError}</div>
                    )}

                  <button
                    type="submit"
                    disabled={resetStatus === "sending"}
                    className={`w-full py-2 px-4 rounded-full transition-colors ${
                      resetStatus === "sending"
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-black hover:bg-stone-950 cursor-pointer"
                    } text-white`}
                  >
                    {resetStatus === "sending"
                      ? "Enviando..."
                      : "Enviar código"}
                  </button>
                </form>
              </>
            ) : resetStatus === "code" || resetStatus === "resetting" ? (
              /* PASO 2: Ingresar código y nueva contraseña */
              <>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Verificar código
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Ingresa el código que enviamos a <strong>{resetEmail}</strong>{" "}
                  y tu nueva contraseña
                </p>

                <form
                  onSubmit={handleVerifyCodeAndSetPassword}
                  className="space-y-4"
                >
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent text-center tracking-widest"
                        placeholder="000000"
                        required
                        maxLength={6}
                        disabled={resetStatus === "resetting"}
                      />
                      <label className="block text-xs text-gray-600 mt-1">
                        Código de verificación
                      </label>
                    </div>

                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
                        placeholder="Nueva contraseña"
                        required
                        disabled={resetStatus === "resetting"}
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        tabIndex={-1}
                      >
                        {showNewPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                      <label className="block text-xs text-gray-600 mt-1">
                        Mínimo 8 caracteres
                      </label>
                    </div>
                  </div>

                  {resetError &&
                    (resetStatus === "code" || resetStatus === "resetting") && (
                      <div className="text-rose-500 text-sm">{resetError}</div>
                    )}

                  <button
                    type="submit"
                    disabled={resetStatus === "resetting"}
                    className={`w-full py-2 px-4 rounded-full transition-colors ${
                      resetStatus === "resetting"
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-black hover:bg-stone-950 cursor-pointer"
                    } text-white`}
                  >
                    {resetStatus === "resetting"
                      ? "Verificando..."
                      : "Establecer contraseña"}
                  </button>
                </form>
              </>
            ) : resetStatus === "success" ? (
              /* PASO 3: Éxito */
              <>
                <div className="text-center">
                  <div className="text-green-600 text-4xl mb-4">✅</div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    ¡Contraseña actualizada!
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Tu contraseña ha sido restablecida exitosamente. Serás
                    redirigido al dashboard en unos momentos.
                  </p>
                  <div className="text-xs text-gray-500">Redirigiendo...</div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Usuario no está logueado, mostrar formulario de login
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a8b9b] to-[#153f43] flex flex-col justify-center items-center px-4">
      <div className="relative z-10 w-full max-w-md text-center flex flex-col items-center">
        {/* Logo */}
        <div className="mb-6">
          <img
            src="/even-assets/asterisk-evergreen.png"
            alt="Even Logo"
            className="size-16 justify-self-center"
          />
        </div>

        <div className="w-full">
          <Root>
            <Step name="start">
              {/* Título y descripción */}
              <div className="mb-6 text-center">
                <h1 className="text-xl font-medium text-white mb-2">
                  Admin Portal - Even
                </h1>
                <p className="text-gray-200 text-sm">
                  Ingresa a tu portal de administración
                </p>
              </div>

              <div className="space-y-3">
                <Field name="identifier" className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                    <Input
                      required
                      type="email"
                      autoComplete="username email"
                      className="w-full pl-10 pr-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
                      placeholder="Email"
                    />
                  </div>
                  <FieldError className="text-rose-400 text-xs" />
                </Field>

                <Field name="password" className="space-y-2">
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                    <Input
                      required
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a8b9b] focus:border-transparent"
                      placeholder="Contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  <FieldError className="text-rose-400 text-xs" />
                </Field>
              </div>

              <div className="flex items-center justify-center gap-3 mt-5">
                <Action
                  submit
                  className="bg-black hover:bg-stone-950 w-full text-white py-3 rounded-full cursor-pointer transition-colors"
                >
                  Iniciar sesión
                </Action>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowForgotPassword(true)}
                  className="text-white text-sm underline cursor-pointer bg-transparent border-none"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </Step>
          </Root>
        </div>
      </div>
    </div>
  );
}
