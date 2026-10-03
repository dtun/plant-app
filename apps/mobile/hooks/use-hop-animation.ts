import { useEffect } from "react";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const HOP_HEIGHT = -2.4;
const HOP_DURATION_MS = 240;

export function useHopAnimation() {
  let hopOffset = useSharedValue(0);

  useEffect(() => {
    hopOffset.value = withRepeat(
      withSequence(
        withTiming(HOP_HEIGHT, { duration: HOP_DURATION_MS, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: HOP_DURATION_MS, easing: Easing.in(Easing.ease) })
      ),
      -1
    );
  }, [hopOffset]);

  return useAnimatedStyle(() => ({
    transform: [{ translateY: hopOffset.value }],
  }));
}
