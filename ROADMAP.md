# Roadmap — Bot de WhatsApp para restaurante (SmartChatix)

## Fase 1 — Webhook + eco básico ✅ COMPLETADA
- App de Meta creada y publicada ("SmartChatix AgentIA")
- Webhook en Next.js/Vercel: recibe y verifica correctamente
- Responde con eco a mensajes de texto
- Confirmado funcionando end-to-end con número de prueba de WhatsApp
- Confirmado (vía curl simulado) que el webhook recibe y reconoce
  correctamente payloads tipo "order" del catálogo de WhatsApp

## Fase 2 — Recibir pedidos del catálogo + flujo conversacional (single-tenant, con BD) — EN CURSO
*Objetivo:* flujo real de negocio, para un solo cliente (shawarma), con datos guardados.
- Setup de Supabase (Postgres)
- Tablas: pedidos, pedido_items, productos
- Procesar el evento order que llega cuando el cliente arma su carrito
- Flujo conversacional corto: recojo/delivery → pedir Yape → notificar al
  dueño (número fijo por ahora) → confirmar
- Guardar cada pedido en la base de datos con su estado
- Sin multi-tenant todavía, sin plantillas aprobadas todavía (toda la
  conversación ocurre dentro de la ventana de 24h)

## Fase 3 — Conexión real del cliente (Coexistence)
*Objetivo:* pasar del número de prueba al número real del shawarma, sin
romper nada de lo que el cliente ya tiene.
- Verificación de negocio del shawarma ante Meta (RUC, documentos legales)
- Activar WhatsApp Coexistence con su número actual (así el dueño no
  pierde su número ni su historial de chats, y puede seguir atendiendo
  manualmente desde la app mientras el bot atiende vía API)
- Confirmar que el catálogo real del shawarma (ya existente en su
  WhatsApp Business App) siga funcionando tras la migración
- Crear y enviar a aprobación las plantillas de mensaje necesarias
  (confirmación de pedido, notificación al dueño) — obligatorio para
  mensajes iniciados fuera de la ventana de 24h
- Nota: a partir del 1 de octubre de 2026, Meta cobra por mensajes de
  servicio (con 1,000 gratis/mes por número) — tener en cuenta en el
  diseño del flujo para minimizar mensajes innecesarios por pedido

## Fase 4 — Multi-tenant real
*Objetivo:* preparar el sistema para más de un negocio, ya con el
shawarma en producción.
- Agregar tenant_id a todas las tablas (pedidos, productos, etc.)
- Lógica para identificar qué tenant corresponde a cada mensaje entrante
  (por phone_number_id / WABA ID)
- Refactor del webhook y la lógica conversacional para ser genéricos,
  no hardcodeados al shawarma
- Cada tenant tiene su propio WABA, número, catálogo y configuración

## Fase 5 — Panel de administración
*Objetivo:* que el dueño gestione su negocio sin intervención directa
de SmartChatix.
- Login (Supabase Auth)
- CRUD de configuración del bot por tenant (disponibilidad, reglas,
  horarios) — el catálogo visual sigue viviendo en Meta Commerce Manager
- Vista de pedidos + verificación manual de Yape
- Vista de consumo de mensajes de servicio de Meta (para que el dueño
  vea su gasto estimado)

## Fase 6 — Productización (futuro, no inmediato)
- Proceso de Tech Provider / App Review de Meta (necesario para que
  otros negocios externos se conecten sin que SmartChatix los onboardee
  manualmente uno por uno)
- Flujo de Embedded Signup self-service para nuevos negocios
- Facturación por tenant

## Contexto técnico y de negocio relevante
- Stack: Next.js (App Router, TypeScript) en Vercel, Supabase (Postgres)
- El cliente (shawarma) paga a Meta directamente + una mensualidad fija
  a SmartChatix (aprox. S/120/mes) — margen ajustado con 1 solo cliente,
  el modelo se vuelve rentable con volumen (~5 clientes)
- Vercel Hobby (gratis) se usa en desarrollo; para producción comercial
  real se evaluará pasar a Pro o migrar a VPS propio
- Meta App ID: 2384570269044734 | WABA de prueba: 4079305112202919
- Catálogo de prueba creado: "Catálogo_Productos" (ID: 2698294963920712)
