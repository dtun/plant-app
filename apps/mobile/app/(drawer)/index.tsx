import { PlantForm } from "@/components/plant-form";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { View } from "react-native";

export default function HomeScreen() {
  let { setOptions } = useNavigation();
  let headerHeight = useHeaderHeight()

  return (
    <View
      className="flex-1 bg-background px-4"
      style={{ paddingTop: headerHeight }}
    >
      <PlantForm setOptions={setOptions} />
    </View>
  );
}
