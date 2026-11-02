import { pulseConfig } from "@/config/site.config";
import { PulseApiError, type PulseEnvelope, type PulseErrorPayload } from "./types";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface PulseRequestOptions {
  method?: Method;
  body?: unknown;
  /** Participant access token, if the endpoint requires auth (only
   * reachable once a token comes from somewhere — there's no login on
   * this site; participant auth lives in a separate Pulse app). */
  token?: string;
  /** Site locale ("pt"/"en"/"fr") — sent as `Accept-Language` so
   * backend's translated error messages (`payload.message`, via
   * fastify-i18n) come back in the right language when possible. Pulse
   * only has pt/en locale files; fr silently falls back to pt. */
  locale?: string;
  /** Forwarded to fetch — useful for Next.js caching/revalidation on the server. */
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
  signal?: AbortSignal;
}

async function rawFetch(
  path: string,
  method: Method,
  body: unknown,
  token: string | undefined,
  locale: string | undefined,
  extra: Pick<PulseRequestOptions, "cache" | "next" | "signal">,
) {
  return fetch(`${pulseConfig.apiUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(locale ? { "Accept-Language": locale } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...extra,
  });
}

async function unwrap<T>(res: Response): Promise<T> {
  let envelope: PulseEnvelope<T> | undefined;
  try {
    envelope = (await res.json()) as PulseEnvelope<T>;
  } catch {
    // No JSON body (e.g. network-level failure surfaced as a bad response).
  }

  if (!res.ok || !envelope || !envelope.success) {
    // On error, `payload` is `{message, errors?}` rather than `T` — see
    // PulseErrorPayload. Read defensively since a malformed/empty body
    // is still possible (e.g. a proxy-level 502 with no JSON at all).
    const errorPayload = envelope?.payload as PulseErrorPayload | undefined;
    throw new PulseApiError(
      envelope?.code ?? String(res.status),
      res.status,
      errorPayload?.message,
    );
  }

  return envelope.payload;
}

/**
 * Thin wrapper around fetch for the Pulse API (`/api/v1` prefix, baked into
 * NEXT_PUBLIC_API_URL). Unwraps the `{code, success, payload}` envelope,
 * attaches the Bearer token when given, and forwards `locale` as
 * `Accept-Language` so error text comes back translated.
 *
 * Errors are `PulseApiError` — `.message` is safe to show directly (it's
 * the backend's own translated text when present), `.code` is for
 * logs/branching (stable across locales).
 */
export async function pulse<T>(
  path: string,
  options: PulseRequestOptions = {},
): Promise<T> {
  const { method = "GET", body, token, locale, ...extra } = options;
  const res = await rawFetch(path, method, body, token, locale, extra);
  return unwrap<T>(res);
}
