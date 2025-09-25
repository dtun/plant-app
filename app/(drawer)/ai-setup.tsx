import React from "react";
import { StyleSheet } from "react-native";

import { AISetupForm } from "@/components/ai-setup-form";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function AISetupScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#f0f7f0", dark: "#1a2e1a" }}
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
