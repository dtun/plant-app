import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
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
    <View className="flex-1 items-center bg-background">
      <SafeAreaView>
        <View className="relative w-80 h-80 justify-center items-center">
          {rainbowColors.map((color, index) => (
            <Animated.View
              key={color}
              className="absolute inset-0 justify-center items-center"
              style={{ opacity: opacityAnimations[index] }}
            >
              <View className="bg-background p-4 rounded-2xl">
                <QRCodeStyled
                  color={color}
                  data={testFlightUrl}
                  pieceBorderRadius="50%"
                  pieceScale={1.04}
                />
              </View>
            </Animated.View>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}
