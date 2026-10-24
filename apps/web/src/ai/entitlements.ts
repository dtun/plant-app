import { z } from "zod";

export type EntitlementVerdict = "entitled" | "not-entitled" | "network" | "error";

export interface EntitlementVerifier {
  verify(appUserId: string): Promise<EntitlementVerdict>;
}

const REVENUECAT_SUBSCRIBERS_URL = "https://api.revenuecat.com/v1/subscribers";
const VERIFY_TIMEOUT_MS = 5000;

const subscriberResponseSchema = z.object({
  subscriber: z.object({
    entitlements: z.object({
      pro: z.object({ expires_date: z.string().datetime({ offset: true }).nullable() }).optional(),
    }),
  }),
});

export interface RevenueCatVerifierOptions {
  secretKey: string;
  fetch?: typeof fetch;
}

export function createRevenueCatVerifier(options: RevenueCatVerifierOptions): EntitlementVerifier {
  let doFetch = options.fetch ?? fetch;

  async function verify(appUserId: string): Promise<EntitlementVerdict> {
    let response: Response;
    try {
      response = await doFetch(`${REVENUECAT_SUBSCRIBERS_URL}/${encodeURIComponent(appUserId)}`, {
        headers: { Authorization: `Bearer ${options.secretKey}`, Accept: "application/json" },
        signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      });
    } catch {
      return "network";
    }

    if (response.status >= 500) {
      return "network";
    }
    // A 401 here is our own secret key being wrong, so it is an error rather than a refusal.
    if (!response.ok) {
      return "error";
    }

    let parsed = subscriberResponseSchema.safeParse(await response.json().catch(() => null));
    if (!parsed.success) {
      return "error";
    }

    let pro = parsed.data.subscriber.entitlements.pro;
    if (!pro) {
      return "not-entitled";
    }
    // A null expiry is a lifetime unlock.
    if (pro.expires_date === null || Date.parse(pro.expires_date) > Date.now()) {
      return "entitled";
    }
    return "not-entitled";
  }

  return { verify };
}
