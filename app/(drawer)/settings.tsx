import { Link } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";

export default function SettingsScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="flex-row self-center gap-2 mb-8 p-4">
        <Text className="text-4xl font-light text-color">Settings</Text>
      </View>
      <View className="flex-1 p-4">
        <Link href="/ai-setup" asChild>
          <TouchableOpacity className="border-b border-gray-200 dark:border-gray-700 py-4 -mx-5 px-5">
            <View className="flex-row items-center gap-4">
              <IconSymbol size={24} name="brain" themeColor="tint" />
              <View className="flex-1 gap-1">
                <Text className="text-base font-semibold text-color">
                  AI Setup
                </Text>
                <Text className="text-sm opacity-70 text-color">
                  Configure your AI provider and API key
                </Text>
              </View>
              <IconSymbol size={20} name="chevron.right" themeColor="icon" />
            </View>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}
