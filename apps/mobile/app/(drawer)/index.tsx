import { PlantForm } from "@/components/plant-form";
import { useNavigation } from "@react-navigation/native";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  let { setOptions } = useNavigation();

  return (
    <View className="flex-1 bg-background px-4">
      <PlantForm setOptions={setOptions} />
      <SafeAreaView edges={["bottom"]} />
    </View>
  );
}
