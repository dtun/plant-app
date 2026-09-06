import { createFakeEntitlements } from "./fake-entitlements";
import type { EntitlementFailure, Entitlement, Result } from "./types";

test("createFakeEntitlements returns canned ok results by default", async () => {
  let entitlements = createFakeEntitlements();

  let entitlement = await entitlements.getEntitlement();
  let offer = await entitlements.getOffer();
  let purchase = await entitlements.purchase();
  let restore = await entitlements.restore();

  expect(entitlement.ok).toBe(true);
  expect(offer.ok).toBe(true);
  expect(purchase.ok).toBe(true);
  expect(restore.ok).toBe(true);
});

test("createFakeEntitlements returns configured responses", async () => {
  let entitlements = createFakeEntitlements({
    entitlement: { ok: true, value: { isPro: true, productId: "lifetime" } },
    offer: { ok: true, value: { priceLabel: "£4.99" } },
  });

  let entitlement = await entitlements.getEntitlement();
  let offer = await entitlements.getOffer();

  if (!entitlement.ok) throw new Error("expected ok");
  if (!offer.ok) throw new Error("expected ok");
  expect(entitlement.value.isPro).toBe(true);
  expect(entitlement.value.productId).toBe("lifetime");
  expect(offer.value.priceLabel).toBe("£4.99");
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

  entitlements.emit({ isPro: true, productId: "lifetime" });
  unsubscribe();
  entitlements.emit({ isPro: false, productId: null });

  expect(seen).toHaveLength(1);
  expect(seen[0].isPro).toBe(true);
});
