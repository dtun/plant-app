import { AnimatedMessageBubble } from "@/components/animated-message-bubble";
import { DaySeparator } from "@/components/chat/day-separator";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { useChatContext } from "@/contexts/chat-context";
import { useComposer } from "@/contexts/composer-context";
import { useMessageList } from "@/contexts/message-list-context";
import { useKeyboardFollowingList } from "@/hooks/use-keyboard-following-list";
import { LegendList } from "@legendapp/list";
import { useLingui } from "@lingui/react/macro";
import { useHeaderHeight } from "@react-navigation/elements";
import { Text, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated, { FadeIn } from "react-native-reanimated";

/** Breathing room between the first/last message and the chrome over them. */
const EDGE_GAP = 8;

/**
 * The scrolling conversation. It fills the whole screen and runs under both
 * the transparent header and the floating `Composer`; content padding keeps
 * messages clear of that chrome at rest, and `useKeyboardFollowingList` keeps
 * them clear while the keyboard is open.
 */
export function MessageList() {
  let { t } = useLingui();
  let { plant } = useChatContext();
  let { messages, listData, flatListRef, isGenerating, getAnimationType } = useMessageList();
  let { composerHeight } = useComposer();
  let headerHeight = useHeaderHeight();
  let hasMessages = messages.length > 0;
  let listProps = useKeyboardFollowingList(flatListRef, { hasMessages, composerHeight });

  if (!hasMessages) {
    // Nothing to scroll yet: a plain view that centers between the chrome and
    // gives way to the keyboard, rather than a list with 300px of empty inset.
    return (
      <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <View
            className="flex-1 items-center justify-center px-8"
            style={{ paddingTop: headerHeight, paddingBottom: composerHeight }}
          >
            <Text className="text-icon text-base text-center">
              {t`Say hello to ${plant?.name ?? t`your plant`}!`}
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1 }}>
      <LegendList
        ref={flatListRef}
        data={listData}
        estimatedItemSize={80}
        keyExtractor={(item, index) => (item.type === "message" ? item.message.id : `sep-${index}`)}
        renderItem={({ item }) => {
          if (item.type === "separator") {
            return <DaySeparator label={item.label} />;
          }
          let animationType = getAnimationType(item.message.id, item.message.role);
          return (
            <AnimatedMessageBubble
              id={item.message.id}
              animationType={animationType}
              animationDelay={item.message.role === "assistant" ? 200 : 0}
              role={item.message.role}
              content={item.message.content}
              imageUri={item.message.imageUri}
            />
          );
        }}
        ListFooterComponent={isGenerating ? <TypingIndicator /> : null}
        alignItemsAtEnd
        maintainScrollAtEnd
        maintainScrollAtEndThreshold={0.1}
        maintainVisibleContentPosition
        contentContainerStyle={{
          // Leave sizing to alignItemsAtEnd: flexGrow would inflate the
          // measured content size and break its padding + scroll-range math.
          paddingTop: headerHeight + EDGE_GAP,
          paddingBottom: composerHeight + EDGE_GAP,
        }}
        scrollIndicatorInsets={{ top: headerHeight, bottom: composerHeight }}
        keyboardDismissMode="interactive"
        {...listProps}
        keyboardShouldPersistTaps="handled"
      />
    </Animated.View>
  );
}
