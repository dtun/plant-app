import { createFakeBilling } from "./fake-billing";
import type { BillingFailure, Entitlement, Result } from "./types";

test("createFakeBilling returns canned ok results by default", async () => {
  let billing = createFakeBilling();

  let entitlement = await billing.getEntitlement();
  let offer = await billing.getOffer();
  let purchase = await billing.purchase();
  let restore = await billing.restore();

  expect(entitlement.ok).toBe(true);
  expect(offer.ok).toBe(true);
  expect(purchase.ok).toBe(true);
  expect(restore.ok).toBe(true);
});

test("createFakeBilling returns configured responses", async () => {
  let billing = createFakeBilling({
    entitlement: { ok: true, value: { isPro: true, productId: "lifetime" } },
    offer: { ok: true, value: { priceLabel: "£4.99" } },
  });

  let entitlement = await billing.getEntitlement();
  let offer = await billing.getOffer();

  if (!entitlement.ok) throw new Error("expected ok");
  if (!offer.ok) throw new Error("expected ok");
  expect(entitlement.value.isPro).toBe(true);
  expect(entitlement.value.productId).toBe("lifetime");
  expect(offer.value.priceLabel).toBe("£4.99");
});

test("createFakeBilling returns configured failure responses", async () => {
  let failure: Result<Entitlement, BillingFailure> = {
    ok: false,
    failure: { kind: "network" },
  };
  let billing = createFakeBilling({ entitlement: failure });

  let result = await billing.getEntitlement();

  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.failure.kind).toBe("network");
});

test("subscribe notifies listeners on emit and stops after unsubscribe", () => {
  let billing = createFakeBilling();
  let seen: Entitlement[] = [];
  let unsubscribe = billing.subscribe((entitlement) => seen.push(entitlement));

  billing.emit({ isPro: true, productId: "lifetime" });
  unsubscribe();
  billing.emit({ isPro: false, productId: null });

  expect(seen).toHaveLength(1);
  expect(seen[0].isPro).toBe(true);
});
