import "expo-sqlite/localStorage/install";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { AISetupForm } from "@/components/ai-setup-form";

export default function AISettingsScreen() {
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
      className="flex-1 bg-background px-5 pt-4"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View className="mb-6">
        <View className="rounded-xl border border-icon p-4">
          <Text className="text-sm text-icon">
            {hasUserKey ? "Using your API key" : "Using default key"}
          </Text>
        </View>
      </View>

      <AISetupForm onSaved={checkKeyStatus} />
    </ScrollView>
  );
}
