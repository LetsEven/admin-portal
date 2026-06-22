"use client";

import { useUser, useSignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, KeyRound, Eye, EyeOff } from "lucide-react";
import { Field, Input, FieldError } from "@clerk/elements/common";
import { Root, Step, Action } from "@clerk/elements/sign-in";

export default function Page() {
  const { isLoaded, isSignedIn } = useUser();
  const { signIn, setActive } = useSignIn();
  const router = useRouter();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState("");
  const [resetError, setResetError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleResetPassword = async (e: any) => {
    e.preventDefault();
    if (!resetEmail || !signIn) return;
    try {
      setResetStatus("sending");
      setResetError("");
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
      setResetStatus("");
    }
  };

  const handleVerifyCodeAndSetPassword = async (e: any) => {
    e.preventDefault();
    if (!verificationCode || !newPassword || !signIn) return;
    try {
      setResetStatus("resetting");
      setResetError("");
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: verificationCode,
        password: newPassword,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setResetStatus("success");
        setTimeout(() => router.push("/"), 1500);
      } else {
        setResetError("Error inesperado. Inténtalo de nuevo.");
        setResetStatus("code");
      }
    } catch (error) {
      console.error("Error verifying code or setting password:", error);
      setResetError("Código incorrecto o error al establecer contraseña.");
      setResetStatus("code");
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#023828] flex items-center justify-center">
        <div className="text-center">
          <img
            src="/even/even-asterisk-grass.svg"
            alt="Even"
            className="asterisk-spin size-18 md:size-20 object-contain"
          />
        </div>
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="min-h-screen bg-[#023828] flex items-center justify-center">
        <p className="text-xs uppercase tracking-widest text-[#82E657]">
          Redirigiendo...
        </p>
      </div>
    );
  }

  /* ── Forgot password ── */
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-[#023828] flex flex-col justify-center items-center px-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-12">
            <img
              src="/even-assets/even-asterisk-grass.svg"
              alt="Even"
              className="h-16"
            />
          </div>

          <div className="bg-white p-10 rounded-2xl">
            {resetStatus === "" || resetStatus === "sending" ? (
              <>
                <h2 className="text-base font-medium uppercase tracking-widest text-[#023828] mb-2">
                  Recuperar contraseña
                </h2>
                <p className="text-xs text-[#023828]/50 mb-8 tracking-wide">
                  Te enviaremos un código de verificación
                </p>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#023828]/30 pointer-events-none" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 text-sm border-2 border-[#023828]/20 focus:border-[#023828] focus:outline-none text-[#023828]"
                      placeholder="Email"
                      required
                      disabled={resetStatus === "sending"}
                    />
                  </div>

                  {resetError && (
                    <p className="text-xs text-red-500">{resetError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={resetStatus === "sending"}
                    className="w-full py-3.5 bg-[#82E657] text-[#023828] text-xs uppercase tracking-widest font-medium hover:bg-[#6fd444] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-3"
                  >
                    {resetStatus === "sending"
                      ? "Enviando..."
                      : "Enviar código"}
                  </button>
                </form>
              </>
            ) : resetStatus === "code" || resetStatus === "resetting" ? (
              <>
                <h2 className="text-base font-medium uppercase tracking-widest text-[#023828] mb-2">
                  Verificar código
                </h2>
                <p className="text-xs text-[#023828]/50 mb-8 tracking-wide">
                  Código enviado a{" "}
                  <span className="text-[#023828] font-medium">
                    {resetEmail}
                  </span>
                </p>

                <form
                  onSubmit={handleVerifyCodeAndSetPassword}
                  className="space-y-4"
                >
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full px-4 py-3 text-sm border-2 border-[#023828]/20 focus:border-[#023828] focus:outline-none text-center tracking-[0.4em] text-[#023828]"
                    placeholder="000000"
                    required
                    maxLength={6}
                    disabled={resetStatus === "resetting"}
                  />

                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#023828]/30 pointer-events-none" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-3 text-sm border-2 border-[#023828]/20 focus:border-[#023828] focus:outline-none text-[#023828]"
                      placeholder="Nueva contraseña"
                      required
                      disabled={resetStatus === "resetting"}
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#023828]/30 hover:text-[#023828]"
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#023828]/40 -mt-2">
                    Mínimo 8 caracteres
                  </p>

                  {resetError && (
                    <p className="text-xs text-red-500">{resetError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={resetStatus === "resetting"}
                    className="w-full py-3.5 bg-[#82E657] text-[#023828] text-xs uppercase tracking-widest font-medium hover:bg-[#6fd444] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {resetStatus === "resetting"
                      ? "Verificando..."
                      : "Establecer contraseña"}
                  </button>
                </form>
              </>
            ) : resetStatus === "success" ? (
              <div className="text-center py-4">
                <div className="text-[#82E657] text-3xl mb-4">✓</div>
                <h2 className="text-sm font-medium uppercase tracking-widest text-[#023828] mb-2">
                  Contraseña actualizada
                </h2>
                <p className="text-xs text-[#023828]/50">
                  Redirigiendo al dashboard...
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setResetStatus("");
                setResetError("");
                setResetEmail("");
                setVerificationCode("");
                setNewPassword("");
              }}
              className="text-xs uppercase tracking-widest text-[#82E657]/60 hover:text-[#82E657] transition-colors bg-transparent border-none cursor-pointer"
            >
              ← Volver al login
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Main login ── */
  return (
    <div className="min-h-screen bg-[#023828] flex flex-col justify-center items-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <img
            src="/even-assets/even-asterisk-grass.svg"
            alt="Even"
            className="h-16"
          />
        </div>

        <div className="bg-white p-10 rounded-2xl">
          <div className="mb-8">
            <h1 className="text-base font-medium uppercase tracking-widest text-[#023828]">
              Admin Portal
            </h1>
            <p className="text-xs text-[#023828]/40 mt-2 tracking-wide">
              Ingresa a tu portal de administración
            </p>
          </div>

          <Root>
            <Step name="start">
              <div className="space-y-4">
                <Field name="identifier" className="space-y-1.5">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#023828]/30 pointer-events-none" />
                    <Input
                      required
                      type="email"
                      autoComplete="username email"
                      className="w-full pl-11 pr-4 py-3 text-sm border-2 border-[#023828]/20 focus:border-[#023828] focus:outline-none text-[#023828] bg-white"
                      placeholder="Email"
                    />
                  </div>
                  <FieldError className="text-xs text-red-500" />
                </Field>

                <Field name="password" className="space-y-1.5">
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#023828]/30 pointer-events-none" />
                    <Input
                      required
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="w-full pl-11 pr-11 py-3 text-sm border-2 border-[#023828]/20 focus:border-[#023828] focus:outline-none text-[#023828] bg-white"
                      placeholder="Contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#023828]/30 hover:text-[#023828]"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <FieldError className="text-xs text-red-500" />
                </Field>
              </div>

              <Action
                submit
                className="w-full mt-7 py-3.5 bg-[#82E657] text-[#023828] text-xs uppercase tracking-widest font-medium hover:bg-[#6fd444] transition-colors cursor-pointer"
              >
                Iniciar sesión
              </Action>

              <div className="mt-5 text-center">
                <button
                  onClick={() => setShowForgotPassword(true)}
                  className="text-[10px] uppercase tracking-widest text-[#023828]/30 hover:text-[#023828] transition-colors cursor-pointer bg-transparent border-none"
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
