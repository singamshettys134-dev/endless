import crypto from 'node:crypto';
import { appConfig } from './config.js';

const base64UrlEncode = (value) => Buffer.from(value).toString('base64url');
const base64UrlDecode = (value) => Buffer.from(value, 'base64url').toString('utf8');

function signPayload(payloadObject) {
  const payload = JSON.stringify(payloadObject);
  const signature = crypto
    .createHmac('sha256', appConfig.secret)
    .update(payload)
    .digest('base64url');
  return { payload, signature };
}

export function encodeCursor({ sid, offset, feedVersion, lastScore, issuedAt = Date.now() }) {
  const payload = { sid, offset, feedVersion, lastScore, issuedAt };
  const { payload: serializedPayload, signature } = signPayload(payload);
  return `${base64UrlEncode(serializedPayload)}.${signature}`;
}

export function decodeCursor(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'missing' };
  }

  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) {
    return { valid: false, reason: 'malformed' };
  }

  try {
    const expected = crypto
      .createHmac('sha256', appConfig.secret)
      .update(base64UrlDecode(payloadPart))
      .digest('base64url');

    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signaturePart);

    if (expectedBuffer.length !== signatureBuffer.length) {
      return { valid: false, reason: 'tampered' };
    }

    if (crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      const payload = JSON.parse(base64UrlDecode(payloadPart));
      const age = Date.now() - Number(payload.issuedAt || 0);
      if (age > appConfig.cursorTtlMs) {
        return { valid: false, reason: 'expired', payload };
      }
      return { valid: true, payload };
    }
  } catch {
    return { valid: false, reason: 'tampered' };
  }

  return { valid: false, reason: 'tampered' };
}

export function buildNextCursor({ sid, offset, feedVersion, lastScore }) {
  return encodeCursor({ sid, offset, feedVersion, lastScore, issuedAt: Date.now() });
}
