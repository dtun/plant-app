import { StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { PlantForm } from "@/components/plant-form";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function HomeScreen() {
  let tintColor = useThemeColor({}, "tint");

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
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
