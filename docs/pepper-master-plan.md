# Pepper — Plan Maestro de Implementación

> **Documento maestro y persistente.** Este archivo es la fuente única de verdad del proyecto "Pepper Gerente Digital". Está diseñado para retomarse entre sesiones sin re-explicar contexto.

---

## 🧭 Cómo usar este plan (protocolo de retomado)

En una sesión nueva, el flujo es:

1. El usuario dice: **"lee el plan y continúa donde nos quedamos"**.
2. El agente (Claude) lee este archivo completo.
3. Va a la sección [📊 Estado actual](#-estado-actual) → identifica la fase/paso `EN CURSO` o el primer `PENDIENTE`.
4. Continúa desde ahí. Al terminar cada paso: marca el checkbox `[x]`, actualiza el [📊 Estado actual](#-estado-actual) y agrega una línea al [📝 Changelog](#-changelog).
5. No empezar una fase nueva sin que la anterior cumpla sus **Criterios de aceptación**, salvo que el usuario lo pida.

**Reglas de oro al ejecutar:**
- Cada paso tiene: *Objetivo*, *Repo/archivos*, *Pasos*, *Criterios de aceptación*, *Notas de mejores prácticas*.
- No marcar `[x]` sin verificar el criterio de aceptación (correr lint/type-check/build o probar el endpoint).
- Si una decisión abierta (ver [❓ Decisiones pendientes](#-decisiones-pendientes)) bloquea un paso, preguntar al usuario antes de asumir.
- Mantener el alcance de cada commit a un paso (o sub-paso) para que sea reversible.

---

## 🎯 Visión

Convertir a **Pepper** de un chatbot de preguntas-y-respuestas a un **"gerente digital" por restaurante**: un agente que conoce el negocio, acumula entendimiento en el tiempo, detecta patrones, propone mejoras, toma iniciativa (no espera a que le escriban) y actúa (con aprobación humana).

**Pilares que definen "gerente" (no solo "bibliotecario"):**
1. **Iniciativa** → proactividad (briefings/alertas sin que le pregunten).
2. **Criterio** → razonamiento sobre datos frescos + memoria.
3. **Acción** → ejecutar cambios (promos, campañas) con aprobación.
4. **Seguimiento** → recordar sus recomendaciones y medir resultados.
5. **Entendimiento acumulado** → memoria de largo plazo por restaurante.

**Omnicanal:** se habla con Pepper desde la **web** (como hoy) y desde **WhatsApp**. El proveedor de WhatsApp es solo un **transporte** (webhook in / API out). Toda la lógica, identidad, historial y memoria viven en el backend. El **historial es unificado y server-side**: una conversación de WhatsApp aparece en el historial web y viceversa.

---

## 🏗️ Arquitectura objetivo (decisiones bloqueadas)

```
Web UI ───────► /chat/stream (SSE) ──┐
                                     ├─► [normalizar a mensaje canónico] ─► AGENT CORE (runAgent)
WhatsApp ─► webhook (sent.dm) ───────┘            │                              │
   ▲                                              ▼                              ▼
   └────────── outbound API ◄─────── [adaptador de canal] ◄─── Store (Postgres) + Memoria (Zep)
```

**Decisiones tomadas (no re-litigar sin razón nueva):**

| # | Decisión | Razón |
|---|----------|-------|
| D1 | **Provider = transporte detrás de una interfaz** (mensaje canónico provider-agnóstico). sent.dm para WhatsApp; intercambiable. | Desacoplar canal de cerebro; poder cambiar de BSP sin tocar el core. |
| D2 | **Un solo agent core + adaptadores por canal.** Web = SSE streaming; WhatsApp = buffer + envío único. | `runAgent` no se duplica; las diferencias viven en el adaptador. |
| D3 | **Store persistente en Postgres** (`conversations`, `messages`, `whatsapp_identities`). El `Map` en memoria muere. | Sin store persistente no hay historial unificado ni WhatsApp. |
| D4 | **Historial sale de localStorage → backend.** La web lee del backend. | Una conversación de WhatsApp no puede vivir en localStorage del navegador. |
| D5 | **Hilos separados por canal, vista unificada.** Contexto corto por hilo; memoria larga compartida por restaurante. | UX coherente por canal + "memoria de la relación" vía Zep. |
| D6 | **Memoria larga = Zep/Graphiti, un graph por `restaurant_id`.** Solo se ingestan **hechos cualitativos, decisiones y resultados** — NUNCA métricas crudas. | Las métricas viven en Postgres y se traen frescas; meterlas al grafo = stale + quema créditos. |
| D7 | **Identidad:** Clerk en web; `phone → restaurant` verificado en WhatsApp; rechazar números desconocidos. | El número ES la identidad; sin esto se reabre el IDOR por WhatsApp. |
| D8 | **Webhook:** firma/HMAC + ACK rápido + procesamiento async + idempotencia + serialización por hilo. | El agente tarda segundos; el webhook no puede responder síncrono. |
| D9 | **Seguridad y exactitud primero.** Arreglar auth/authz (IDOR) y aritmética determinística antes de features. | Un gerente que filtra datos o da números mal, no sirve. |

---

## 📚 Estado del sistema HOY (punto de partida)

**Repos involucrados:**
- `admin-portal/` (este repo) — frontend Next.js 14 / React 18.
- `xquisito-backend/` (repo hermano, `../xquisito-backend`) — Express, donde corre el agente.

**Frontend (`admin-portal`):**
- `app/pepper/page.tsx` — UI de chat, cliente SSE (`streamFromAgent`), historial en **localStorage** (`pepper_conversations`), render de markdown + artifacts.
- `app/pepper/artifacts/` — `ChartArtifact.tsx` (Recharts), `MetricArtifact.tsx`, `ArtifactBlock.tsx`, `types.ts`.
- Llama a `${NEXT_PUBLIC_API_BASE_URL}/api/ai-agent/chat/stream`. **No envía token de auth.**

**Backend (`xquisito-backend`):**
- `src/services/shared/pepperAgentService.js` — loop agéntico con Claude SDK (`@anthropic-ai/sdk ^0.98.0`), modelo `claude-opus-4-8`, `MAX_TURNS=8`. **Sesiones en `Map` en memoria** (TTL 2h). 9 tools de datos + 2 de render (`render_chart`, `render_metric`). System prompt con glosario financiero. Inyecta fecha actual.
- `src/routes/shared/aiAgentRoutes.js` — `/chat/stream` (SSE) y `/chat` (no-stream). Montado en `app.js:212` como `/api/ai-agent`.
- Tools consumen: `services/admin-portal/analyticsService.js`, `services/admin-portal/segmentsService.js`, `services/shared/restaurantService.js` (sobre Supabase).

**Problemas conocidos (se resuelven en las fases):**
- 🔴 `/api/ai-agent` **sin autenticación**; `restaurant_id` viene del cliente en texto plano → **IDOR** (cualquiera consulta datos de cualquier restaurante). El sistema tiene `pci_audit_logs` pero esta ruta loguea como `"anonymous"`.
- 🟠 Sesiones en memoria: no escalan multi-instancia, se pierden al reiniciar, **desincronizan** con el historial de localStorage (Pepper "olvida" hilos que la UI muestra).
- 🟠 Sin **prompt caching** (system + tools estáticos se reenvían cada turno). Además la fecha volátil va al inicio del prompt → rompería cualquier prefijo cacheable.
- 🟠 Modelo Opus (costo); evaluar Sonnet.
- 🟡 Aritmética comparativa (deltas, %) la hace el LLM → riesgo de error en cifras de dinero.
- 🟡 Filtrado por estado de transacción a verificar en `getRevenueBreakdown` (suma todo el rango sin filtrar estado).
- 🟡 Botones decorativos (`+`, micrófono) sin handler; `console.log` con datos de usuario en producción.

---

## 🗺️ Fases (resumen)

| Fase | Nombre | Objetivo | Depende de |
|------|--------|----------|-----------|
| **0** | Fundaciones y hardening | Seguridad (auth/IDOR), prompt caching, observabilidad, costo | — |
| **1** | Store persistente | Conversaciones/mensajes en Postgres; historial server-side | 0 |
| **2** | Core agnóstico de canal | Refactor ports & adapters; separar core de transporte | 1 |
| **3** | Canal WhatsApp | Webhook sent.dm, identidad, async, artifacts en WhatsApp | 1, 2 |
| **4** | Memoria de largo plazo | Zep/Graphiti por restaurante; tools de memoria | 1 |
| **5** | Analítica determinística | `compare_periods`, anomalías (motor de percepción) | 0 |
| **6** | Proactividad | Cron + briefings/alertas por WhatsApp (lo que lo hace "gerente") | 3, 4, 5 |
| **7** | Agencia (acciones) | Tools de acción con aprobación + loop de seguimiento | 4, 6 |
| **8** | Hardening continuo | Rate limit, retries, tests, monitoreo de costo, polish UI | transversal |

---

## Fase 0 — Fundaciones y hardening

> **Objetivo:** que Pepper sea seguro, exacto y barato antes de agregar superficie. Prerrequisito de todo.

### 0.1 — Autenticación y autorización del backend `[x]`
- **Repo/archivos:** `xquisito-backend/src/routes/shared/aiAgentRoutes.js`, nuevo middleware de auth, `src/app.js`.
- **Implementado:** se reutilizó el middleware existente `adminPortalAuth` (Clerk, `Authorization: Bearer`) en ambas rutas de `/api/ai-agent`. Se agregó `authorizeRestaurant` que resuelve los restaurantes del usuario con `analyticsService.getUserRestaurants(clerkUserId)` y valida el `restaurant_id` solicitado contra esa lista (403 si no es suyo; 400 si no especifica y tiene varios). `streamChat` ahora recibe `authContext` server-side y lo usa como autoridad; `parseContext` quedó solo como hint. El audit log de `pci_audit_logs` ya captura el `user_id` real (corre en `res.finish`, con `req.user` ya poblado). **Nota:** no hay "tabla de membresías" — la relación es ownership (`restaurants.user_id = user_admin_portal.id`).
- **Pasos:**
  1. Agregar middleware que **valide el token de Clerk** (o el esquema de auth que use el resto del backend admin-portal) en `/api/ai-agent`.
  2. Derivar `restaurant_id` y `user_id` **del token/servidor**, NO del mensaje del cliente.
  3. Autorizar: verificar que el usuario tiene acceso al restaurante solicitado (tabla de membresías). Rechazar con 403 si no.
  4. Mantener `parseContext` solo como *hint*, nunca como fuente de autoridad para `restaurant_id`.
- **Criterios de aceptación:**
  - Una petición sin token válido → 401.
  - Una petición con token de usuario A pidiendo restaurante de usuario B → 403.
  - El `restaurant_id` efectivo proviene del servidor, no del body.
- **Mejores prácticas:** defensa en profundidad; los `pci_audit_logs` deben registrar el `user_id` real (no `"anonymous"`).

### 0.2 — Frontend envía credenciales `[ ]`
- **Repo/archivos:** `admin-portal/app/pepper/page.tsx` (`streamFromAgent`).
- **Pasos:** adjuntar el token de sesión de Clerk (`Authorization: Bearer …` o cookie) en el `fetch` a `/chat/stream`.
- **Criterios de aceptación:** el chat web sigue funcionando con auth activa.

### 0.3 — Prompt caching `[ ]`
- **Repo/archivos:** `xquisito-backend/src/services/shared/pepperAgentService.js`.
- **Pasos:**
  1. Reordenar `buildSystemPrompt`: poner el `SYSTEM_PROMPT` **estático primero** con `cache_control: { type: "ephemeral" }`, y la fecha/hora volátil al final (o como bloque/mensaje aparte).
  2. Marcar la definición de `TOOLS` como cacheable.
- **Criterios de aceptación:** las respuestas reportan `usage.cache_read_input_tokens > 0` a partir del segundo turno/petición.
- **Mejores prácticas:** verificar contra la doc vigente del Claude SDK (usar la skill `claude-api` si hay duda de la API exacta).

### 0.4 — Evaluación de modelo (Opus vs Sonnet) `[ ]`
- **Pasos:** A/B con `PEPPER_MODEL`. Medir calidad de razonamiento, latencia y costo en consultas reales. Default sugerido: Sonnet, reservar Opus si baja la calidad.
- **Criterios de aceptación:** decisión documentada en el changelog con datos.

### 0.5 — Observabilidad y limpieza `[ ]`
- **Pasos:**
  1. Capturar `response.usage` por turno (tokens in/out/cache) y costo estimado.
  2. Logging estructurado; gatear `console.log` de datos de usuario tras flag de dev (frontend y backend).
  3. Backoff/retry ante `overloaded`/529.
- **Criterios de aceptación:** existe registro de uso por conversación; sin logs de PII en prod.

---

## Fase 1 — Store persistente de conversaciones

> **Objetivo:** mover el historial de localStorage/Map a Postgres. Cimiento del historial unificado y de WhatsApp.

### 1.1 — Modelo de datos `[ ]`
- **Repo/archivos:** migración SQL en `xquisito-backend` (Supabase).
- **Esquema propuesto:**
  - `conversations(id uuid pk, restaurant_id, user_id, channel text /* 'web' | 'whatsapp' */, title, created_at, updated_at, last_inbound_at)`.
  - `messages(id uuid pk, conversation_id fk, role text /* user|assistant */, content text, artifacts jsonb, channel text, provider_message_id text null, created_at)`.
  - `whatsapp_identities(phone_e164 pk, user_id, restaurant_id, verified_at, created_at)` *(se usa en Fase 3; definir aquí está bien)*.
- **Criterios de aceptación:** migración aplicada; índices en `conversations(restaurant_id, user_id, updated_at)` y `messages(conversation_id, created_at)`; `provider_message_id` con índice único para idempotencia.
- **Mejores prácticas:** RLS si aplica; `restaurant_id`/`user_id` NOT NULL; FK con `on delete cascade` en `messages`.

### 1.2 — Refactor del store en el agente `[ ]`
- **Repo/archivos:** `pepperAgentService.js`.
- **Pasos:**
  1. Reemplazar el `Map` de sesiones por lectura/escritura a Postgres (cargar últimos N mensajes como historial; persistir user + assistant al terminar el turno).
  2. Persistir artifacts y, si se decide, metadata de tools.
  3. Mantener `HISTORY_LIMIT`/`CONTENT_CAP` como ventana de contexto enviada al modelo (no como límite de almacenamiento).
- **Criterios de aceptación:** reiniciar el backend NO pierde el historial; un segundo mensaje recuerda el primero leyendo de Postgres.

### 1.3 — Endpoints de historial `[ ]`
- **Repo/archivos:** `aiAgentRoutes.js`.
- **Pasos:** `GET /conversations` (lista por restaurante/usuario), `GET /conversations/:id/messages`, `DELETE /conversations/:id`. Todos autenticados (Fase 0).
- **Criterios de aceptación:** la web puede listar, abrir y borrar conversaciones desde el backend.

### 1.4 — Frontend lee historial del backend `[ ]`
- **Repo/archivos:** `admin-portal/app/pepper/page.tsx`.
- **Pasos:**
  1. Sustituir lectura/escritura de `localStorage` por los endpoints de 1.3.
  2. Migración única: al primer login, subir lo que exista en `pepper_conversations` y luego dejar de usar localStorage.
- **Criterios de aceptación:** el historial persiste entre dispositivos/navegadores; se ve igual tras limpiar localStorage.

---

## Fase 2 — Core agnóstico de canal (ports & adapters)

> **Objetivo:** separar el cerebro del transporte para que WhatsApp sea solo otro adaptador.

### 2.1 — Mensaje canónico e interfaz de handlers `[ ]`
- **Pasos:** definir el tipo canónico `{ channel, externalId, userId, restaurantId, threadId, text, timestamp }` y normalizar la entrada web a este shape antes del core.
- **Criterios de aceptación:** `runAgent` recibe siempre el shape canónico, sin saber de qué canal viene.

### 2.2 — Extraer el core del transporte `[ ]`
- **Pasos:** dejar `runAgent`/loop puro (recibe mensaje canónico + handlers, no conoce SSE ni HTTP). El **adaptador web** mapea handlers→SSE (streaming). 
- **Criterios de aceptación:** el chat web funciona idéntico, ahora pasando por el core agnóstico.

### 2.3 — Capacidades por canal `[ ]`
- **Pasos:** abstracción de capacidades: `supportsStreaming`, estrategia de artifacts (Recharts vs PNG/texto), límite de longitud. El core consulta capacidades; el adaptador las implementa.
- **Criterios de aceptación:** el core decide qué emitir según capacidades, sin ramas `if (whatsapp)` dispersas.

---

## Fase 3 — Canal WhatsApp (sent.dm)

> **Objetivo:** hablar con Pepper por WhatsApp; provider = cable tonto. Depende de Fases 1 y 2.

> ⚠️ **Bloqueador a resolver primero:** confirmar con sent.dm que soporta **webhook de inbound (two-way) sobre un número dedicado**. Si no, usar Twilio / 360dialog / Meta Cloud API directo para inbound y dejar sent.dm para outbound. Ver [❓ Decisiones pendientes](#-decisiones-pendientes).

### 3.1 — Integración del provider detrás de la interfaz `[ ]`
- **Pasos:** implementar `WhatsAppProvider` con `sendMessage()` y verificación de firma de webhook. Detrás de la interfaz de D1.
- **Criterios de aceptación:** se puede enviar un mensaje de prueba a un número y recibir uno (eco) sin tocar el agent core.

### 3.2 — Identidad phone → restaurante `[ ]`
- **Pasos:**
  1. Tabla `whatsapp_identities` (definida en 1.1).
  2. Flujo de verificación/onboarding del número (código por WhatsApp/SMS o alta desde la web).
  3. Rechazar números no verificados con un mensaje guía.
  4. **Desambiguación multi-restaurante** (ver decisión D-pendiente): default por número o Pepper pregunta "¿de cuál restaurante?".
- **Criterios de aceptación:** un número desconocido NO obtiene datos; un número verificado resuelve a su `restaurant_id` correcto.

### 3.3 — Webhook robusto `[ ]`
- **Pasos:**
  1. **Verificar firma/HMAC** del provider.
  2. **ACK 200 inmediato**; procesar el agente **async** (cola o worker), NO en la respuesta del webhook.
  3. **Idempotencia** por `provider_message_id` (índice único de 1.1).
  4. **Serializar** mensajes del mismo hilo (lock/cola por `threadId`).
- **Criterios de aceptación:** reintentos del provider no duplican respuestas; 3 mensajes rápidos se procesan en orden.

### 3.4 — Outbound y formato `[ ]`
- **Pasos:** responder vía API del provider (no por el webhook); **chunking** de mensajes >4096 chars; indicador "escribiendo…".
- **Criterios de aceptación:** respuestas largas llegan completas y en orden.

### 3.5 — Artifacts en WhatsApp `[ ]`
- **Pasos:** renderizar gráficas **server-side a PNG** (o degradar a texto/tabla). Reutilizar la semántica de `ChartArtifact`/`MetricArtifact`.
- **Criterios de aceptación:** una consulta que en web genera gráfica, en WhatsApp llega como imagen legible o tabla.

### 3.6 — Hilos y ventana de 24h `[ ]`
- **Pasos:** hilo por canal; frontera de sesión por inactividad (≈24h); registrar `last_inbound_at`. La conversación de WhatsApp aparece en el historial web (etiqueta "WhatsApp").
- **Criterios de aceptación:** un hilo de WhatsApp se ve en la web; el sistema sabe si está dentro o fuera de la ventana de 24h.

---

## Fase 4 — Memoria de largo plazo (Zep/Graphiti)

> **Objetivo:** que Pepper acumule entendimiento por restaurante. Depende de Fase 1.

### 4.1 — Setup Zep + graph por restaurante `[ ]`
- **Pasos:** cuenta/proyecto Zep; un `graph` por `restaurant_id`. Definir variables de entorno y cliente.
- **Criterios de aceptación:** se puede crear/recuperar un graph por restaurante.
- **Mejores prácticas / costo:** free tier = 1,000 créditos/mes (sin rollover), salto a ~$125/mes (Flex). Vigilar consumo. Revisar residencia de datos (Cloud US vs BYOC) por el contexto PCI/pagos.

### 4.2 — Política de ingesta `[ ]`
- **Pasos:** ingestar SOLO: conclusiones/observaciones cualitativas, decisiones del dueño, objetivos, y **resultados de recomendaciones** ("probamos 2x1 en junio → +8% ticket"). **NUNCA métricas crudas** (D6).
- **Criterios de aceptación:** ningún episodio del grafo contiene volcados de ventas/transacciones diarias.

### 4.3 — Tools de memoria `[ ]`
- **Pasos:** `save_restaurant_memory(fact)` y `recall_restaurant_memory(query)` — o auto-inyectar top-N hechos relevantes en el system prompt (más simple si el volumen es chico).
- **Criterios de aceptación:** Pepper recuerda un hecho dicho en una sesión, en una sesión posterior y en otro canal.

### 4.4 — Cableado a los loops e higiene `[ ]`
- **Pasos:** definir qué escribe la memoria (decisiones/resultados) y qué la lee (razonamiento/briefing). Dedup de hechos contradictorios. **Tratar la memoria como dato, no como instrucción** (anti prompt-injection).
- **Criterios de aceptación:** un hecho recuperado no puede inyectar instrucciones al modelo.

---

## Fase 5 — Analítica determinística (motor de percepción)

> **Objetivo:** que patrones y comparativas se calculen en código, no con aritmética del LLM. Depende de Fase 0.

### 5.1 — Tool `compare_periods` `[ ]`
- **Pasos:** función que recibe dos rangos y devuelve deltas absolutos y % **ya calculados** (ventas, ticket, órdenes, por servicio). El LLM solo narra.
- **Criterios de aceptación:** los % de cambio que cita Pepper coinciden exactamente con el cálculo en código.

### 5.2 — Detección de anomalías/tendencias `[ ]`
- **Pasos:** funciones para "qué cambió" (top movers, caídas/subidas significativas >15%, días/servicios atípicos) sobre los datos transaccionales.
- **Criterios de aceptación:** dado un periodo, devuelve una lista priorizada de hallazgos. Alimenta la Fase 6.

### 5.3 — Verificar filtros de estado en analytics `[ ]`
- **Pasos:** revisar `getRevenueBreakdown` y RPCs para asegurar consistencia de filtrado por estado de transacción (pagado/reembolsado/pending).
- **Criterios de aceptación:** las dos vías de cálculo no se contradicen para el mismo periodo.

---

## Fase 6 — Proactividad (lo que lo hace "gerente")

> **Objetivo:** Pepper toma la iniciativa. Depende de Fases 3, 4 y 5.

### 6.1 — Infra de cron `[ ]`
- **Pasos:** scheduler (diario/semanal) por restaurante, respetando zona horaria (America/Mexico_City).
- **Criterios de aceptación:** un job corre a la hora configurada por restaurante.

### 6.2 — Generador de briefing `[ ]`
- **Pasos:** pipeline: percepción (Fase 5) → el agente resume con criterio → entrega. Por WhatsApp: **plantilla aprobada** corta ("📊 Resumen de hoy… *responde para el detalle*") que, al responder, abre la ventana de 24h para profundizar en formato libre.
- **Criterios de aceptación:** el dueño recibe un resumen útil sin haber escrito primero.

### 6.3 — Alertas de anomalía `[ ]`
- **Pasos:** disparar alertas cuando la Fase 5 detecta algo relevante, con cooldown para no spamear.
- **Criterios de aceptación:** una caída fuerte de ventas genera una alerta; ruido menor no.

### 6.4 — Reglas de entrega `[ ]`
- **Pasos:** opt-in, horas de silencio, gestión de plantillas (aprobación/resubmisión vía sent.dm), respeto de la ventana de 24h.
- **Criterios de aceptación:** no se envían mensajes fuera de reglas; todo outbound proactivo usa plantilla válida.

---

## Fase 7 — Agencia (acciones con aprobación)

> **Objetivo:** que Pepper actúe, no solo reporte. Depende de Fases 4 y 6.

### 7.1 — Tools de acción `[ ]`
- **Pasos:** reutilizar servicios existentes (`segmentsService`, campañas, menú/precios) para tools como `create_promotion`, `message_segment`, `adjust_price`.
- **Criterios de aceptación:** una acción ejecutada se refleja en el sistema real.

### 7.2 — Human-in-the-loop `[ ]`
- **Pasos:** toda acción mutante requiere **confirmación explícita** del usuario (especialmente por WhatsApp: "¿Confirmo lanzar la promo? Sí/No"). Registro de auditoría de quién aprobó.
- **Criterios de aceptación:** ninguna acción mutante ocurre sin confirmación registrada.

### 7.3 — Loop de seguimiento `[ ]`
- **Pasos:** registrar recomendación → medir resultado a los X días → reportar ("la promo que sugerí subió Y"). Persistir en memoria (Fase 4).
- **Criterios de aceptación:** Pepper hace seguimiento de al menos una recomendación propia con su resultado.

---

## Fase 8 — Hardening continuo (transversal)

- `[ ]` Rate limiting en endpoints del agente y webhook.
- `[ ]` Manejo de errores y retries (overloaded/529) consistente en ambos canales.
- `[ ]` Tests: unitarios del core/tools, integración del webhook, e2e de un flujo por canal.
- `[ ]` Monitoreo de costo (tokens Anthropic + créditos Zep + mensajes WhatsApp) y alertas de presupuesto.
- `[ ]` Polish UI: cablear o quitar botones `+`/micrófono; preguntas sugeridas en el empty state para subir adopción.
- `[ ]` Documentar runbook de operación (rotación de claves, plantillas WhatsApp, on-call).

---

## ❓ Decisiones pendientes

> Resolver con el usuario antes de que bloqueen un paso. Mover a "Decisiones tomadas" cuando se cierren.

- `[ ]` **DP1 — sent.dm inbound:** ¿soporta webhook two-way sobre número dedicado? Si no → proveedor de inbound alterno. *(Bloquea Fase 3.)*
- `[ ]` **DP2 — Desambiguación multi-restaurante en WhatsApp:** ¿restaurante default por número o Pepper pregunta? *(Bloquea 3.2.)*
- `[ ]` **DP3 — Modelo:** ¿Sonnet por default? *(Fase 0.4.)*
- `[ ]` **DP4 — Zep escala/residencia:** ¿free tier para piloto y luego Flex? ¿Cloud US aceptable o se requiere BYOC por PCI? *(Fase 4.)*
- `[x]` **DP5 — Auth backend (RESUELTO 2026-06-18):** Sí. El backend ya valida Clerk con `@clerk/clerk-sdk-node` vía `Authorization: Bearer` y el middleware `adminPortalAuth` (`src/middleware/clerkAdminPortalAuth.js`), usado en todas las rutas admin-portal (analytics, campaigns, segments, etc.). Config por proyecto en `clerkConfig.js` (`adminPortal` → `CLERK_SECRET_KEY_ADMIN_PORTAL`). Autorización por **ownership** (`restaurants.user_id = user_admin_portal.id`), no por tabla de membresías; helper reutilizado: `analyticsService.getUserRestaurants`. *(Desbloqueó y se aplicó en Fase 0.1.)*

---

## 📊 Estado actual

**Fase en curso:** **Fase 0 — Fundaciones y hardening** (🟨). 0.1 ✅ completado.
**Próximo paso sugerido:** **Fase 0.2 — Frontend envía credenciales** — el chat web (`app/pepper/page.tsx`) debe adjuntar el token de Clerk en el `fetch`. ⚠️ Debe ir junto a 0.1 antes de cualquier deploy: con 0.1 activo y sin 0.2, el chat web rompería con 401.

| Fase | Estado |
|------|--------|
| 0 — Fundaciones y hardening | 🟨 En curso (0.1 ✅) |
| 1 — Store persistente | ⬜ Pendiente |
| 2 — Core agnóstico de canal | ⬜ Pendiente |
| 3 — Canal WhatsApp | ⬜ Pendiente |
| 4 — Memoria de largo plazo | ⬜ Pendiente |
| 5 — Analítica determinística | ⬜ Pendiente |
| 6 — Proactividad | ⬜ Pendiente |
| 7 — Agencia | ⬜ Pendiente |
| 8 — Hardening continuo | ⬜ Pendiente |

Leyenda: ⬜ Pendiente · 🟨 En curso · ✅ Completada

---

## 📝 Changelog

> Una línea por avance. Formato: `AAAA-MM-DD — <fase.paso> — qué se hizo`.

- 2026-06-18 — Plan maestro creado. Definidas visión, arquitectura objetivo, decisiones D1–D9, estado actual y fases 0–8.
- 2026-06-18 — infra — Rama `feat/pepper-gerente-digital` creada en admin-portal y xquisito-backend; WIP previo de Pepper commiteado como baseline y rebaseado sobre `origin/main` (sin perder el fix de seguridad `multer 2.2.0`). `.env` agregado al `.gitignore` de admin-portal.
- 2026-06-18 — DP5 — Resuelto: el backend ya valida Clerk vía `adminPortalAuth` (`Authorization: Bearer`); autorización por ownership (`restaurants.user_id`), helper `getUserRestaurants`.
- 2026-06-18 — 0.1 — Auth + authz en `/api/ai-agent`: `adminPortalAuth` + `authorizeRestaurant` (valida `restaurant_id` contra restaurantes del usuario). `restaurant_id`/`user_id` ahora server-side (cierra el IDOR); `parseContext` solo como hint. 401 sin/con token inválido verificado en runtime; 403 cross-restaurante y `restaurant_id` server-side verificados por código (faltan probar E2E con token real, junto a 0.2).
