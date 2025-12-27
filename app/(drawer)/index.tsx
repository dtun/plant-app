import { PlantForm } from "@/components/plant-form";
import { useNavigation } from "@react-navigation/native";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useResolveClassNames } from "uniwind";

export default function HomeScreen() {
  let { setOptions } = useNavigation();
  let safeStyle = useResolveClassNames("pb-4");

  return (
    <View className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.select({ default: "height", ios: "padding" })}
        className="flex-1 px-4"
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <PlantForm setOptions={setOptions} />
        <SafeAreaView edges={["bottom"]} style={safeStyle} />
      </KeyboardAvoidingView>
    </View>
  );
}
