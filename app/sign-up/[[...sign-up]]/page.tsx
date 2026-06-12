"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Mail, KeyRound, User, ShieldAlert } from "lucide-react";
import { Field, Input, FieldError } from "@clerk/elements/common";
import { Root, Step, Action } from "@clerk/elements/sign-up";

export default function Page() {
  const [password, setPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordErrorEs, setPasswordErrorEs] = useState("");
  const passwordFieldRef = useRef<HTMLDivElement>(null);
  const [emailValidation, setEmailValidation] = useState({
    loading: true,
    allowed: false,
    message: "",
    clientName: "",
  });

  const clerkErrorMap: Record<string, string> = {
    form_password_pwned:
      "Tu contraseña fue encontrada en una filtración de datos. Por seguridad, usa una contraseña diferente.",
    form_password_length_too_short:
      "La contraseña debe tener al menos 8 caracteres.",
  };

  useEffect(() => {
    if (!emailValidation.allowed) return;

    let observer: MutationObserver | null = null;

    const timeoutId = setTimeout(() => {
      const container = passwordFieldRef.current;
      if (!container) return;

      const checkForErrors = () => {
        const errorEl = container.querySelector(
          "[data-error-code]",
        ) as HTMLElement | null;
        if (errorEl) {
          const errorCode = errorEl.getAttribute("data-error-code");
          if (errorCode && clerkErrorMap[errorCode]) {
            setPasswordErrorEs(clerkErrorMap[errorCode]);
            return;
          }
        }
        setPasswordErrorEs("");
      };

      checkForErrors();

      observer = new MutationObserver(checkForErrors);
      observer.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (observer) observer.disconnect();
    };
  }, [emailValidation.allowed]);

  const searchParams = useSearchParams();
  const { user } = useUser();
  const isInvited = searchParams.get("invited") === "true";
  const emailFromUrl = searchParams.get("email");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (isInvited && emailFromUrl) {
      localStorage.setItem("invitation_email", emailFromUrl);
      validateEmailAccess(emailFromUrl);
    } else {
      setEmailValidation({
        loading: false,
        allowed: false,
        message: "Acceso solo por invitación",
        clientName: "",
      });
    }
  }, [mounted, isInvited, emailFromUrl]);

  const validateEmailAccess = async (email: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin-portal/validate-email/${encodeURIComponent(email)}`,
      );
      const data = await response.json();

      setEmailValidation({
        loading: false,
        allowed: data.allowed,
        message: data.message || "",
        clientName: data.client_name || "",
      });
    } catch (error) {
      console.error("❌ Error validating email:", error);
      setEmailValidation({
        loading: false,
        allowed: false,
        message: "Error validando acceso",
        clientName: "",
      });
    }
  };

  if (emailValidation.loading) {
    return (
      <div className="min-h-screen bg-[#023828] flex items-center justify-center">
        <div className="h-6 w-6 border-b-2 border-[#82E657] animate-spin" />
      </div>
    );
  }

  if (!emailValidation.allowed) {
    return (
      <div className="min-h-screen bg-[#023828] flex flex-col justify-center items-center px-6">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-12">
            <img
              src="/even-assets/asterisk-evergreen.png"
              alt="Even"
              className="h-16 brightness-0 invert"
            />
          </div>

          <div className="bg-white p-10">
            <div className="flex items-center justify-center w-14 h-14 mx-auto bg-red-50 mb-6">
              <ShieldAlert className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-base font-medium uppercase tracking-widest text-[#023828] text-center mb-2">
              Acceso restringido
            </h2>
            <p className="text-xs text-[#023828]/50 text-center tracking-wide mb-6">
              {emailValidation.message ||
                "No tienes autorización para acceder a este portal."}
            </p>
            <div className="bg-[#C3FEFF]/20 border border-[#023828]/10 p-4">
              <p className="text-xs text-[#023828]/60 text-center">
                Si crees que esto es un error, contacta a tu administrador para
                obtener una invitación válida.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#023828] flex flex-col justify-center items-center px-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-12">
          <img
            src="/even-assets/asterisk-evergreen.png"
            alt="Even"
            className="h-16 brightness-0 invert"
          />
        </div>

        <div className="bg-white p-10">
          <Root>
            <Step name="start">
              <div className="mb-8">
                <h1 className="text-base font-medium uppercase tracking-widest text-[#023828]">
                  Crear cuenta
                </h1>
                <p className="text-xs text-[#023828]/40 mt-2 tracking-wide">
                  Completa tu registro para acceder al portal
                </p>
              </div>

              <div className="space-y-4">
                <Field name="firstName" className="space-y-1.5">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#023828]/30 pointer-events-none" />
                    <Input
                      required
                      type="text"
                      autoComplete="given-name"
                      className="w-full pl-11 pr-4 py-3 text-sm border-2 border-[#023828]/20 focus:border-[#023828] focus:outline-none text-[#023828] bg-white"
                      placeholder="Nombre"
                    />
                  </div>
                  <FieldError className="text-xs text-red-500" />
                </Field>

                <Field name="lastName" className="space-y-1.5">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#023828]/30 pointer-events-none" />
                    <Input
                      required
                      type="text"
                      autoComplete="family-name"
                      className="w-full pl-11 pr-4 py-3 text-sm border-2 border-[#023828]/20 focus:border-[#023828] focus:outline-none text-[#023828] bg-white"
                      placeholder="Apellido"
                    />
                  </div>
                  <FieldError className="text-xs text-red-500" />
                </Field>

                <Field name="emailAddress" className="space-y-1.5">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#023828]/20 pointer-events-none" />
                    <Input
                      required
                      type="email"
                      autoComplete="username email"
                      className="w-full pl-11 pr-4 py-3 text-sm border-2 border-[#023828]/10 text-[#023828]/40 bg-[#023828]/5 cursor-not-allowed"
                      placeholder="Email"
                      value={emailFromUrl || ""}
                      readOnly
                      disabled
                    />
                  </div>
                  <FieldError className="text-xs text-red-500" />
                </Field>

                <div ref={passwordFieldRef}>
                  <Field name="password" className="space-y-1.5">
                    <div
                      className="relative"
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        if (
                          target.type === "password" ||
                          target.name === "password"
                        ) {
                          setPassword(target.value);
                        }
                      }}
                      onFocusCapture={() => setPasswordFocused(true)}
                      onBlurCapture={() => setPasswordFocused(false)}
                    >
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#023828]/30 pointer-events-none" />
                      <Input
                        required
                        type="password"
                        autoComplete="new-password"
                        className="w-full pl-11 pr-4 py-3 text-sm border-2 border-[#023828]/20 focus:border-[#023828] focus:outline-none text-[#023828] bg-white"
                        placeholder="Contraseña"
                      />
                    </div>
                    <FieldError className="sr-only" />

                    {(passwordFocused || password.length > 0) && (
                      <div className="mt-1 space-y-1.5">
                        <div className="flex items-start gap-1.5">
                          <ShieldAlert
                            className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${
                              passwordErrorEs
                                ? "text-red-500"
                                : password.length >= 8
                                  ? "text-[#023828]/50"
                                  : "text-[#023828]/30"
                            }`}
                          />
                          <span
                            className={`text-xs ${
                              passwordErrorEs
                                ? "text-red-500 font-medium"
                                : password.length >= 8
                                  ? "text-[#023828]/50"
                                  : "text-[#023828]/30"
                            }`}
                          >
                            {passwordErrorEs ||
                              (password.length >= 8
                                ? "Si tu contraseña fue expuesta en una filtración de datos, será rechazada. Usa una contraseña única."
                                : "Las contraseñas comprometidas serán rechazadas por seguridad")}
                          </span>
                        </div>
                      </div>
                    )}
                  </Field>
                </div>
              </div>

              <Action
                submit
                className="w-full mt-7 py-3.5 bg-[#82E657] text-[#023828] text-xs uppercase tracking-widest font-medium hover:bg-[#6fd444] transition-colors cursor-pointer"
              >
                Crear cuenta
              </Action>

              <div className="mt-5 text-center">
                <a
                  href="/sign-in"
                  className="text-[10px] uppercase tracking-widest text-[#023828]/30 hover:text-[#023828] transition-colors"
                >
                  ¿Ya tienes una cuenta? Iniciar sesión
                </a>
              </div>
            </Step>

            <Step name="verifications">
              <div className="mb-8">
                <h1 className="text-base font-medium uppercase tracking-widest text-[#023828]">
                  Verificar cuenta
                </h1>
                <p className="text-xs text-[#023828]/40 mt-2 tracking-wide">
                  Hemos enviado un código de verificación a tu email
                </p>
              </div>

              <Field name="code" className="space-y-1.5 mb-7">
                <Input
                  required
                  type="text"
                  className="w-full px-4 py-3 text-sm border-2 border-[#023828]/20 focus:border-[#023828] focus:outline-none text-center tracking-[0.4em] text-[#023828] bg-white"
                  placeholder="000000"
                />
                <FieldError className="text-xs text-red-500" />
              </Field>

              <Action
                submit
                className="w-full py-3.5 bg-[#82E657] text-[#023828] text-xs uppercase tracking-widest font-medium hover:bg-[#6fd444] transition-colors cursor-pointer"
              >
                Verificar cuenta
              </Action>
            </Step>
          </Root>
        </div>
      </div>
    </div>
  );
}
