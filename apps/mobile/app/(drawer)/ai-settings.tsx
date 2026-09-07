import { AISetupForm } from "@/components/ai-setup-form";
import { SubscriptionSection } from "@/components/subscription-section";
import { useLingui } from "@lingui/react/macro";
import { useRouter } from "expo-router";
import "expo-sqlite/localStorage/install";
import { useCallback, useEffect, useState } from "react";
import { Linking, ScrollView, Text, View } from "react-native";

export default function AISettingsScreen() {
  let { t } = useLingui();
  let router = useRouter();
  let [hasUserKey, setHasUserKey] = useState(false);

  let checkKeyStatus = useCallback(() => {
    let userKey = globalThis.localStorage.getItem("ai_user_api_key");
    setHasUserKey(!!userKey);
  }, []);

  useEffect(() => {
    checkKeyStatus();
  }, [checkKeyStatus]);

  function openPaywall() {
    router.push("/paywall");
  }

  function openManagementUrl(url: string) {
    Linking.openURL(url);
  }

  return (
    <ScrollView
      className="flex-1 bg-background px-5 pt-4"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 40 }}
      testID="aiSettingsScreen"
    >
      <SubscriptionSection onSubscribe={openPaywall} onManage={openManagementUrl} />

      <View className="mb-6">
        <View className="rounded-xl border border-icon p-4">
          <Text className="text-sm text-icon">
            {hasUserKey ? t`Using your API key` : t`Using default key`}
          </Text>
        </View>
      </View>

      <AISetupForm onSaved={checkKeyStatus} />
    </ScrollView>
  );
}
