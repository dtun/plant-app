import { useChatContext } from "@/contexts/chat-context";
import { useMessageAnimation, type AnimationType } from "@/hooks/use-message-animation";
import { messagesByPlant$, type Message } from "@/src/livestore/queries";
import { formatDayLabel, isSameDay } from "@/utils/date-helpers";
import type { LegendListRef } from "@legendapp/list";
import { useQuery } from "@livestore/react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import { useSharedValue, type SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

export type ListItem = { type: "separator"; label: string } | { type: "message"; message: Message };

interface MessageListContextValue {
  messages: readonly Message[];
  listData: ListItem[];
  flatListRef: React.RefObject<LegendListRef | null>;
  scrollToBottom: () => void;
  /**
   * How far the open keyboard pushes the composer up into the list, in px.
   * Keyboard height minus the bottom safe area the composer already reserves.
   */
  keyboardInset: SharedValue<number>;
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  markAsNew: (id: string) => void;
  getAnimationType: (id: string, role: string) => AnimationType;
}

let MessageListContext = createContext<MessageListContextValue | null>(null);

export function MessageListProvider({ children }: { children: React.ReactNode }) {
  let { plantId } = useChatContext();
  let messages = useQuery(messagesByPlant$(plantId));

  let [isGenerating, setIsGenerating] = useState(false);
  let flatListRef = useRef<LegendListRef>(null);
  let { markAsNew, getAnimationType } = useMessageAnimation();

  // The keyboard inset lives on the UI thread as a shared value so the list
  // inset can track it per-frame without a React re-render. Driving this
  // through React state re-rendered (and re-laid-out) the whole list 3x per
  // open on iOS — that was the jank. See the v0 iOS post.
  let keyboardInset = useSharedValue(0);
  let { bottom: bottomInset } = useSafeAreaInsets();

  // Explicit scroll for deliberate moments (e.g. the user sending a message).
  // Routine follow-on-new-content is handled by LegendList's maintainScrollAtEnd.
  let scrollToBottom = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Land at the bottom once when a chat first opens. alignItemsAtEnd only
  // bottom-aligns content shorter than the viewport, so long chats need this.
  // The list often isn't laid out on the first data tick, so a single scroll
  // no-ops — retry across a few frames until it sticks (per the v0 iOS post).
  let didInitialScroll = useRef(false);
  useEffect(() => {
    if (didInitialScroll.current || messages.length === 0) return;
    didInitialScroll.current = true;

    let pending: Array<ReturnType<typeof setTimeout>> = [];
    function snapToEnd() {
      flatListRef.current?.scrollToEnd({ animated: false });
    }
    let raf = requestAnimationFrame(() => {
      snapToEnd();
      requestAnimationFrame(snapToEnd);
    });
    pending.push(setTimeout(snapToEnd, 100));
    pending.push(setTimeout(snapToEnd, 300));

    return () => {
      cancelAnimationFrame(raf);
      for (let id of pending) clearTimeout(id);
    };
  }, [messages.length]);

  // Growing the bottom inset doesn't move the content on iOS, so the last
  // messages would slide behind the keyboard. Shift the scroll offset by the
  // same amount so whatever was above the composer stays above it.
  let shiftScrollBy = useCallback((delta: number) => {
    let list = flatListRef.current;
    if (!list) return;
    let { scroll } = list.getState();
    list.scrollToOffset({ offset: Math.max(0, scroll + delta), animated: true });
  }, []);

  useKeyboardHandler(
    {
      onStart(e) {
        "worklet";
        let next = Math.max(e.height - bottomInset, 0);
        let delta = next - keyboardInset.value;
        if (delta !== 0) scheduleOnRN(shiftScrollBy, delta);
      },
      onMove(e) {
        "worklet";
        keyboardInset.value = Math.max(e.height - bottomInset, 0);
      },
      onInteractive(e) {
        "worklet";
        keyboardInset.value = Math.max(e.height - bottomInset, 0);
      },
      onEnd(e) {
        "worklet";
        keyboardInset.value = Math.max(e.height - bottomInset, 0);
      },
    },
    [bottomInset, shiftScrollBy]
  );

  // Build list data with day separators
  let listData: ListItem[] = [];
  let lastTimestamp: number | null = null;

  for (let msg of messages) {
    if (lastTimestamp === null || !isSameDay(lastTimestamp, msg.createdAt)) {
      listData.push({ type: "separator", label: formatDayLabel(msg.createdAt) });
    }
    listData.push({ type: "message", message: msg });
    lastTimestamp = msg.createdAt;
  }

  return (
    <MessageListContext.Provider
      value={{
        messages,
        listData,
        flatListRef,
        scrollToBottom,
        keyboardInset,
        isGenerating,
        setIsGenerating,
        markAsNew,
        getAnimationType,
      }}
    >
      {children}
    </MessageListContext.Provider>
  );
}

export function useMessageList(): MessageListContextValue {
  let context = useContext(MessageListContext);
  if (!context) {
    throw new Error("useMessageList must be used within a MessageListProvider");
  }
  return context;
}
