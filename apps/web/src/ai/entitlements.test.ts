import { describe, expect, it } from "vitest";

import { createRevenueCatVerifier } from "./entitlements";

const DAY_MS = 24 * 60 * 60 * 1000;

function subscriberJson(entitlements: Record<string, { expires_date: string | null }>) {
  return Response.json({ subscriber: { entitlements, original_app_user_id: "x" } });
}

function verifierFor(respond: () => Promise<Response> | Response) {
  let requests: { url: string; init?: RequestInit }[] = [];
  let verifier = createRevenueCatVerifier({
    secretKey: "sk_test_secret",
    async fetch(url, init) {
      requests.push({ url: String(url), init });
      return respond();
    },
  });
  return { verifier, requests };
}

describe("createRevenueCatVerifier", () => {
  it("treats a pro entitlement that expires in the future as entitled", async () => {
    let expires = new Date(Date.now() + DAY_MS).toISOString();
    let { verifier } = verifierFor(() => subscriberJson({ pro: { expires_date: expires } }));

    expect(await verifier.verify("user-1")).toBe("entitled");
  });

  it("treats a pro entitlement with a null expiry as a lifetime unlock", async () => {
    let { verifier } = verifierFor(() => subscriberJson({ pro: { expires_date: null } }));

    expect(await verifier.verify("user-1")).toBe("entitled");
  });

  it("treats an expired pro entitlement as not entitled", async () => {
    let expires = new Date(Date.now() - DAY_MS).toISOString();
    let { verifier } = verifierFor(() => subscriberJson({ pro: { expires_date: expires } }));

    expect(await verifier.verify("user-1")).toBe("not-entitled");
  });

  it("treats a subscriber without the pro entitlement as not entitled", async () => {
    let { verifier } = verifierFor(() => subscriberJson({ other: { expires_date: null } }));

    expect(await verifier.verify("user-1")).toBe("not-entitled");
  });

  it("treats a brand new subscriber with no entitlements as not entitled", async () => {
    let { verifier } = verifierFor(() => subscriberJson({}));

    expect(await verifier.verify("user-1")).toBe("not-entitled");
  });

  it("reports network when the request throws", async () => {
    let { verifier } = verifierFor(() => {
      throw new TypeError("fetch failed");
    });

    expect(await verifier.verify("user-1")).toBe("network");
  });

  it("reports network on a 5xx", async () => {
    let { verifier } = verifierFor(() => new Response("down", { status: 503 }));

    expect(await verifier.verify("user-1")).toBe("network");
  });

  it("reports error on a 401, because that is our own key being wrong", async () => {
    let { verifier } = verifierFor(() => new Response("unauthorized", { status: 401 }));

    expect(await verifier.verify("user-1")).toBe("error");
  });

  it("reports error on a 404", async () => {
    let { verifier } = verifierFor(() => new Response("missing", { status: 404 }));

    expect(await verifier.verify("user-1")).toBe("error");
  });

  it.each([
    ["a body that is not JSON", () => new Response("<html>", { status: 200 })],
    ["a body with the wrong shape", () => Response.json({ subscriber: {} })],
    ["an unparseable expiry", () => subscriberJson({ pro: { expires_date: "next tuesday" } })],
  ])("fails closed with error on %s", async (_label, respond) => {
    let { verifier } = verifierFor(respond);

    expect(await verifier.verify("user-1")).toBe("error");
  });

  it("asks RevenueCat for the url-encoded subscriber with the secret as a bearer token", async () => {
    let { verifier, requests } = verifierFor(() => subscriberJson({}));

    await verifier.verify("$RCAnonymousID:a/b c");

    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe(
      "https://api.revenuecat.com/v1/subscribers/%24RCAnonymousID%3Aa%2Fb%20c"
    );
    expect(new Headers(requests[0].init?.headers).get("Authorization")).toBe(
      "Bearer sk_test_secret"
    );
  });
});
