# Estado del proyecto — SmartChatix (bot de WhatsApp)

**Última actualización:** 2026-10-01
**Situación:** proyecto en pausa hasta que el cliente (shawarma) realice su primer abono.
Cuando lo haga, enviará sus conversaciones y material para empezar el chatbot.
El roadmap completo de fases está en `ROADMAP.md`.

## Hecho

### Fase 1 — Webhook + eco ✅ (commit 6464500)
- `app/api/webhook/route.ts`: GET de verificación y POST con eco vía `after()`.
- `lib/whatsapp.ts`: envío de mensajes de texto por Graph API.
- Probado de punta a punta con WhatsApp real (solo el eco).

### Fase 2 (parcial) — escrito, compila y pasa lint, **sin commitear y sin probar contra Supabase**
- **Panel de stock `/stock`** (`app/stock/`, `lib/stock-auth.ts`):
  - Acceso con contraseña única (`STOCK_PANEL_PASSWORD`), cookie httpOnly con HMAC.
  - Lista de productos por categoría; stock editable (vacío = sin límite) y toggle Disponible / Sin stock.
  - Diseño para celular: botones grandes, una columna, botón de guardar fijo abajo.
- **Validación de disponibilidad al recibir un pedido** (`lib/stock.ts`, `handleOrder` en el webhook):
  - `disponible = false` → rechaza; `stock` NULL → acepta; `stock` no nulo → acepta solo si `stock >= cantidad`.
  - Suma cantidades si un producto aparece en varias líneas; un producto que no existe en la tabla se trata como no disponible.
  - Si algo no está disponible, el bot lista los productos y pide ajustar el pedido.
  - Si todo está disponible, solo registra un log (el resto del flujo no existe aún).
- **Supabase:** `lib/supabase.ts` (cliente de servidor con service role) y `supabase/schema.sql` (tabla `productos` propuesta).
- Dependencia instalada: `@supabase/supabase-js`. Variables nuevas en `.env.example`.
- Archivos sin commitear: `ROADMAP.md`, `ESTADO.md`, `app/stock/`, `lib/stock*.ts`, `lib/supabase.ts`, `supabase/`, cambios en `route.ts`, `package.json`, `package-lock.json`, `.env.example`.

## Decisiones tomadas
- **Los precios viven en la BD** (`productos.precio`), no se toman del payload del pedido, porque el cliente a veces no usa el catálogo y pide por conversación.
- **El catálogo de Meta es la fuente de verdad** de productos, nombres y precios. El dueño los edita solo allí.
- **El panel web solo edita `stock` y `disponible`.** Nunca precios ni la lista de productos.
- **Sincronización unidireccional Meta → BD** (Graph API, ID de catálogo en variable de entorno), con un botón "Actualizar desde el catálogo" en el panel:
  - crea productos nuevos con stock vacío y disponible;
  - actualiza nombre y precio de los existentes;
  - nunca pisa `stock` ni `disponible`;
  - si un producto desaparece del catálogo, lo marca como no disponible (no lo borra).
- **Los dos caminos de pedido (catálogo y conversación)** terminan en un pedido en borrador común: items con `producto_id`, cantidad y `precio_unitario` desde la BD. Luego: validar stock → recojo/delivery → total → Yape → avisar al dueño.
- El bot debe repetir el resumen y el total y esperar confirmación del cliente antes de pasar al pago.
- No se descuenta stock al aceptar un pedido (no se pidió).

## Falta por hacer

### Fase 2 (siguiente al reanudar)
- [ ] Crear el proyecto de Supabase, ejecutar `supabase/schema.sql` y rellenar `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `STOCK_PANEL_PASSWORD` en `.env.local` y en Vercel.
- [ ] Agregar `precio` a `productos` en `schema.sql`.
- [ ] Sincronización con el catálogo de Meta + botón en `/stock`. Pendiente confirmar permisos del token y si el catálogo trae un campo usable como categoría.
- [ ] Tablas `pedidos`, `pedido_items` (con `precio_unitario` y `moneda`) y estado de conversación / pedido en borrador.
- [ ] Flujo conversacional: recojo o delivery → total → pedir Yape → notificar al dueño (número fijo) → confirmar.
- [ ] Pedido conversacional sin catálogo: módulo de IA que convierta texto libre en items del menú, con confirmación del resumen. Hoy el repo no tiene IA.
- [ ] Probar el panel `/stock` en un celular real y la validación con un pedido simulado.
- [ ] Commitear lo escrito hasta ahora.

### Seguridad y robustez del webhook
- [ ] Validar la firma `X-Hub-Signature-256` (HMAC-SHA256 del cuerpo crudo con un nuevo `WHATSAPP_APP_SECRET`, comparación en tiempo constante, 401 si no coincide). Hacerlo antes de cobrar pedidos reales.
- [ ] Deduplicar por `message.id` (Meta reintenta entregas).
- [ ] Manejar mensajes que no son texto (imágenes, audios, ubicación).
- [ ] Límite de intentos de contraseña en `/stock` (hoy solo hay una pausa de 0,8 s al fallar).

### Materiales del cliente (al recibir el primer abono)
- [ ] Sus conversaciones reales con clientes: para ver cómo piden y diseñar el flujo y el módulo de IA.
- [ ] Catálogo: o acceso compartido a su catálogo de Meta (portafolio de negocio como socio con permiso de lectura), o la lista de productos con nombre, precio y categoría.
- [ ] Número del dueño para las notificaciones de pedido.
- [ ] Datos de Yape para el cobro.

### Fases posteriores (ver `ROADMAP.md`)
- Fase 3: Coexistence con el número real del shawarma, verificación de negocio, plantillas aprobadas. **Confirmar si Coexistence está disponible en Perú** antes de comprar un chip de prueba. El chip debe ser prepago, limpio y registrable en la app WhatsApp Business (no un número virtual).
- Fase 4: multi-tenant. Fase 5: panel de administración completo. Fase 6: productización.

## Notas
- El enlace público del catálogo de Kimobela (`wa.me/c/84778644693222`) no se pudo leer desde aquí (404). Para sincronizar con la API haría falta que su dueño comparta el catálogo con nuestro portafolio, con autorización explícita.
- Para desarrollar no hace falta un número real: sirven el número de prueba de Meta, la WABA de prueba y `Catálogo_Productos`.
- Los IDs de Meta están en `ROADMAP.md`; si el repo llega a ser público, quitarlos.
