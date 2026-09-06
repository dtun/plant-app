import Purchases, { type CustomerInfo, type PurchasesPackage } from "react-native-purchases";

import { PRO_ENTITLEMENT_ID, getRevenueCatApiKey } from "./config";
import type { Billing, BillingFailure, Entitlement, ProOffer, Result } from "./types";

function entitlementFrom(info: CustomerInfo): Entitlement {
  let active = info.entitlements.active[PRO_ENTITLEMENT_ID];
  return { isPro: active !== undefined, productId: active?.productIdentifier ?? null };
}

function isUserCancelled(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "userCancelled" in error &&
    (error as { userCancelled?: boolean }).userCancelled === true
  );
}

function mapError(error: unknown): BillingFailure {
  if (isUserCancelled(error)) {
    return { kind: "cancelled" };
  }
  let message = error instanceof Error ? error.message : String(error);
  if (/network|offline|connection|fetch/i.test(message)) {
    return { kind: "network" };
  }
  return { kind: "unknown" };
}

export function createRevenueCatBilling(): Billing {
  let apiKey = getRevenueCatApiKey();
  let configured = false;
  let resolvedOffer: PurchasesPackage | null = null;

  function ensureConfigured(): boolean {
    if (!apiKey) {
      return false;
    }
    if (!configured) {
      Purchases.configure({ apiKey });
      configured = true;
    }
    return true;
  }

  async function getEntitlement(): Promise<Result<Entitlement, BillingFailure>> {
    try {
      if (!ensureConfigured()) {
        return { ok: false, failure: { kind: "no-config" } };
      }
      let info = await Purchases.getCustomerInfo();
      return { ok: true, value: entitlementFrom(info) };
    } catch (error) {
      return { ok: false, failure: mapError(error) };
    }
  }

  async function getOffer(): Promise<Result<ProOffer, BillingFailure>> {
    try {
      if (!ensureConfigured()) {
        return { ok: false, failure: { kind: "no-config" } };
      }
      let offerings = await Purchases.getOfferings();
      let pkg = offerings.current?.availablePackages[0] ?? null;
      resolvedOffer = pkg;
      if (!pkg) {
        return { ok: false, failure: { kind: "no-offer" } };
      }
      return { ok: true, value: { priceLabel: pkg.product.priceString } };
    } catch (error) {
      return { ok: false, failure: mapError(error) };
    }
  }

  async function purchase(): Promise<Result<Entitlement, BillingFailure>> {
    try {
      if (!ensureConfigured()) {
        return { ok: false, failure: { kind: "no-config" } };
      }
      if (!resolvedOffer) {
        return { ok: false, failure: { kind: "no-offer" } };
      }
      let { customerInfo } = await Purchases.purchasePackage(resolvedOffer);
      return { ok: true, value: entitlementFrom(customerInfo) };
    } catch (error) {
      return { ok: false, failure: mapError(error) };
    }
  }

  async function restore(): Promise<Result<Entitlement, BillingFailure>> {
    try {
      if (!ensureConfigured()) {
        return { ok: false, failure: { kind: "no-config" } };
      }
      let info = await Purchases.restorePurchases();
      return { ok: true, value: entitlementFrom(info) };
    } catch (error) {
      return { ok: false, failure: mapError(error) };
    }
  }

  function subscribe(onChange: (entitlement: Entitlement) => void): () => void {
    try {
      if (!ensureConfigured()) {
        return () => {};
      }
      function listener(info: CustomerInfo) {
        onChange(entitlementFrom(info));
      }
      Purchases.addCustomerInfoUpdateListener(listener);
      return () => {
        Purchases.removeCustomerInfoUpdateListener(listener);
      };
    } catch {
      return () => {};
    }
  }

  return { getEntitlement, getOffer, purchase, restore, subscribe };
}
