import { AISetupForm } from "@/components/ai-setup-form";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AISetupScreen() {
  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.select({ default: "height", ios: "padding" })}
        keyboardVerticalOffset={Platform.OS === "ios" ? 72 : 0}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "flex-end",
            paddingHorizontal: 8,
            paddingTop: 16,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AISetupForm />
        </ScrollView>
        <SafeAreaView edges={["bottom"]} />
      </KeyboardAvoidingView>
    </View>
  );
}
