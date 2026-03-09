import { MessageBubble, type MessageBubbleProps } from "@/components/message-bubble";
import type { AnimationType } from "@/hooks/use-message-animation";
import Animated, { FadeIn } from "react-native-reanimated";

interface AnimatedMessageBubbleProps extends MessageBubbleProps {
  animationType: AnimationType;
  animationDelay?: number;
}

export function AnimatedMessageBubble({
  animationType,
  animationDelay,
  ...bubbleProps
}: AnimatedMessageBubbleProps) {
  if (animationType === "none") {
    return <MessageBubble {...bubbleProps} />;
  }

  let delay = animationDelay ?? 0;

  let entering =
    animationType === "slide-up"
      ? FadeIn.duration(200)
          .delay(delay)
          .withInitialValues({ transform: [{ translateY: 20 }] })
      : FadeIn.duration(300).delay(delay);

  return (
    <Animated.View entering={entering}>
      <MessageBubble {...bubbleProps} />
    </Animated.View>
  );
}
