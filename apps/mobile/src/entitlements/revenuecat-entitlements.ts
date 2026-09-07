import Purchases, {
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesPackage,
} from "react-native-purchases";

import { PRO_ENTITLEMENT_ID, getRevenueCatApiKey } from "./config";
import type { Entitlements, EntitlementFailure, Entitlement, ProOffer, Result } from "./types";

function entitlementFrom(info: CustomerInfo): Entitlement {
  let active = info.entitlements.active[PRO_ENTITLEMENT_ID];
  return {
    isPro: active !== undefined,
    productId: active?.productIdentifier ?? null,
    expiresAt: active?.expirationDateMillis ?? null,
    willRenew: active?.willRenew ?? false,
    managementUrl: info.managementURL ?? null,
  };
}

function isUserCancelled(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "userCancelled" in error &&
    (error as { userCancelled?: boolean }).userCancelled === true
  );
}

/**
 * The vendor's structured error code, if the thrown value carries one. The SDK
 * throws plain objects shaped like PurchasesError; anything else (a configure
 * throw, a missing native module) has no code and classifies as unknown.
 */
function errorCodeOf(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return null;
  }
  let { code } = error as { code?: unknown };
  return typeof code === "string" || typeof code === "number" ? String(code) : null;
}

/**
 * Classifies on the SDK's error code, which is a stable contract, never on the
 * human-readable message, which is localized and reworded between releases.
 */
function mapError(error: unknown): EntitlementFailure {
  if (isUserCancelled(error)) {
    return { kind: "cancelled" };
  }
  switch (errorCodeOf(error)) {
    case PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR:
      return { kind: "cancelled" };
    case PURCHASES_ERROR_CODE.NETWORK_ERROR:
    case PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR:
      return { kind: "network" };
    case PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR:
      return { kind: "store-error" };
    case PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR:
      return { kind: "not-allowed" };
    default:
      return { kind: "unknown" };
  }
}

export function createRevenueCatEntitlements(): Entitlements {
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

  async function getEntitlement(): Promise<Result<Entitlement, EntitlementFailure>> {
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

  async function getOffer(): Promise<Result<ProOffer, EntitlementFailure>> {
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

  async function purchase(): Promise<Result<Entitlement, EntitlementFailure>> {
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

  async function restore(): Promise<Result<Entitlement, EntitlementFailure>> {
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
