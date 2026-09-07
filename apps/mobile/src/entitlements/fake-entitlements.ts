import type { Entitlements, EntitlementFailure, Entitlement, ProOffer, Result } from "./types";

export interface FakeEntitlementsResponses {
  entitlement?: Result<Entitlement, EntitlementFailure>;
  offer?: Result<ProOffer, EntitlementFailure>;
  purchase?: Result<Entitlement, EntitlementFailure>;
  restore?: Result<Entitlement, EntitlementFailure>;
  appUserId?: string | null;
}

export interface FakeEntitlements extends Entitlements {
  /** Push a synthetic entitlement change to subscribers. */
  emit(entitlement: Entitlement): void;
}

/** Fresh literals per call so a test that mutates a result cannot leak into the next. */
function notPro(): Entitlement {
  return { isPro: false, productId: null, expiresAt: null, willRenew: false, managementUrl: null };
}

function proFor(offer: ProOffer): Entitlement {
  return {
    isPro: true,
    productId: offer.productId,
    expiresAt: 4102444800000,
    willRenew: true,
    managementUrl: "https://example.test/manage",
  };
}

export function createFakeEntitlements(
  responses: FakeEntitlementsResponses = {}
): FakeEntitlements {
  let listeners = new Set<(entitlement: Entitlement) => void>();

  return {
    async getEntitlement() {
      return responses.entitlement ?? { ok: true, value: notPro() };
    },
    async getOffer() {
      return (
        responses.offer ?? {
          ok: true,
          value: { priceLabel: "$4.99", productId: "pro_monthly", term: "monthly" },
        }
      );
    },
    async purchase(offer) {
      return responses.purchase ?? { ok: true, value: proFor(offer) };
    },
    async restore() {
      return responses.restore ?? { ok: true, value: notPro() };
    },
    async getAppUserId() {
      return responses.appUserId === undefined ? "fake-app-user" : responses.appUserId;
    },
    subscribe(onChange) {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },
    emit(entitlement) {
      for (let listener of listeners) {
        listener(entitlement);
      }
    },
  };
}
