import { createRevenueCatEntitlements } from "./revenuecat-entitlements";
import type { Entitlements } from "./types";

let current: Entitlements = createRevenueCatEntitlements();

export function entitlements(): Entitlements {
  return current;
}

export function __setEntitlementsForTests(impl: Entitlements): void {
  current = impl;
}

export { createRevenueCatEntitlements } from "./revenuecat-entitlements";
export { createFakeEntitlements } from "./fake-entitlements";
export type { FakeEntitlements, FakeEntitlementsResponses } from "./fake-entitlements";
export { PRO_ENTITLEMENT_ID, getRevenueCatApiKey } from "./config";
export type {
  Entitlements,
  EntitlementFailure,
  EntitlementFailureKind,
  Entitlement,
  ProOffer,
  ProOfferTerm,
  Result,
} from "./types";
