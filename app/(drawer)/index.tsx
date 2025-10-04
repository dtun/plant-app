import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Image, StyleSheet, View } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { PlantForm } from "@/components/plant-form";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function HomeScreen() {
  let tintColor = useThemeColor({}, "tint");
  let [headerImage] = useState<string | null>(null);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#f0f7f0", dark: "#1a2e1a" }}
      headerImage={
        headerImage ? (
          <View style={styles.headerImageContainer}>
            <Image
              source={{ uri: headerImage }}
              style={styles.headerPlantImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.4)", "transparent"]}
              locations={[0, 0.4, 1]}
              style={styles.headerGradient}
            />
          </View>
        ) : (
          <View style={styles.headerImageContainer}>
            <IconSymbol
              size={310}
              color={tintColor}
              name="leaf"
              style={styles.headerIcon}
            />
          </View>
        )
      }
    >
      <PlantForm />
    </ParallaxScrollView>
  );
}

let styles = StyleSheet.create({
  headerImageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  headerIcon: {
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  headerPlantImage: {
    width: "100%",
    height: "100%",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
});
