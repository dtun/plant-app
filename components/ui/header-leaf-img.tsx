import { Image } from "expo-image";
import { View } from "react-native";

let leafImage = require("@/assets/images/KeepTend-Leaf.png");

export function HeaderLeafImg() {
  return (
    <View className="h-8 w-8">
      <Image source={leafImage} style={{ height: "100%" }} />
    </View>
  );
}
