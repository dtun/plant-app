import { Stack } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

import { AISetupForm } from "@/components/ai-setup-form";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function AISetupScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "AI Setup",
          headerShown: true,
        }}
      />
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#f0f0f0", dark: "#2c2c2c" }}
        headerImage={
          <IconSymbol
            size={310}
            color="#808080"
            name="brain"
            style={styles.headerImage}
          />
        }
      >
        <AISetupForm />
      </ParallaxScrollView>
    </>
  );
}

let styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
});
