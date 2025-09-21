import { StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { PlantForm } from "@/components/plant-form";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function HomeScreen() {
  let tintColor = useThemeColor({}, "tint");

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#f0f7f0", dark: "#1a2e1a" }}
      headerImage={
        <IconSymbol
          size={310}
          color={tintColor}
          name="leaf"
          style={styles.headerIcon}
        />
      }
    >
      <PlantForm />
    </ParallaxScrollView>
  );
}

let styles = StyleSheet.create({
  headerIcon: {
    bottom: -90,
    left: -35,
    position: "absolute",
  },
});
