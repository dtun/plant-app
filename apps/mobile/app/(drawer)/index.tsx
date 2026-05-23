import { PlantForm } from "@/components/plant-form";
import { useNavigation } from "@react-navigation/native";
import { View } from "react-native";

export default function HomeScreen() {
  let { setOptions } = useNavigation();

  return (
    <View className="flex-1 bg-background px-4">
      <PlantForm setOptions={setOptions} />
    </View>
  );
}
