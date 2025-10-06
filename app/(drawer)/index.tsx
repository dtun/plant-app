import { PlantForm } from "@/components/plant-form";
import { ThemedView } from "@/components/themed-view";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ default: "height", ios: "padding" })}
      keyboardVerticalOffset={Platform.select({ default: 20, ios: 0 })}
      style={styles.flex1}
    >
      <ThemedView style={styles.flex1}>
        <ScrollView
          contentContainerStyle={styles.flex1}
          keyboardShouldPersistTaps="handled"
        >
          <PlantForm />
        </ScrollView>
        <SafeAreaView edges={["bottom"]} />
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

let styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
});
