import { Link } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function SettingsScreen() {
  let borderColor = useThemeColor({ light: "#e0e0e0", dark: "#333" }, "icon");

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#f0f0f0", dark: "#2c2c2c" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="gear"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Settings</ThemedText>
      </ThemedView>
      <ThemedView style={styles.settingsContainer}>
        <Link href="/ai-setup" asChild>
          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: borderColor }]}
          >
            <ThemedView style={styles.settingContent}>
              <IconSymbol size={24} name="brain" color="#007AFF" />
              <ThemedView style={styles.settingTextContainer}>
                <ThemedText type="defaultSemiBold" style={styles.settingTitle}>
                  AI Setup
                </ThemedText>
                <ThemedText style={styles.settingDescription}>
                  Configure your AI provider and API key
                </ThemedText>
              </ThemedView>
              <IconSymbol size={20} name="chevron.right" color="#999" />
            </ThemedView>
          </TouchableOpacity>
        </Link>
      </ThemedView>
    </ParallaxScrollView>
  );
}

let styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
  },
  settingsContainer: {
    flex: 1,
  },
  settingItem: {
    borderBottomWidth: 1,
    paddingVertical: 16,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  settingTextContainer: {
    flex: 1,
    gap: 4,
  },
  settingTitle: {
    fontSize: 16,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
});
