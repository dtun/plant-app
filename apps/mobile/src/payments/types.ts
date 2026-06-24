import type { Result } from "@/src/intelligence/types";

export type BillingFailureKind = "cancelled" | "no-config" | "no-offer" | "network" | "unknown";

export interface BillingFailure {
  kind: BillingFailureKind;
}

/** What the app owns. The lifetime "pro" unlock is the only entitlement today. */
export interface Entitlement {
  isPro: boolean;
  /** Store product identifier backing the entitlement, recorded for analytics. */
  productId: string | null;
}

/** The pro unlock as the UI needs to see it. The vendor package stays behind the seam. */
export interface ProOffer {
  priceLabel: string;
}

/**
 * The seam between the app and the billing vendor. Provider choice (RevenueCat)
 * is private to whichever adapter is wired up; callers never see vendor types.
 * Failures cross as a discriminated BillingFailure, never as thrown errors.
 */
export interface Billing {
  getEntitlement(): Promise<Result<Entitlement, BillingFailure>>;
  getOffer(): Promise<Result<ProOffer, BillingFailure>>;
  purchase(): Promise<Result<Entitlement, BillingFailure>>;
  restore(): Promise<Result<Entitlement, BillingFailure>>;
  /** Subscribe to entitlement changes pushed by the vendor; returns an unsubscribe fn. */
  subscribe(onChange: (entitlement: Entitlement) => void): () => void;
}

export type { Result };
