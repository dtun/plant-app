import {
  PRO_ENTITLEMENT_ID,
  getRevenueCatApiKey,
  isPaywallConfigured,
} from "@/src/payments/config";
import { events, tables } from "@/src/livestore/schema";
import { getDeviceId } from "@/utils/device";
import { useStore } from "@livestore/react";
import { createContext, useContext, useEffect, useState } from "react";
import Purchases, { type CustomerInfo, type PurchasesPackage } from "react-native-purchases";

export interface PurchaseResult {
  ok: boolean;
  cancelled?: boolean;
  error?: string;
}

interface PurchaseContextValue {
  /** Whether the user owns the lifetime unlock. */
  isPro: boolean;
  /** True while the initial entitlement check is in flight. */
  isLoading: boolean;
  /** Whether the paywall is enforced (keys present + supported platform). */
  isConfigured: boolean;
  /** The unlock package to sell, or null if offerings are unavailable. */
  proPackage: PurchasesPackage | null;
  purchasePro: () => Promise<PurchaseResult>;
  restore: () => Promise<PurchaseResult>;
}

let PurchaseContext = createContext<PurchaseContextValue | null>(null);

function hasProEntitlement(info: CustomerInfo): boolean {
  return info.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
}

function isUserCancelled(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "userCancelled" in error &&
    (error as { userCancelled?: boolean }).userCancelled === true
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function PurchaseProvider({ children }: { children: React.ReactNode }) {
  let { store } = useStore();
  let configured = isPaywallConfigured();

  // When the paywall isn't configured (dev, web, missing keys) the app is open.
  let [isPro, setIsPro] = useState(!configured);
  let [isLoading, setIsLoading] = useState(configured);
  let [proPackage, setProPackage] = useState<PurchasesPackage | null>(null);

  // Persist tier to the LiveStore user record for analytics / future gating.
  // RevenueCat's CustomerInfo remains the source of truth for access.
  function syncTier(pro: boolean, productId?: string) {
    let deviceId = getDeviceId();
    let tier = pro ? "pro" : "free";
    let existing = store.query(tables.user.where({ id: deviceId }));

    if (existing[0]) {
      store.commit(events.userUpdated({ id: deviceId, tier, subscriptionId: productId }));
    } else {
      store.commit(
        events.userCreated({
          id: deviceId,
          tier,
          subscriptionId: productId,
          syncEnabled: false,
          createdAt: Date.now(),
        })
      );
    }
  }

  useEffect(() => {
    if (!configured) {
      return;
    }
    let apiKey = getRevenueCatApiKey();
    if (!apiKey) {
      return;
    }

    let mounted = true;

    function applyInfo(info: CustomerInfo) {
      if (!mounted) {
        return;
      }
      let pro = hasProEntitlement(info);
      setIsPro(pro);
      syncTier(pro, info.entitlements.active[PRO_ENTITLEMENT_ID]?.productIdentifier);
    }

    async function initialize() {
      try {
        Purchases.configure({ apiKey: apiKey! });

        let info = await Purchases.getCustomerInfo();
        applyInfo(info);

        let offerings = await Purchases.getOfferings();
        if (mounted) {
          setProPackage(offerings.current?.availablePackages[0] ?? null);
        }
      } catch (error) {
        // Fail closed: leave the user locked on error so AI costs stay protected.
        // RevenueCat caches CustomerInfo locally, so legitimate owners still resolve.
        console.warn("RevenueCat init failed:", errorMessage(error));
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initialize();
    Purchases.addCustomerInfoUpdateListener(applyInfo);

    return () => {
      mounted = false;
      Purchases.removeCustomerInfoUpdateListener(applyInfo);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

  async function purchasePro(): Promise<PurchaseResult> {
    if (!proPackage) {
      return { ok: false, error: "No unlock product available" };
    }
    try {
      let { customerInfo } = await Purchases.purchasePackage(proPackage);
      let pro = hasProEntitlement(customerInfo);
      setIsPro(pro);
      if (pro) {
        syncTier(true, proPackage.product.identifier);
      }
      return { ok: pro };
    } catch (error) {
      if (isUserCancelled(error)) {
        return { ok: false, cancelled: true };
      }
      return { ok: false, error: errorMessage(error) };
    }
  }

  async function restore(): Promise<PurchaseResult> {
    try {
      let info = await Purchases.restorePurchases();
      let pro = hasProEntitlement(info);
      setIsPro(pro);
      syncTier(pro, info.entitlements.active[PRO_ENTITLEMENT_ID]?.productIdentifier);
      return { ok: pro };
    } catch (error) {
      return { ok: false, error: errorMessage(error) };
    }
  }

  return (
    <PurchaseContext.Provider
      value={{
        isPro,
        isLoading,
        isConfigured: configured,
        proPackage,
        purchasePro,
        restore,
      }}
    >
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
