import type { Result } from "@/src/intelligence/types";

export type EntitlementFailureKind =
  | "cancelled"
  | "no-config"
  | "no-offer"
  | "network"
  /** The app store itself is unavailable or misbehaving; retrying later usually helps. */
  | "store-error"
  | "unknown";

export interface EntitlementFailure {
  kind: EntitlementFailureKind;
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
 * Failures cross as a discriminated EntitlementFailure, never as thrown errors.
 */
export interface Entitlements {
  getEntitlement(): Promise<Result<Entitlement, EntitlementFailure>>;
  getOffer(): Promise<Result<ProOffer, EntitlementFailure>>;
  purchase(): Promise<Result<Entitlement, EntitlementFailure>>;
  restore(): Promise<Result<Entitlement, EntitlementFailure>>;
  /** Subscribe to entitlement changes pushed by the vendor; returns an unsubscribe fn. */
  subscribe(onChange: (entitlement: Entitlement) => void): () => void;
}

export type { Result };
