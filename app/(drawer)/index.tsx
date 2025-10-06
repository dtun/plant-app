import { PlantForm } from "@/components/plant-form";
import { ThemedView } from "@/components/themed-view";
import { KeyboardAvoidingView, StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.keyboardAvoidingView}
        >
          <ScrollView contentContainerStyle={styles.container}>
            <PlantForm />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

let styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    height: "100%",
  },
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
