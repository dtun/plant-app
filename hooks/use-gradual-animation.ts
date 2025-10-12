import { useKeyboardHandler } from "react-native-keyboard-controller";
import { useSharedValue } from "react-native-reanimated";

const OFFSET = 42;

export function useGradualAnimation() {
  let totalOffset = OFFSET;
  let height = useSharedValue(totalOffset);

  useKeyboardHandler({
    onMove(e) {
      "worklet";
      height.value = e.height ? Math.max(e.height, totalOffset) : totalOffset;
    },
  });

  return height;
}
