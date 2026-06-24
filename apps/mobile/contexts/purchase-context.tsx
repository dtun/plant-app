import {
  billing,
  type BillingFailure,
  type Entitlement,
  type ProOffer,
  type Result,
} from "@/src/payments";
import { events, tables } from "@/src/livestore/schema";
import { getDeviceId } from "@/utils/device";
import { useStore } from "@livestore/react";
import { createContext, useContext, useEffect, useState } from "react";

type PurchaseOutcome = Result<Entitlement, BillingFailure>;

interface PurchaseContextValue {
  /** Whether the user owns the lifetime unlock. */
  isPro: boolean;
  /** True while the initial entitlement check is in flight. */
  isLoading: boolean;
  /** The unlock offer to sell, or null if offerings are unavailable. */
  offer: ProOffer | null;
  purchasePro: () => Promise<PurchaseOutcome>;
  restore: () => Promise<PurchaseOutcome>;
}

let PurchaseContext = createContext<PurchaseContextValue | null>(null);

export function PurchaseProvider({ children }: { children: React.ReactNode }) {
  let { store } = useStore();

  let [isPro, setIsPro] = useState(false);
  let [isLoading, setIsLoading] = useState(true);
  let [offer, setOffer] = useState<ProOffer | null>(null);

  // Persist tier to the LiveStore user record for analytics / future gating.
  // The billing seam remains the source of truth for access.
  function syncTier(pro: boolean, productId: string | null) {
    let deviceId = getDeviceId();
    let tier = pro ? "pro" : "free";
    let subscriptionId = productId ?? undefined;
    let existing = store.query(tables.user.where({ id: deviceId }));

    if (existing[0]) {
      store.commit(events.userUpdated({ id: deviceId, tier, subscriptionId }));
    } else {
      store.commit(
        events.userCreated({
          id: deviceId,
          tier,
          subscriptionId,
          syncEnabled: false,
          createdAt: Date.now(),
        })
      );
    }
  }

  useEffect(() => {
    let api = billing();
    let mounted = true;

    function apply(entitlement: Entitlement) {
      if (!mounted) return;
      setIsPro(entitlement.isPro);
      syncTier(entitlement.isPro, entitlement.productId);
    }

    async function initialize() {
      try {
        let result = await api.getEntitlement();
        if (!mounted) return;

        if (result.ok) {
          apply(result.value);
        } else if (result.failure.kind === "no-config") {
          // Unconfigured (dev, web, missing keys): leave the app open.
          setIsPro(true);
        } else {
          // Fail closed: stay locked so AI costs stay protected. RevenueCat caches
          // CustomerInfo locally, so legitimate owners still resolve on retry.
          setIsPro(false);
        }

        let offerResult = await api.getOffer();
        if (mounted && offerResult.ok) {
          setOffer(offerResult.value);
        }
      } catch {
        // The seam shouldn't throw, but never leave the gate stuck on loading:
        // fail closed so the app is usable rather than frozen on the spinner.
        if (mounted) setIsPro(false);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initialize();
    let unsubscribe = api.subscribe(apply);

    return () => {
      mounted = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function purchasePro(): Promise<PurchaseOutcome> {
    let result = await billing().purchase();
    if (result.ok) {
      setIsPro(result.value.isPro);
      if (result.value.isPro) {
        syncTier(true, result.value.productId);
      }
    }
    return result;
  }

  async function restore(): Promise<PurchaseOutcome> {
    let result = await billing().restore();
    if (result.ok) {
      setIsPro(result.value.isPro);
      syncTier(result.value.isPro, result.value.productId);
    }
    return result;
  }

  return (
    <PurchaseContext.Provider value={{ isPro, isLoading, offer, purchasePro, restore }}>
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchase(): PurchaseContextValue {
  let context = useContext(PurchaseContext);
  if (!context) {
    throw new Error("usePurchase must be used within a PurchaseProvider");
  }
  return context;
}
