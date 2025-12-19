/**
 * Utilidades para trabajar con templates de SMS
 */

export interface SmsBlock {
  id: string;
  type: 'title' | 'text' | 'image' | 'button' | 'separator' | 'promo_code' | 'discount';
  content: string;
  locked?: boolean;
}

/**
 * Convierte los blocks de un template SMS a texto plano renderizado
 * Incluye el código promocional y descuento si están presentes
 */
export function renderSmsTemplateToText(
  blocks: SmsBlock[],
  campaignName?: string,
  promoCode?: string,
  discountPercentage?: string
): string {
  let text = "";

  blocks.forEach((block, index) => {
    switch (block.type) {
      case 'title':
        text += `${block.content.toUpperCase()}\n\n`;
        break;

      case 'text':
        text += `${block.content}\n\n`;
        break;

      case 'promo_code':
        if (block.content) {
          text += `Código de promoción: ${block.content}\n\n`;
        }
        break;

      case 'discount':
        if (block.content) {
          text += `${block.content}% de descuento\n\n`;
        }
        break;

      case 'separator':
        text += `---\n\n`;
        break;

      case 'button':
        text += `▶️ ${block.content}\n\n`;
        break;

      case 'image':
        // Las imágenes se envían como MMS adjunto (mediaUrl), no en el texto
        // Por lo tanto, se omiten del mensaje de texto para evitar mostrar URLs largas
        break;

      default:
        text += `${block.content}\n\n`;
    }
  });

  // Agregar información adicional si está disponible
  if (promoCode && !blocks.some(b => b.type === 'promo_code')) {
    text += `Código de promoción: ${promoCode}\n\n`;
  }

  if (discountPercentage && !blocks.some(b => b.type === 'discount')) {
    text += `${discountPercentage}% de descuento\n\n`;
  }

  return text.trim();
}

/**
 * Extrae la primera URL de imagen de los blocks
 */
export function extractImageFromBlocks(blocks: SmsBlock[]): string | null {
  const imageBlock = blocks.find(block => block.type === 'image' && block.content);
  return imageBlock?.content || null;
}

/**
 * Cuenta cuántos blocks de cada tipo hay en el template
 */
export function getBlockStats(blocks: SmsBlock[]): Record<string, number> {
  const stats: Record<string, number> = {};

  blocks.forEach(block => {
    stats[block.type] = (stats[block.type] || 0) + 1;
  });

  return stats;
}
