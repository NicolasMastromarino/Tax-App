"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";

let paddlePromise: Promise<Paddle | undefined> | null = null;

/**
 * Lazily loads and initializes Paddle.js exactly once per page session,
 * regardless of how many components call this. Reads the public client
 * token and environment ("sandbox" while testing, "production" once live)
 * from env — both are safe to expose to the browser (NEXT_PUBLIC_*).
 */
export function getPaddle(): Promise<Paddle | undefined> {
  if (!paddlePromise) {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const environment = process.env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox";
    if (!token) {
      console.error("[paddle] NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not set — checkout can't open.");
      paddlePromise = Promise.resolve(undefined);
    } else {
      paddlePromise = initializePaddle({ token, environment });
    }
  }
  return paddlePromise;
}
