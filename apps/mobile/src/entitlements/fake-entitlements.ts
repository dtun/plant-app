import type { Entitlements, EntitlementFailure, Entitlement, ProOffer, Result } from "./types";

export interface FakeEntitlementsResponses {
  entitlement?: Result<Entitlement, EntitlementFailure>;
  offer?: Result<ProOffer, EntitlementFailure>;
  purchase?: Result<Entitlement, EntitlementFailure>;
  restore?: Result<Entitlement, EntitlementFailure>;
}

export interface FakeEntitlements extends Entitlements {
  /** Push a synthetic entitlement change to subscribers. */
  emit(entitlement: Entitlement): void;
}

export function createFakeEntitlements(
  responses: FakeEntitlementsResponses = {}
): FakeEntitlements {
  let listeners = new Set<(entitlement: Entitlement) => void>();

  return {
    async getEntitlement() {
      return responses.entitlement ?? { ok: true, value: { isPro: false, productId: null } };
    },
    async getOffer() {
      return responses.offer ?? { ok: true, value: { priceLabel: "$9.99" } };
    },
    async purchase() {
      return responses.purchase ?? { ok: true, value: { isPro: true, productId: "lifetime" } };
    },
    async restore() {
      return responses.restore ?? { ok: true, value: { isPro: false, productId: null } };
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
