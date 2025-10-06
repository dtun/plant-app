import { PlantForm } from "@/components/plant-form";
import { ThemedView } from "@/components/themed-view";
import { KeyboardAvoidingView, StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <ThemedView style={styles.flex1}>
      <SafeAreaView edges={["bottom"]} style={styles.flex1}>
        <KeyboardAvoidingView behavior="padding" style={styles.flex1}>
          <ScrollView
            contentContainerStyle={styles.flex1}
            keyboardShouldPersistTaps="handled"
          >
            <PlantForm />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

let styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
});
