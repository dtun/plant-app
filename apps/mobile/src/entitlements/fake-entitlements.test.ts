import { createFakeEntitlements } from "./fake-entitlements";
import type { EntitlementFailure, Entitlement, Result } from "./types";

test("createFakeEntitlements returns canned ok results by default", async () => {
  let entitlements = createFakeEntitlements();

  let entitlement = await entitlements.getEntitlement();
  let offer = await entitlements.getOffer();
  let purchase = await entitlements.purchase({ priceLabel: "$4.99", productId: "pro_monthly" });
  let restore = await entitlements.restore();

  expect(entitlement.ok).toBe(true);
  expect(offer.ok).toBe(true);
  expect(purchase.ok).toBe(true);
  expect(restore.ok).toBe(true);
});

test("createFakeEntitlements returns configured responses", async () => {
  let entitlements = createFakeEntitlements({
    entitlement: {
      ok: true,
      value: {
        isPro: true,
        productId: "pro_monthly",
        expiresAt: 1767225600000,
        willRenew: false,
        managementUrl: "https://play.google.com/store/account/subscriptions",
      },
    },
    offer: { ok: true, value: { priceLabel: "£4.99", productId: "pro_monthly_gb" } },
  });

  let entitlement = await entitlements.getEntitlement();
  let offer = await entitlements.getOffer();

  if (!entitlement.ok) throw new Error("expected ok");
  if (!offer.ok) throw new Error("expected ok");
  expect(entitlement.value.isPro).toBe(true);
  expect(entitlement.value.productId).toBe("pro_monthly");
  expect(entitlement.value.expiresAt).toBe(1767225600000);
  expect(entitlement.value.willRenew).toBe(false);
  expect(entitlement.value.managementUrl).toBe(
    "https://play.google.com/store/account/subscriptions"
  );
  expect(offer.value.priceLabel).toBe("£4.99");
  expect(offer.value.productId).toBe("pro_monthly_gb");
});

test("createFakeEntitlements default not-pro state carries no expiry, renewal, or management URL", async () => {
  let entitlements = createFakeEntitlements();

  let result = await entitlements.getEntitlement();

  if (!result.ok) throw new Error("expected ok");
  expect(result.value.isPro).toBe(false);
  expect(result.value.expiresAt).toBeNull();
  expect(result.value.willRenew).toBe(false);
  expect(result.value.managementUrl).toBeNull();
});

test("createFakeEntitlements returns configured failure responses", async () => {
  let failure: Result<Entitlement, EntitlementFailure> = {
    ok: false,
    failure: { kind: "network" },
  };
  let entitlements = createFakeEntitlements({ entitlement: failure });

  let result = await entitlements.getEntitlement();

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("network");
});

test("subscribe notifies listeners on emit and stops after unsubscribe", () => {
  let entitlements = createFakeEntitlements();
  let seen: Entitlement[] = [];
  let unsubscribe = entitlements.subscribe((entitlement) => seen.push(entitlement));

  entitlements.emit({
    isPro: true,
    productId: "lifetime",
    expiresAt: null,
    willRenew: false,
    managementUrl: null,
  });
  unsubscribe();
  entitlements.emit({
    isPro: false,
    productId: null,
    expiresAt: null,
    willRenew: false,
    managementUrl: null,
  });

  expect(seen).toHaveLength(1);
  expect(seen[0].isPro).toBe(true);
});

test("createFakeEntitlements returns a canned app user id by default", async () => {
  let entitlements = createFakeEntitlements();

  let id = await entitlements.getAppUserId();

  expect(id).toBe("fake-app-user");
});

test("createFakeEntitlements returns the configured app user id", async () => {
  let entitlements = createFakeEntitlements({ appUserId: "device-42" });

  let id = await entitlements.getAppUserId();

  expect(id).toBe("device-42");
});

test("createFakeEntitlements can model an unavailable app user id", async () => {
  let entitlements = createFakeEntitlements({ appUserId: null });

  let id = await entitlements.getAppUserId();

  expect(id).toBeNull();
});

test("createFakeEntitlements purchase grants the offer it was handed", async () => {
  let entitlements = createFakeEntitlements();

  let result = await entitlements.purchase({ priceLabel: "$39.99", productId: "pro_annual" });

  if (!result.ok) throw new Error("expected ok");
  expect(result.value.isPro).toBe(true);
  expect(result.value.productId).toBe("pro_annual");
});

test("createFakeEntitlements hands out a fresh entitlement on every call", async () => {
  let entitlements = createFakeEntitlements();

  let first = await entitlements.getEntitlement();
  if (!first.ok) throw new Error("expected ok");
  first.value.isPro = true;
  let second = await entitlements.getEntitlement();

  if (!second.ok) throw new Error("expected ok");
  expect(second.value.isPro).toBe(false);
});
