import type { Billing, BillingFailure, Entitlement, ProOffer, Result } from "./types";

export interface FakeBillingResponses {
  entitlement?: Result<Entitlement, BillingFailure>;
  offer?: Result<ProOffer, BillingFailure>;
  purchase?: Result<Entitlement, BillingFailure>;
  restore?: Result<Entitlement, BillingFailure>;
}

export interface FakeBilling extends Billing {
  /** Push a synthetic entitlement change to subscribers. */
  emit(entitlement: Entitlement): void;
}

export function createFakeBilling(responses: FakeBillingResponses = {}): FakeBilling {
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
