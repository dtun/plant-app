import { createRevenueCatBilling } from "./revenuecat-billing";
import type { Billing } from "./types";

let current: Billing = createRevenueCatBilling();

export function billing(): Billing {
  return current;
}

export function __setBillingForTests(impl: Billing): void {
  current = impl;
}

export { createRevenueCatBilling } from "./revenuecat-billing";
export { createFakeBilling } from "./fake-billing";
export type { FakeBilling, FakeBillingResponses } from "./fake-billing";
export { PRO_ENTITLEMENT_ID, getRevenueCatApiKey } from "./config";
export type {
  Billing,
  BillingFailure,
  BillingFailureKind,
  Entitlement,
  ProOffer,
  Result,
} from "./types";
