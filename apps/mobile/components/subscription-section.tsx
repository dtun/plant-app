import { ActivityIndicator } from "@/components/ui/activity-indicator";
import { useEntitlements } from "@/contexts/entitlements-context";
import type { Entitlement, EntitlementFailureKind } from "@/src/entitlements";
import { useLingui } from "@lingui/react/macro";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface SubscriptionSectionProps {
  /** Take the user to the paywall. */
  onSubscribe: () => void;
  /** Open the store's management page for the subscription. */
  onManage: (url: string) => void;
}

/** A full date in the device locale, e.g. "January 1, 2026". */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString([], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function SubscriptionSection({ onSubscribe, onManage }: SubscriptionSectionProps) {
  let { t } = useLingui();
  let { entitlement, status, restore } = useEntitlements();
  let [busy, setBusy] = useState(false);
  let [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  /** When access renews or lapses; null for a lifetime unlock, which has no date. */
  function subscriptionTermCopy(current: Entitlement): string | null {
    if (current.expiresAt === null) return null;
    let date = formatDate(current.expiresAt);
    return current.willRenew ? t`Renews on ${date}` : t`Expires on ${date}`;
  }

  /** Copy for a failed restore; `cancelled` is the user's choice, not an error. */
  function restoreFailureCopy(kind: EntitlementFailureKind): string | null {
    switch (kind) {
      case "cancelled":
        return null;
      case "network":
        return t`Couldn't reach the store. Check your connection and try again.`;
      case "not-allowed":
        return t`Purchases aren't allowed on this device or account.`;
      case "store-error":
        return t`The store is having trouble right now. Please try again later.`;
      case "no-offer":
      case "no-config":
      case "unknown":
        return t`Something went wrong. Please try again.`;
    }
  }

  async function handleRestore() {
    setBusy(true);
    setRestoreMessage(null);
    let result = await restore();
    setBusy(false);
    if (!result.ok) {
      setRestoreMessage(restoreFailureCopy(result.failure.kind));
      return;
    }
    // The seam reports "nothing to restore" as a success without pro; that is worth saying.
    setRestoreMessage(
      result.value.isPro
        ? t`Your subscription has been restored.`
        : t`No previous purchase was found for this account.`
    );
  }

  if (status === "loading") {
    return <ActivityIndicator />;
  }

  // No billing in this build (web, dev, tests): the section has nothing to say.
  if (status === "unavailable") {
    return null;
  }

  let isPro = entitlement?.isPro === true;
  let entitlementFailed = status === "error";
  let termCopy = entitlement ? subscriptionTermCopy(entitlement) : null;
  let managementUrl = entitlement?.managementUrl ?? null;

  return (
    <View className="mb-6 rounded-xl border border-icon p-4 gap-3" testID="subscriptionSection">
      {entitlementFailed ? (
        <Text className="text-base font-semibold text-color" accessibilityRole="alert">
          {t`Couldn't check your subscription right now.`}
        </Text>
      ) : (
        <Text className="text-base font-semibold text-color">
          {isPro ? t`Subscribed to KeepTend Pro` : t`Not subscribed`}
        </Text>
      )}

      {isPro && termCopy ? <Text className="text-sm text-icon">{termCopy}</Text> : null}

      {restoreMessage ? (
        <Text className="text-sm text-color" accessibilityRole="alert">
          {restoreMessage}
        </Text>
      ) : null}

      {isPro && managementUrl ? (
        <TouchableOpacity
          className="rounded-xl p-3 items-center border border-icon"
          onPress={() => onManage(managementUrl)}
          accessibilityRole="button"
          accessibilityLabel={t`Manage subscription`}
          accessibilityHint={t`Opens the store page where you can change or cancel it`}
          testID="manageSubscriptionBtn"
        >
          <Text className="text-base font-semibold text-color">{t`Manage subscription`}</Text>
        </TouchableOpacity>
      ) : null}

      {isPro ? null : (
        <>
          <TouchableOpacity
            className="rounded-xl p-3 items-center bg-tint"
            onPress={onSubscribe}
            accessibilityRole="button"
            accessibilityLabel={t`Subscribe`}
            accessibilityHint={t`Opens the KeepTend Pro subscription`}
            testID="subscribeBtn"
          >
            <Text className="text-white text-base font-semibold">{t`Subscribe`}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-xl p-3 items-center"
            onPress={handleRestore}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={t`Restore purchase`}
            accessibilityHint={t`Recovers a subscription you already bought`}
            accessibilityState={{ disabled: busy, busy }}
            testID="restorePurchaseBtn"
          >
            {busy ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text className="text-base font-semibold text-color">{t`Restore purchase`}</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
