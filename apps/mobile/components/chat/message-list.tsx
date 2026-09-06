import { AnimatedMessageBubble } from "@/components/animated-message-bubble";
import { DaySeparator } from "@/components/chat/day-separator";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { useChatContext } from "@/contexts/chat-context";
import { useComposer } from "@/contexts/composer-context";
import { useMessageList } from "@/contexts/message-list-context";
import { LegendList } from "@legendapp/list";
import { useLingui } from "@lingui/react/macro";
import { useHeaderHeight } from "@react-navigation/elements";
import { useCallback, useRef } from "react";
import { type ScrollView, Text, View } from "react-native";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

/** Breathing room between the first/last message and the chrome over them. */
const EDGE_GAP = 8;

/**
 * The scrolling conversation. It fills the whole screen and runs under both
 * the transparent header and the floating `Composer`; content padding keeps
 * messages clear of that chrome at rest, and a native scroll inset follows
 * the keyboard so they stay clear while it's open.
 */
export function MessageList() {
  let { t } = useLingui();
  let { plant } = useChatContext();
  let { messages, listData, flatListRef, isGenerating, getAnimationType } = useMessageList();
  let { composerHeight } = useComposer();
  let headerHeight = useHeaderHeight();
  let { bottom: safeBottom } = useSafeAreaInsets();

  // Follow the keyboard with a native scroll inset, set straight on the scroll
  // view each frame rather than through React state, so the list never
  // re-renders or re-lays-out while the keyboard moves. Insets are an iOS-only
  // prop; a no-op on Android.
  //
  // Growing the inset alone doesn't move the content, so when the reader is at
  // the end of the conversation the list is re-pinned to its end every frame,
  // which keeps the latest message riding just above the composer. Mid-history
  // the content stays put and only the inset changes.
  let appliedInset = useRef(0);
  let isInteractive = useRef(false);
  let pinToEnd = useRef(false);

  // LegendList's scroll bookkeeping is only stale before the first user
  // scroll: its scroll-to-end on open runs on estimated sizes and the native
  // maintainVisibleContentPosition adjustment silently carries the content the
  // rest of the way. Until then, "at the end" is exactly where it is.
  let hasUserScrolled = useRef(false);
  let handleScrollBeginDrag = useCallback(() => {
    hasUserScrolled.current = true;
  }, []);

  let anchorToKeyboard = useCallback(() => {
    isInteractive.current = false;
    let state = flatListRef.current?.getState();
    pinToEnd.current = !hasUserScrolled.current || (state?.isAtEnd ?? false);
  }, [flatListRef]);

  let followKeyboard = useCallback(
    (inset: number, moveContent: boolean) => {
      // LegendList types the native ref loosely; it is the ScrollView instance.
      let scrollView = flatListRef.current?.getNativeScrollRef() as ScrollView | undefined;
      if (!scrollView) return;
      scrollView.setNativeProps({
        contentInset: { bottom: inset },
        scrollIndicatorInsets: { top: headerHeight, bottom: composerHeight + inset },
      });
      if (moveContent && pinToEnd.current && !isInteractive.current) {
        scrollView.scrollToEnd({ animated: false });
      }
      appliedInset.current = inset;
    },
    [flatListRef, headerHeight, composerHeight]
  );

  let markInteractive = useCallback(() => {
    isInteractive.current = true;
  }, []);

  useKeyboardHandler(
    {
      onStart() {
        "worklet";
        scheduleOnRN(anchorToKeyboard);
      },
      onMove(e) {
        "worklet";
        scheduleOnRN(followKeyboard, Math.max(e.height - safeBottom, 0), true);
      },
      onInteractive(e) {
        "worklet";
        // The user is dragging the keyboard along with the list, so only the
        // inset follows; moving the content under their finger would fight them.
        scheduleOnRN(markInteractive);
        scheduleOnRN(followKeyboard, Math.max(e.height - safeBottom, 0), false);
      },
      onEnd(e) {
        "worklet";
        scheduleOnRN(followKeyboard, Math.max(e.height - safeBottom, 0), true);
      },
    },
    [anchorToKeyboard, followKeyboard, markInteractive, safeBottom]
  );

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
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-icon text-base text-center">
              {t`Say hello to ${plant?.name ?? t`your plant`}!`}
            </Text>
          </View>
        }
        alignItemsAtEnd
        maintainScrollAtEnd
        maintainScrollAtEndThreshold={0.1}
        maintainVisibleContentPosition={false}
        contentContainerStyle={{
          // Only stretch/center for the empty state. When populated, leave
          // sizing to alignItemsAtEnd — flexGrow inflates the measured
          // content size and breaks its padding + scroll-range math.
          flexGrow: messages.length === 0 ? 1 : undefined,
          justifyContent: messages.length === 0 ? "center" : undefined,
          paddingTop: headerHeight + EDGE_GAP,
          paddingBottom: composerHeight + EDGE_GAP,
        }}
        scrollIndicatorInsets={{ top: headerHeight, bottom: composerHeight }}
        onScrollBeginDrag={handleScrollBeginDrag}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />
    </Animated.View>
  );
}
