import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// How much clock drift/delivery latency we tolerate between the timestamp
// Paddle signs and the moment we verify it. Paddle's own SDKs default to a
// tight 5 seconds; we're more lenient (5 minutes) since webhook delivery
// over the public internet can legitimately take longer than that, and the
// HMAC secret itself (not the timestamp window) is what actually prevents
// forged requests — the timestamp check only narrows a replay-attack
// window, so a wider window is a reasonable trade for fewer false rejections.
const MAX_TIMESTAMP_DRIFT_SECONDS = 300;

/**
 * Verifies a Paddle Billing webhook per
 * https://developer.paddle.com/webhooks/about/signature-verification/
 *
 * IMPORTANT: `rawBody` must be the exact, untouched request body text (not
 * JSON.parse'd and re-stringified) — the signature is computed over the
 * literal bytes Paddle sent, so any reformatting breaks verification.
 */
export function verifyPaddleWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): { valid: boolean; reason?: string } {
  if (!signatureHeader) return { valid: false, reason: "missing Paddle-Signature header" };
  if (!secret) return { valid: false, reason: "PADDLE_WEBHOOK_SECRET is not configured" };

  const parts = Object.fromEntries(
    signatureHeader.split(";").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim(), value?.trim()];
    })
  );
  const timestamp = parts.ts;
  const signature = parts.h1;
  if (!timestamp || !signature) {
    return { valid: false, reason: "malformed Paddle-Signature header" };
  }

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    return { valid: false, reason: "malformed timestamp" };
  }
  const driftSeconds = Math.abs(Date.now() / 1000 - timestampSeconds);
  if (driftSeconds > MAX_TIMESTAMP_DRIFT_SECONDS) {
    return { valid: false, reason: "timestamp outside allowed window (possible replay)" };
  }

  const signedPayload = `${timestamp}:${rawBody}`;
  const expected = createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const actualBuf = Buffer.from(signature, "hex");
  // timingSafeEqual throws on mismatched lengths rather than returning
  // false, so check that first.
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    return { valid: false, reason: "signature mismatch" };
  }

  return { valid: true };
}
