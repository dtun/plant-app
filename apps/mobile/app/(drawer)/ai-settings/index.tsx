import { AISetupForm } from "@/components/ai-setup-form";
import { useLingui } from "@lingui/react/macro";
import { useHeaderHeight } from "@react-navigation/elements";
import "expo-sqlite/localStorage/install";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

export default function AISettingsScreen() {
  let { t } = useLingui();
  let headerHeight = useHeaderHeight();
  let [hasUserKey, setHasUserKey] = useState(false);

  let checkKeyStatus = useCallback(() => {
    let userKey = globalThis.localStorage.getItem("ai_user_api_key");
    setHasUserKey(!!userKey);
  }, []);

  useEffect(() => {
    checkKeyStatus();
  }, [checkKeyStatus]);

  return (
    <ScrollView
      className="flex-1 bg-background px-5"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingTop: headerHeight + 16, paddingBottom: 40 }}
      testID="aiSettingsScreen"
    >
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
