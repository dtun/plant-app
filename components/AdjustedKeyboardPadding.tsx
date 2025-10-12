import { useGradualAnimation } from "@/hooks/use-gradual-animation";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

function AdjustedKeyboardPadding() {
  let height = useGradualAnimation();
  let keyboardPadding = useAnimatedStyle(() => ({ height: height.value }));

  return <Animated.View style={keyboardPadding} />;
}

export { AdjustedKeyboardPadding };
