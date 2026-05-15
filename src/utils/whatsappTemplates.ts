/**
 * WhatsApp Template Interface
 */
export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: "marketing" | "utility";
  language: string;
  status: "approved" | "pending" | "rejected";
  header?: {
    type: "text" | "image";
    text?: string;
    variables?: string[];
  };
  body: {
    text: string;
    variables: string[];
  };
  footer?: string;
  buttons?: Array<{
    type: "url" | "phone" | "quick_reply";
    text: string;
    url?: string;
    phone?: string;
  }>;
  estimatedCost: string;
  description: string;
  selectedVariables?: Record<string, string>; // Variables seleccionadas por el usuario
}

/**
 * Templates pre-aprobados para WhatsApp Business API
 * Estos templates están configurados y aprobados para envío masivo
 */
export const PRE_APPROVED_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "promo_general",
    name: "Promoción General",
    category: "marketing",
    language: "es_MX",
    status: "approved",
    header: {
      type: "image",
      variables: ["image_url"],
    },
    body: {
      text: "Hola, ¡tenemos una oferta especial para ti! 🎉\n\nDisfruta de {{1}}% de descuento en {{2}}.\n\nUsa el código: *{{3}}*",
      variables: ["discount", "product_name", "codigo"],
    },
    buttons: [
      { type: "url", text: "Ver menú", url: "https://letseven.io/menu" },
    ],
    estimatedCost: "~$0.005 USD",
    description: "Template versátil para promociones generales con descuento",
  },
  {
    id: "recuperacion_clientes",
    name: "Recuperación de Clientes",
    category: "marketing",
    language: "es_MX",
    status: "approved",
    header: {
      type: "text",
      text: "¡Te extrañamos! 💙",
      variables: [],
    },
    body: {
      text: "Hola,\n\nHace {{1}} que no te vemos y queremos que regreses.\n\nTe regalamos *{{2}}% de descuento* en tu próxima visita.\n\nCódigo: *{{3}}*",
      variables: ["days_inactive", "discount", "codigo"],
    },
    estimatedCost: "~$0.005 USD",
    description: "Reactivar clientes inactivos con incentivo",
  },
  {
    id: "ultima_llamada",
    name: "Última Llamada / Urgencia",
    category: "marketing",
    language: "es_MX",
    status: "approved",
    header: {
      type: "text",
      text: "⏰ ¡ÚLTIMA OPORTUNIDAD!",
      variables: [],
    },
    body: {
      text: "Hola, tu oferta de *{{1}}* está por expirar.\n\nCódigo: *{{4}}*\n\n¡No te quedes sin tu beneficio!",
      variables: ["offer_name", "discount", "codigo"],
    },
    buttons: [
      { type: "url", text: "Canjear ahora", url: "https://letseven.io/redeem" },
    ],
    estimatedCost: "~$0.005 USD",
    description: "Crear urgencia para ofertas próximas a expirar",
  },
  {
    id: "cumpleanos",
    name: "Cumpleaños",
    category: "marketing",
    language: "es_MX",
    status: "approved",
    header: {
      type: "image",
      variables: ["birthday_image"],
    },
    body: {
      text: "🎂 ¡FELIZ CUMPLEAÑOS! 🎉\n\nQueremos celebrar contigo este día especial.\n\nTe regalamos {{1}}% de descuento.\n\nCódigo: *{{2}}*",
      variables: ["discount", "codigo"],
    },
    estimatedCost: "~$0.005 USD",
    description: "Felicitación de cumpleaños con regalo especial",
  },
  {
    id: "recomendacion_personalizada",
    name: "Recomendación Personalizada",
    category: "marketing",
    language: "es_MX",
    status: "approved",
    header: {
      type: "image",
      variables: ["recommended_dish_image"],
    },
    body: {
      text: "Hola, basado en tus gustos, creemos que te encantará:\n\n🍽️ *{{1}}*\n\n💫 Especial para ti: {{2}}% OFF\n\nCódigo: *{{3}}*",
      variables: ["dish_name", "discount", "codigo"],
    },
    buttons: [
      { type: "url", text: "Ordenar ahora", url: "https://letseven.io/order" },
    ],
    estimatedCost: "~$0.005 USD",
    description: "Recomendación basada en historial del cliente",
  },
];

/**
 * Encuentra un template por su ID
 */
export function getTemplateById(
  templateId: string,
): WhatsAppTemplate | undefined {
  return PRE_APPROVED_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Extrae la URL de la imagen del header de un template de WhatsApp
 */
export function extractImageFromWhatsAppTemplate(
  variables?: Record<string, string>,
): string | null {
  if (!variables) return null;

  // Buscar en las variables comunes para imágenes
  return (
    variables.image_url ||
    variables.birthday_image ||
    variables.recommended_dish_image ||
    null
  );
}

/**
 * Convierte un template de WhatsApp a formato de texto plano
 * para guardarlo en custom_variables
 */
export function whatsAppTemplateToText(
  template: WhatsAppTemplate,
  variables?: Record<string, string>,
): string {
  let text = "";

  // Header
  if (template.header) {
    if (template.header.type === "text" && template.header.text) {
      text += template.header.text + "\n\n";
    } else if (template.header.type === "image") {
      text += "[IMAGEN]\n\n";
    }
  }

  // Body
  let bodyText = template.body.text;

  // Replace variables if provided
  if (variables) {
    template.body.variables.forEach((varName, index) => {
      const placeholder = `{{${index + 1}}}`;
      const value = variables[varName] || placeholder;
      bodyText = bodyText.replace(placeholder, value);
    });
  }

  text += bodyText;

  // Footer
  if (template.footer) {
    text += "\n\n" + template.footer;
  }

  // Buttons
  if (template.buttons && template.buttons.length > 0) {
    text += "\n\n---\n";
    template.buttons.forEach((button) => {
      if (button.type === "url") {
        text += `🔗 ${button.text}: ${button.url}\n`;
      } else if (button.type === "phone") {
        text += `📞 ${button.text}: ${button.phone}\n`;
      } else {
        text += `• ${button.text}\n`;
      }
    });
  }

  return text;
}
