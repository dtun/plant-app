import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { StyleSheet } from "react-native";
import QRCodeStyled from "react-native-qrcode-styled";
import { SafeAreaView } from "react-native-safe-area-context";

let testFlightUrl = "https://testflight.apple.com/join/DQcdaT9a";

export default function ShareScreen() {
  let textColor = useThemeColor({}, "text");
  let backgroundColor = useThemeColor({}, "background");

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <QRCodeStyled
          data={testFlightUrl}
          style={{ backgroundColor: backgroundColor }}
          color={textColor}
          pieceScale={1.04}
          pieceBorderRadius="50%"
        />
      </SafeAreaView>
    </ThemedView>
  );
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
