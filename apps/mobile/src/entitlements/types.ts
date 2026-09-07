import type { Result } from "@/src/intelligence/types";

export type EntitlementFailureKind =
  | "cancelled"
  /** The device or account may not make purchases (parental controls, managed device). */
  | "not-allowed"
  | "no-config"
  | "no-offer"
  | "network"
  /** The app store itself is unavailable or misbehaving; retrying later usually helps. */
  | "store-error"
  | "unknown";

export interface EntitlementFailure {
  kind: EntitlementFailureKind;
}

/** What the app owns: the "pro" entitlement, backed by a subscription or a lifetime unlock. */
export interface Entitlement {
  isPro: boolean;
  /** Store product identifier backing the entitlement, recorded for analytics. */
  productId: string | null;
  /** Epoch milliseconds when access lapses; null for a lifetime unlock or when not pro. */
  expiresAt: number | null;
  /** True when the store will bill again at expiresAt. */
  willRenew: boolean;
  /** Where the user manages or cancels the subscription; null when the store offers none. */
  managementUrl: string | null;
}

/** How often the store bills for an offer; `lifetime` is a single charge. */
export type ProOfferTerm =
  | "weekly"
  | "monthly"
  | "two-month"
  | "three-month"
  | "six-month"
  | "annual"
  | "lifetime";

/** The pro offer as the UI needs to see it. The vendor package stays behind the seam. */
export interface ProOffer {
  priceLabel: string;
  /** Store product identifier; lets `purchase` resolve the offer without prior state. */
  productId: string;
  /** Renewal term; null when the store's package carries no recognized term. */
  term: ProOfferTerm | null;
}

/**
 * The seam between the app and the billing vendor. Provider choice (RevenueCat)
 * is private to whichever adapter is wired up; callers never see vendor types.
 * Failures cross as a discriminated EntitlementFailure, never as thrown errors.
 */
export interface Entitlements {
  getEntitlement(): Promise<Result<Entitlement, EntitlementFailure>>;
  getOffer(): Promise<Result<ProOffer, EntitlementFailure>>;
  /** Buy the given offer. Independent of getOffer: the offer is re-resolved against the store. */
  purchase(offer: ProOffer): Promise<Result<Entitlement, EntitlementFailure>>;
  restore(): Promise<Result<Entitlement, EntitlementFailure>>;
  /**
   * The vendor's anonymous app user id, which the planned server will meter built-in AI by.
   * Null when the vendor is unconfigured or unreachable; never throws.
   */
  getAppUserId(): Promise<string | null>;
  /** Subscribe to entitlement changes pushed by the vendor; returns an unsubscribe fn. */
  subscribe(onChange: (entitlement: Entitlement) => void): () => void;
}

export type { Result };
