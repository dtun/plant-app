import type { LegendListRef } from "@legendapp/list";
import { type RefObject, useCallback, useEffect, useRef } from "react";
import type { ScrollView } from "react-native";
import { useKeyboardHandler } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

/**
 * The list inset for a keyboard height. The bottom safe area is left out
 * because the composer dock already reserves it, and absorbs it while the
 * keyboard is open.
 */
function insetFor(keyboardHeight: number, safeBottom: number) {
  "worklet";
  return Math.max(keyboardHeight - safeBottom, 0);
}

interface KeyboardFollowingListOptions {
  /** Whether the list has anything to keep in view. */
  hasMessages: boolean;
  /**
   * Height of the composer dock the list pads for. When it changes, the end of
   * the list is kept in view so the dock grows over padding, not over the
   * last message.
   */
  composerHeight: number;
}

interface KeyboardFollowingListProps {
  onScrollBeginDrag: () => void;
}

/**
 * Keeps a chat list clear of the keyboard, iOS style.
 *
 * Each keyboard frame sets a native bottom inset straight on the scroll view,
 * so the list never re-renders while the keyboard moves. Growing the inset
 * alone doesn't move content, so when the reader is at the end the list is
 * re-pinned to its end every frame and the latest message rides just above
 * the composer. Mid-history, content stays put and only the inset changes.
 * Interactive dismissal only follows the inset: moving content under the
 * user's finger would fight them.
 *
 * Spread the returned props onto the list. Insets are an iOS-only prop; a
 * no-op on Android.
 */
export function useKeyboardFollowingList(
  listRef: RefObject<LegendListRef | null>,
  { hasMessages, composerHeight }: KeyboardFollowingListOptions
): KeyboardFollowingListProps {
  // Reanimated's useHandler, which useKeyboardHandler calls, pushes a worklet
  // hash into the dependency array it is given, on every render. Under React
  // Compiler that array literal would be memoized and grow by one each render,
  // and React would report the changing length. Keep this hook uncompiled so
  // the array is fresh each render.
  "use no memo";

  let { bottom: safeBottom } = useSafeAreaInsets();
  let isInteractive = useRef(false);
  let pinToEnd = useRef(false);

  // LegendList's scroll bookkeeping is only stale before the first user
  // scroll: its scroll-to-end on open runs on estimated sizes and the native
  // maintainVisibleContentPosition adjustment silently carries the content the
  // rest of the way. Until then, "at the end" is exactly where it is.
  let hasUserScrolled = useRef(false);
  let onScrollBeginDrag = useCallback(() => {
    hasUserScrolled.current = true;
  }, []);

  let isAtEnd = useCallback(() => {
    let state = listRef.current?.getState();
    return hasMessages && (!hasUserScrolled.current || (state?.isAtEnd ?? false));
  }, [listRef, hasMessages]);

  let anchorToKeyboard = useCallback(() => {
    isInteractive.current = false;
    pinToEnd.current = isAtEnd();
  }, [isAtEnd]);

  let followKeyboard = useCallback(
    (inset: number, moveContent: boolean) => {
      // LegendList types the native ref loosely; it is the ScrollView instance.
      let scrollView = listRef.current?.getNativeScrollRef() as ScrollView | undefined;
      if (!scrollView) return;
      scrollView.setNativeProps({ contentInset: { bottom: inset } });
      if (moveContent && pinToEnd.current && !isInteractive.current) {
        scrollView.scrollToEnd({ animated: false });
      }
    },
    [listRef]
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
        scheduleOnRN(followKeyboard, insetFor(e.height, safeBottom), true);
      },
      onInteractive(e) {
        "worklet";
        scheduleOnRN(markInteractive);
        scheduleOnRN(followKeyboard, insetFor(e.height, safeBottom), false);
      },
      onEnd(e) {
        "worklet";
        scheduleOnRN(followKeyboard, insetFor(e.height, safeBottom), true);
      },
    },
    [anchorToKeyboard, followKeyboard, markInteractive, safeBottom]
  );

  useEffect(() => {
    if (!isAtEnd()) return;
    listRef.current?.scrollToEnd({ animated: false });
  }, [composerHeight, listRef, isAtEnd]);

  return { onScrollBeginDrag };
}
