import { ActivityIndicator } from "@/components/ui/activity-indicator";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { usePurchase } from "@/contexts/purchase-context";
import { type BillingFailure } from "@/src/payments";
import { Trans, useLingui } from "@lingui/react/macro";
import { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-3">
      <IconSymbol name="leaf" size={20} colorClassName="text-tint" />
      <Text className="flex-1 text-base text-color">{children}</Text>
    </View>
  );
}

export function Paywall() {
  let { t } = useLingui();
  let { offer, purchasePro, restore } = usePurchase();
  let [busy, setBusy] = useState(false);

  let priceLabel = offer?.priceLabel;

  function failureMessage(failure: BillingFailure): string {
    switch (failure.kind) {
      case "network":
        return t`Network error. Please check your connection and try again.`;
      case "no-offer":
        return t`This purchase isn't available right now. Please try again later.`;
      case "no-config":
        return t`Purchases aren't available on this device.`;
      case "cancelled":
      case "unknown":
        return t`Something went wrong. Please try again.`;
    }
  }

  async function handleUnlock() {
    setBusy(true);
    let result = await purchasePro();
    setBusy(false);
    if (!result.ok && result.failure.kind !== "cancelled") {
      Alert.alert(t`Purchase failed`, failureMessage(result.failure));
    }
  }

  async function handleRestore() {
    setBusy(true);
    let result = await restore();
    setBusy(false);
    if (result.ok) {
      if (!result.value.isPro) {
        Alert.alert(
          t`Nothing to restore`,
          t`We couldn't find a previous purchase on this account.`
        );
      }
      return;
    }
    Alert.alert(t`Restore failed`, failureMessage(result.failure));
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-8">
          <IconSymbol name="leaf" size={56} colorClassName="text-tint" />
          <Text className="mt-4 text-2xl font-bold text-color text-center">
            <Trans>Unlock KeepTend</Trans>
          </Text>
          <Text className="mt-2 text-base text-icon text-center">
            <Trans>A one-time purchase. Yours forever.</Trans>
          </Text>
        </View>

        <View className="gap-4 mb-10">
          <Feature>
            <Trans>AI photo analysis to identify and describe your plants</Trans>
          </Feature>
          <Feature>
            <Trans>Personalized, AI-generated care advice</Trans>
          </Feature>
          <Feature>
            <Trans>Chat with every plant in your collection</Trans>
          </Feature>
          <Feature>
            <Trans>Unlimited plants, no monthly fees</Trans>
          </Feature>
        </View>

        <TouchableOpacity
          className="rounded-xl p-4 items-center bg-tint"
          style={{ opacity: busy || !offer ? 0.7 : 1 }}
          onPress={handleUnlock}
          disabled={busy || !offer}
          accessibilityRole="button"
          accessibilityLabel={t`Unlock the full app`}
          accessibilityState={{ disabled: busy || !offer }}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">
              {priceLabel ? (
                <Trans>Unlock for {priceLabel}</Trans>
              ) : (
                <Trans>Unlock full access</Trans>
              )}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="p-4 items-center"
          onPress={handleRestore}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={t`Restore a previous purchase`}
        >
          <Text className="text-base font-semibold text-tint">
            <Trans>Restore purchase</Trans>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Blocks the app behind the paywall until the user owns the unlock.
 * No-ops (renders children) when the paywall isn't configured.
 */
export function PaywallGate({ children }: { children: React.ReactNode }) {
  let { isPro, isLoading } = usePurchase();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isPro) {
    return <Paywall />;
  }

  return <>{children}</>;
}
