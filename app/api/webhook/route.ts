import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp";
import { validarDisponibilidad, type ItemPedido } from "@/lib/stock";

interface OrderProductItem {
  product_retailer_id?: string;
  quantity?: number;
  item_price?: number;
  currency?: string;
}

// Forma esperada del payload de WhatsApp Cloud API para mensajes entrantes.
// Ver: entry[0].changes[0].value.messages[0]
interface WhatsAppWebhookPayload {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: {
          display_phone_number?: string;
          phone_number_id?: string;
        };
        messages?: Array<{
          from?: string;
          id?: string;
          timestamp?: string;
          type?: string;
          text?: { body?: string };
          order?: {
            catalog_id?: string;
            product_items?: OrderProductItem[];
          };
        }>;
      };
    }>;
  }>;
}

// Valida la disponibilidad de los productos del carrito antes de continuar
// con el flujo del pedido.
async function handleOrder(
  from: string,
  productItems: OrderProductItem[]
) {
  const items: ItemPedido[] = productItems.flatMap((i) =>
    i.product_retailer_id && i.quantity && i.quantity > 0
      ? [{ product_retailer_id: i.product_retailer_id, quantity: i.quantity }]
      : []
  );

  if (items.length === 0) {
    console.warn("[webhook] Pedido sin items válidos");
    return;
  }

  const noDisponibles = await validarDisponibilidad(items);

  if (noDisponibles.length > 0) {
    const lista = noDisponibles.map((p) => `• ${p.nombre}`).join("\n");
    await sendWhatsAppTextMessage(
      from,
      `Lo sentimos, estos productos no están disponibles hoy:\n${lista}\n\nPor favor ajusta tu pedido y vuelve a enviarlo.`
    );
    return;
  }

  // TODO (Fase 2): continuar el flujo -> recojo/delivery, Yape, avisar al dueño.
  console.log(`[webhook] Pedido de ${from} validado: hay disponibilidad`);
}

// GET: verificación del webhook exigida por Meta al configurarlo.
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token && token === verifyToken) {
    console.log("[webhook] Verificación exitosa");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[webhook] Verificación fallida: token no coincide o falta");
  return new NextResponse("Forbidden", { status: 403 });
}

// POST: recepción de mensajes entrantes. Responde 200 de inmediato
// y procesa/envía la respuesta de forma asíncrona con after().
export async function POST(request: NextRequest) {
  let payload: WhatsAppWebhookPayload;

  try {
    payload = await request.json();
  } catch (error) {
    console.error("[webhook] No se pudo parsear el body como JSON:", error);
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (!message) {
    console.log(
      "[webhook] Notificación recibida sin mensajes (probablemente un status update)"
    );
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  const from = message.from ?? "desconocido";
  const type = message.type ?? "desconocido";
  const text = message.text?.body;

  console.log(
    `[webhook] Mensaje entrante -> de: ${from} | tipo: ${type} | contenido: ${
      text ?? "(sin texto)"
    }`
  );

  after(async () => {
    try {
      if (type === "order") {
        await handleOrder(from, message.order?.product_items ?? []);
      } else if (type === "text" && text) {
        await sendWhatsAppTextMessage(from, `Recibí tu mensaje: ${text}`);
      } else {
        console.log(
          `[webhook] Tipo de mensaje "${type}" no soportado para eco automático`
        );
      }
    } catch (error) {
      console.error("[webhook] Error procesando el mensaje entrante:", error);
    }
  });

  return NextResponse.json({ status: "received" }, { status: 200 });
}
