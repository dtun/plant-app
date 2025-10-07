import { PlantForm } from "@/components/plant-form";
import { ThemedView } from "@/components/themed-view";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <ThemedView style={styles.flex1}>
      <KeyboardAvoidingView
        behavior={Platform.select({ default: "height", ios: "padding" })}
        keyboardVerticalOffset={Platform.OS === "ios" ? 72 : 0}
        style={styles.flex1}
      >
        <ScrollView
          contentContainerStyle={styles.contentContainerStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.containerStyle}
          automaticallyAdjustKeyboardInsets
        >
          <PlantForm />
        </ScrollView>
        <SafeAreaView edges={["bottom"]} />
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

let styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  contentContainerStyle: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 8,
    gap: 16,
  },
  containerStyle: {},
});
