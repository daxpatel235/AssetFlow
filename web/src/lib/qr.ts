import QRCode from 'qrcode';

/**
 * Generates a static JSON payload for a QR code.
 * Asset tags are printed on physical stickers, so they cannot expire.
 * @param tag The asset tag or identifier.
 */
export function generateSecureQRPayload(tag: string): string {
  const payload = {
    t: tag,
    // Static payload for physical asset labels
  };
  return JSON.stringify(payload);
}

/**
 * Validates a static QR payload.
 */
export function validateSecureQRPayload(payloadStr: string): { valid: boolean; tag?: string; error?: string } {
  try {
    const payload = JSON.parse(payloadStr);
    if (!payload.t) return { valid: false, error: 'Invalid payload format' };
    return { valid: true, tag: payload.t };
  } catch (err) {
    return { valid: false, error: 'Malformed QR data' };
  }
}

/**
 * Generates an SVG string representation of the QR code containing the secure payload.
 */
export async function generateQRSvgString(payloadStr: string): Promise<string> {
  return QRCode.toString(payloadStr, {
    type: 'svg',
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    },
    margin: 1,
    width: 512
  });
}
