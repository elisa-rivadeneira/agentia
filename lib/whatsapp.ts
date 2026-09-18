const GRAPH_API_BASE_URL = "https://graph.facebook.com";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

/**
 * Envía un mensaje de texto de WhatsApp usando la Graph API de Meta.
 * Requiere WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID y WHATSAPP_API_VERSION
 * configuradas como variables de entorno.
 */
export async function sendWhatsAppTextMessage(
  to: string,
  body: string
): Promise<void> {
  const token = getEnv("WHATSAPP_TOKEN");
  const phoneNumberId = getEnv("WHATSAPP_PHONE_NUMBER_ID");
  const apiVersion = getEnv("WHATSAPP_API_VERSION");

  const url = `${GRAPH_API_BASE_URL}/${apiVersion}/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `[whatsapp] Error al enviar mensaje a ${to}: ${response.status} ${errorText}`
    );
    return;
  }

  console.log(`[whatsapp] Mensaje enviado a ${to}`);
}
