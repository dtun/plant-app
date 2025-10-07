import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import QRCodeStyled from "react-native-qrcode-styled";
import { SafeAreaView } from "react-native-safe-area-context";

let testFlightUrl = "https://testflight.apple.com/join/DQcdaT9a";

let rainbowColors = [
  "#FF0000", // red
  "#FF7F00", // orange
  "#FFFF00", // yellow
  "#00FF00", // green
  "#0000FF", // blue
  "#4B0082", // indigo
  "#9400D3", // violet
];

export default function ShareScreen() {
  let backgroundColor = useThemeColor({}, "background");
  let opacityAnimations = useRef(
    rainbowColors.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))
  ).current;

  useEffect(() => {
    function fadeToNext(fromIndex: number) {
      let toIndex = (fromIndex + 1) % rainbowColors.length;

      Animated.parallel([
        Animated.timing(opacityAnimations[fromIndex], {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(opacityAnimations[toIndex], {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]).start(() => {
        fadeToNext(toIndex);
      });
    }

    fadeToNext(0);
  }, [opacityAnimations]);

  return (
    <ThemedView style={styles.screenContainer}>
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.qrContainer}>
          {rainbowColors.map((color, index) => (
            <Animated.View
              key={color}
              style={[styles.qrWrapper, { opacity: opacityAnimations[index] }]}
            >
              <QRCodeStyled
                color={color}
                data={testFlightUrl}
                pieceBorderRadius="50%"
                pieceScale={1.04}
                style={{ backgroundColor: backgroundColor }}
              />
            </Animated.View>
          ))}
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

let styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    alignItems: "center",
  },
  container: {},
  qrContainer: {
    position: "relative",
    width: 320,
    height: 320,
    justifyContent: "center",
    alignItems: "center",
  },
  qrWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
