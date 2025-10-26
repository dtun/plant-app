import { PlantForm } from "@/components/plant-form";
import { ThemedView } from "@/components/themed-view";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.select({ default: "height", ios: "padding" })}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        style={styles.keyboardAvoidingView}
      >
        <PlantForm />
        <SafeAreaView edges={["bottom"]} />
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    paddingHorizontal: 8,
    backgroundColor: "transparent",
  },
});
