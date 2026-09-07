import { ActivityIndicator } from "@/components/ui/activity-indicator";
import { useEntitlements } from "@/contexts/entitlements-context";
import type { Entitlement } from "@/src/entitlements";
import { useLingui } from "@lingui/react/macro";
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

  /** When access renews or lapses; null for a lifetime unlock, which has no date. */
  function subscriptionTermCopy(current: Entitlement): string | null {
    if (current.expiresAt === null) return null;
    let date = formatDate(current.expiresAt);
    return current.willRenew ? t`Renews on ${date}` : t`Expires on ${date}`;
  }

  if (status === "loading") {
    return <ActivityIndicator />;
  }

  let isPro = entitlement?.isPro === true;
  let termCopy = entitlement ? subscriptionTermCopy(entitlement) : null;

  if (isPro) {
    let managementUrl = entitlement?.managementUrl ?? null;
    return (
      <View className="mb-6 rounded-xl border border-icon p-4 gap-3" testID="subscriptionSection">
        <Text className="text-base font-semibold text-color">{t`Subscribed to KeepTend Pro`}</Text>
        {termCopy ? <Text className="text-sm text-icon">{termCopy}</Text> : null}
        {managementUrl ? (
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
      </View>
    );
  }

  return (
    <View className="mb-6 rounded-xl border border-icon p-4 gap-3" testID="subscriptionSection">
      <Text className="text-base font-semibold text-color">{t`Not subscribed`}</Text>

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
        onPress={() => restore()}
        accessibilityRole="button"
        accessibilityLabel={t`Restore purchase`}
        accessibilityHint={t`Recovers a subscription you already bought`}
        testID="restorePurchaseBtn"
      >
        <Text className="text-base font-semibold text-color">{t`Restore purchase`}</Text>
      </TouchableOpacity>
    </View>
  );
}
