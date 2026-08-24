import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

/**
 * Structured logging, without a dependency.
 *
 * One line of JSON per event, because the thing that reads production logs is
 * a machine — `grep '"level":"error"'` and every aggregator worth using can
 * both work with this, while a formatted sentence needs parsing rules nobody
 * maintains. In development the same event is printed for a human instead.
 *
 * Swapping this for pino or bunyan later is a matter of reimplementing `emit`;
 * nothing else in the app touches the shape.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const threshold =
  LEVEL_ORDER[(process.env.LOG_LEVEL as LogLevel) ?? "info"] ?? LEVEL_ORDER.info;

const isProduction = process.env.NODE_ENV === "production";

/** Carries the request id down the call stack without threading it through. */
const context = new AsyncLocalStorage<{ requestId: string; userId?: number }>();

export function withRequestContext<T>(
  fn: () => T,
  seed: { requestId?: string; userId?: number } = {},
): T {
  return context.run({ requestId: seed.requestId ?? randomUUID(), userId: seed.userId }, fn);
}

export function currentRequestId() {
  return context.getStore()?.requestId;
}

/** Attaches the signed-in user to everything logged later in this request. */
export function tagUser(userId: number) {
  const store = context.getStore();
  if (store) store.userId = userId;
}

type Fields = Record<string, unknown>;

/**
 * Errors do not survive `JSON.stringify` — name, message and stack are all
 * non-enumerable — so they are unpacked by hand.
 */
function serialiseError(error: unknown): Fields {
  if (error instanceof Error) {
    return {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error.cause ? { cause: serialiseError(error.cause).error } : {}),
      },
    };
  }
  return { error: { name: "NonError", message: String(error) } };
}

function emit(level: LogLevel, message: string, fields: Fields = {}) {
  if (LEVEL_ORDER[level] < threshold) return;

  const store = context.getStore();
  const event = {
    level,
    time: new Date().toISOString(),
    message,
    ...(store?.requestId ? { requestId: store.requestId } : {}),
    ...(store?.userId ? { userId: store.userId } : {}),
    ...fields,
  };

  const line = isProduction
    ? JSON.stringify(event)
    : `${level.toUpperCase().padEnd(5)} ${message}${
        Object.keys(fields).length ? ` ${JSON.stringify(fields)}` : ""
      }`;

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, fields?: Fields) => emit("debug", message, fields),
  info: (message: string, fields?: Fields) => emit("info", message, fields),
  warn: (message: string, fields?: Fields) => emit("warn", message, fields),
  error: (message: string, error?: unknown, fields?: Fields) =>
    emit("error", message, { ...fields, ...(error === undefined ? {} : serialiseError(error)) }),
};

/**
 * Where an exception leaves the app for whatever watches it in production.
 *
 * Kept as its own function so wiring Sentry — or any other reporter — is a
 * single edit here rather than a search through every catch block:
 *
 *   import * as Sentry from "@sentry/nextjs";
 *   Sentry.captureException(error, { tags: { requestId: currentRequestId() } });
 */
export function reportError(message: string, error: unknown, fields?: Fields) {
  logger.error(message, error, fields);
}
