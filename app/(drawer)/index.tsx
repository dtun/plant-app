import { PlantForm } from "@/components/plant-form";
import { useNavigation } from "@react-navigation/native";
import { View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { useResolveClassNames } from "uniwind";

export default function HomeScreen() {
  let { setOptions } = useNavigation();
  let safeStyle = useResolveClassNames("pb-4");

  return (
    <View className="flex-1 bg-background">
      <KeyboardStickyView style={{ flex: 1, paddingHorizontal: 16 }}>
        <PlantForm setOptions={setOptions} />
        <SafeAreaView edges={["bottom"]} style={safeStyle} />
      </KeyboardStickyView>
    </View>
  );
}
