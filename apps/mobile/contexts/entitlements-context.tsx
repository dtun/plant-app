import {
  entitlements,
  type Entitlement,
  type EntitlementFailure,
  type ProOffer,
  type Result,
} from "@/src/entitlements";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type EntitlementsStatus = "loading" | "ready" | "unavailable";

type EntitlementResult = Result<Entitlement, EntitlementFailure>;

interface EntitlementsContextValue {
  /** What the user currently owns; null until the seam has answered. */
  entitlement: Entitlement | null;
  /** `unavailable` when the seam is unconfigured, so callers can hide billing UI entirely. */
  status: EntitlementsStatus;
  /** Buy the given offer; the seam's Result comes back unchanged. */
  purchase: (offer: ProOffer) => Promise<EntitlementResult>;
  /** Recover a prior purchase; the seam's Result comes back unchanged. */
  restore: () => Promise<EntitlementResult>;
  /** Re-read the entitlement from the seam; the seam's Result comes back unchanged. */
  refresh: () => Promise<EntitlementResult>;
}

let EntitlementsContext = createContext<EntitlementsContextValue | null>(null);

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  let [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  let [status, setStatus] = useState<EntitlementsStatus>("loading");

  let refresh = useCallback(async () => {
    let result = await entitlements().getEntitlement();
    if (result.ok) {
      setEntitlement(result.value);
      setStatus("ready");
    } else if (result.failure.kind === "no-config") {
      setStatus("unavailable");
    }
    return result;
  }, []);

  useEffect(() => {
    let unsubscribe = entitlements().subscribe(setEntitlement);
    refresh();
    return unsubscribe;
  }, [refresh]);

  let purchase = useCallback(async (offer: ProOffer) => {
    let result = await entitlements().purchase(offer);
    if (result.ok) setEntitlement(result.value);
    return result;
  }, []);

  let restore = useCallback(async () => {
    let result = await entitlements().restore();
    if (result.ok) setEntitlement(result.value);
    return result;
  }, []);

  return (
    <EntitlementsContext.Provider value={{ entitlement, status, purchase, restore, refresh }}>
      {children}
    </EntitlementsContext.Provider>
  );
}

export function useEntitlements(): EntitlementsContextValue {
  let context = useContext(EntitlementsContext);
  if (!context) {
    throw new Error("useEntitlements must be used within an EntitlementsProvider");
  }
  return context;
}
