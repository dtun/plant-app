import { ActivityIndicator } from "@/components/ui/activity-indicator";
import { useEntitlements } from "@/contexts/entitlements-context";
import {
  entitlements,
  type EntitlementFailureKind,
  type ProOffer,
  type ProOfferTerm,
} from "@/src/entitlements";
import { i18n } from "@/src/i18n";
import type { MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react/macro";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

/** Every term the seam can report has a label; the record makes the compiler check that. */
let termLabels: Record<ProOfferTerm, MessageDescriptor> = {
  weekly: msg`Renews weekly`,
  monthly: msg`Renews monthly`,
  "two-month": msg`Renews every 2 months`,
  "three-month": msg`Renews every 3 months`,
  "six-month": msg`Renews every 6 months`,
  annual: msg`Renews yearly`,
  lifetime: msg`One-time purchase`,
};

type OfferState =
  | { status: "loading" }
  | { status: "ready"; offer: ProOffer }
  | { status: "failed"; kind: EntitlementFailureKind };

/** The price block, a spinner while it loads, or why it could not be loaded. */
function OfferSection({ state }: { state: OfferState }) {
  let { t } = useLingui();

  if (state.status === "loading") {
    return <ActivityIndicator />;
  }

  if (state.status === "failed") {
    let copy =
      state.kind === "network"
        ? t`Couldn't load the subscription. Check your connection and try again.`
        : t`The subscription isn't available right now. Please try again later.`;
    return (
      <Text className="text-base text-center text-color" accessibilityRole="alert">
        {copy}
      </Text>
    );
  }

  let term = state.offer.term ? i18n._(termLabels[state.offer.term]) : null;
  return (
    <View className="items-center gap-1">
      <Text className="text-3xl font-bold text-color">{state.offer.priceLabel}</Text>
      {term ? <Text className="text-base text-icon">{term}</Text> : null}
    </View>
  );
}

/** Why the user arrived; `allowance-exhausted` acknowledges spent free interactions. */
type PaywallReason = "allowance-exhausted";

export default function PaywallScreen() {
  let { t } = useLingui();
  let router = useRouter();
  let { reason } = useLocalSearchParams<{ reason?: PaywallReason }>();
  let { entitlement, status, purchase, restore } = useEntitlements();
  let isPro = entitlement?.isPro === true;
  let [offerState, setOfferState] = useState<OfferState>({ status: "loading" });
  let [busy, setBusy] = useState(false);
  let [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadOffer(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, []);

  /** Reads the offer from the seam; `isStale` lets an unmounted screen drop the answer. */
  async function loadOffer(isStale: () => boolean = () => false) {
    setOfferState({ status: "loading" });
    let result = await entitlements().getOffer();
    if (isStale()) return;
    setOfferState(
      result.ok
        ? { status: "ready", offer: result.value }
        : { status: "failed", kind: result.failure.kind }
    );
  }

  function handleRetry() {
    loadOffer();
  }

  /** Copy for a failed purchase or restore; `cancelled` is the user's choice, not an error. */
  function actionFailureCopy(kind: EntitlementFailureKind): string | null {
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
        return t`This subscription is no longer available.`;
      case "no-config":
      case "unknown":
        return t`Something went wrong. Please try again.`;
    }
  }

  async function handleSubscribe() {
    if (offerState.status !== "ready") return;
    setBusy(true);
    setActionMessage(null);
    let result = await purchase(offerState.offer);
    setBusy(false);
    if (result.ok) {
      router.back();
      return;
    }
    setActionMessage(actionFailureCopy(result.failure.kind));
  }

  async function handleRestore() {
    setBusy(true);
    setActionMessage(null);
    let result = await restore();
    setBusy(false);
    if (!result.ok) {
      setActionMessage(actionFailureCopy(result.failure.kind));
      return;
    }
    // The seam reports "nothing to restore" as a success without pro; that is worth saying.
    if (!result.value.isPro) {
      setActionMessage(t`No previous purchase was found for this account.`);
      return;
    }
    router.back();
  }

  function handleDismiss() {
    router.back();
  }

  let isCheckingEntitlement = status === "loading" && !isPro;
  let isBillingUnavailable = status === "unavailable";
  let showBilling = status === "ready" && !isPro;
  let canRetry = showBilling && offerState.status === "failed";
  let subscribeDisabled = offerState.status !== "ready" || busy;
  let dismissLabel = isPro ? t`Done` : t`Not now`;
  let dismissHint = isPro ? t`Closes this screen` : t`Closes this screen without subscribing`;
  let included = [
    t`Chat with your plants, any time`,
    t`Names and personalities grounded in what each plant is`,
    t`Care notes read from a photo`,
    t`No API key or setup needed`,
  ];
  let headline =
    reason === "allowance-exhausted"
      ? t`You've used your free conversations`
      : t`Give your plants a voice`;

  return (
    <ScrollView
      className="flex-1 bg-background px-5 pt-6"
      contentContainerStyle={{ paddingBottom: 40 }}
      testID="paywallScreen"
    >
      <Text className="text-2xl font-bold text-center text-color" accessibilityRole="header">
        {headline}
      </Text>

      <View className="mt-6 gap-2" accessibilityRole="list">
        {included.map((line) => (
          <Text key={line} className="text-base text-color" accessibilityRole="text">
            {line}
          </Text>
        ))}
      </View>

      {isPro ? (
        <Text className="mt-6 text-base text-center text-color">
          {t`You're already subscribed to KeepTend Pro.`}
        </Text>
      ) : null}

      {isCheckingEntitlement ? <ActivityIndicator /> : null}

      {isBillingUnavailable ? (
        <Text className="mt-6 text-base text-center text-color" accessibilityRole="alert">
          {t`Subscriptions aren't available in this build.`}
        </Text>
      ) : null}

      {showBilling ? <OfferSection state={offerState} /> : null}

      {canRetry ? (
        <TouchableOpacity
          className="mt-4 self-center rounded-xl px-4 py-2 border border-icon"
          onPress={handleRetry}
          accessibilityRole="button"
          accessibilityLabel={t`Try again`}
          accessibilityHint={t`Loads the subscription again`}
          testID="retryBtn"
        >
          <Text className="text-base font-semibold text-color">{t`Try again`}</Text>
        </TouchableOpacity>
      ) : null}

      {actionMessage ? (
        <Text className="mt-4 text-base text-center text-color" accessibilityRole="alert">
          {actionMessage}
        </Text>
      ) : null}

      <View className="mt-8 gap-3">
        {showBilling ? (
          <>
            <TouchableOpacity
              className="rounded-xl p-4 items-center bg-tint"
              style={{ opacity: subscribeDisabled ? 0.7 : 1 }}
              onPress={handleSubscribe}
              disabled={subscribeDisabled}
              accessibilityRole="button"
              accessibilityLabel={t`Subscribe`}
              accessibilityHint={t`Starts your KeepTend Pro subscription`}
              accessibilityState={{ disabled: subscribeDisabled, busy }}
              testID="subscribeBtn"
            >
              {busy ? (
                <ActivityIndicator size="small" colorClassName="text-white" />
              ) : (
                <Text className="text-white text-base font-semibold">{t`Subscribe`}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="rounded-xl p-4 items-center"
              onPress={handleRestore}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={t`Restore purchase`}
              accessibilityHint={t`Recovers a subscription you already bought`}
              accessibilityState={{ disabled: busy, busy }}
              testID="restorePurchaseBtn"
            >
              <Text className="text-base font-semibold text-color">{t`Restore purchase`}</Text>
            </TouchableOpacity>
          </>
        ) : null}

        <TouchableOpacity
          className="rounded-xl p-4 items-center"
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel={dismissLabel}
          accessibilityHint={dismissHint}
          testID="dismissPaywallBtn"
        >
          <Text className="text-base text-icon">{dismissLabel}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
