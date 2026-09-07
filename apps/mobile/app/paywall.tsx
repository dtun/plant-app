import { ActivityIndicator } from "@/components/ui/activity-indicator";
import { useEntitlements } from "@/contexts/entitlements-context";
import {
  entitlements,
  type EntitlementFailureKind,
  type ProOffer,
  type ProOfferTerm,
} from "@/src/entitlements";
import { useLingui } from "@lingui/react/macro";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

function useTermLabel(): (term: ProOfferTerm | null) => string | null {
  let { t } = useLingui();
  return function termLabel(term) {
    switch (term) {
      case "weekly":
        return t`Renews weekly`;
      case "monthly":
        return t`Renews monthly`;
      case "two-month":
        return t`Renews every 2 months`;
      case "three-month":
        return t`Renews every 3 months`;
      case "six-month":
        return t`Renews every 6 months`;
      case "annual":
        return t`Renews yearly`;
      case "lifetime":
        return t`One-time purchase`;
      default:
        return null;
    }
  };
}

type OfferState =
  | { status: "loading" }
  | { status: "ready"; offer: ProOffer }
  | { status: "failed"; kind: EntitlementFailureKind };

/** The price block, a spinner while it loads, or why it could not be loaded. */
function OfferSection({ state }: { state: OfferState }) {
  let { t } = useLingui();
  let termLabel = useTermLabel();

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

  let term = termLabel(state.offer.term);
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
  let { entitlement, purchase, restore } = useEntitlements();
  let isPro = entitlement?.isPro === true;
  let [offerState, setOfferState] = useState<OfferState>({ status: "loading" });
  let [busy, setBusy] = useState(false);
  let [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    entitlements()
      .getOffer()
      .then((result) => {
        if (cancelled) return;
        setOfferState(
          result.ok
            ? { status: "ready", offer: result.value }
            : { status: "failed", kind: result.failure.kind }
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

      {isPro ? null : <OfferSection state={offerState} />}

      {actionMessage ? (
        <Text className="mt-4 text-base text-center text-color" accessibilityRole="alert">
          {actionMessage}
        </Text>
      ) : null}

      <View className="mt-8 gap-3">
        {isPro ? null : (
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
        )}

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
