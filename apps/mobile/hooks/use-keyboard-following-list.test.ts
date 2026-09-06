import { act, renderHook } from "@testing-library/react-native";
import { useKeyboardHandler } from "react-native-keyboard-controller";

import { useKeyboardFollowingList } from "./use-keyboard-following-list";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

let KEYBOARD_HEIGHT = 335;
/** The keyboard height minus the bottom safe area the composer reserves. */
let EXPECTED_INSET = 301;

function makeList({ isAtEnd }: { isAtEnd: boolean }) {
  let scrollView = { setNativeProps: jest.fn(), scrollToEnd: jest.fn() };
  let list = {
    getState: () => ({ isAtEnd }),
    getNativeScrollRef: () => scrollView,
    scrollToEnd: jest.fn(),
  };
  return { list, scrollView, ref: { current: list as never } };
}

/** The keyboard handler the hook most recently registered. */
function keyboard() {
  let calls = (useKeyboardHandler as jest.Mock).mock.calls;
  return calls[calls.length - 1][0];
}

/** Worklet hand-offs to JS are queued as microtasks in the test mocks. */
async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

type Options = { hasMessages: boolean; composerHeight: number };

function render(ref: { current: never }, options: Options = { hasMessages: true, composerHeight: 120 }) {
  return renderHook((props: Options) => useKeyboardFollowingList(ref, props), {
    initialProps: options,
  });
}

describe("useKeyboardFollowingList", () => {
  test("opening the keyboard at the end insets the list and keeps the end in view", async () => {
    let { ref, scrollView } = makeList({ isAtEnd: true });
    render(ref);

    keyboard().onStart({ height: KEYBOARD_HEIGHT });
    keyboard().onMove({ height: KEYBOARD_HEIGHT });
    await flush();

    expect(scrollView.setNativeProps).toHaveBeenCalledWith({
      contentInset: { bottom: EXPECTED_INSET },
    });
    expect(scrollView.scrollToEnd).toHaveBeenCalledWith({ animated: false });
  });

  test("mid-history after a user scroll, only the inset follows", async () => {
    let { ref, scrollView } = makeList({ isAtEnd: false });
    let { result } = render(ref);

    act(() => result.current.onScrollBeginDrag());
    keyboard().onStart({ height: KEYBOARD_HEIGHT });
    keyboard().onMove({ height: KEYBOARD_HEIGHT });
    await flush();

    expect(scrollView.setNativeProps).toHaveBeenCalledWith({
      contentInset: { bottom: EXPECTED_INSET },
    });
    expect(scrollView.scrollToEnd).not.toHaveBeenCalled();
  });

  test("before any user scroll, the list is treated as at the end even if it says otherwise", async () => {
    let { ref, scrollView } = makeList({ isAtEnd: false });
    render(ref);

    keyboard().onStart({ height: KEYBOARD_HEIGHT });
    keyboard().onMove({ height: KEYBOARD_HEIGHT });
    await flush();

    expect(scrollView.scrollToEnd).toHaveBeenCalled();
  });

  test("interactive dismissal never moves the content", async () => {
    let { ref, scrollView } = makeList({ isAtEnd: true });
    render(ref);

    keyboard().onInteractive({ height: 200 });
    keyboard().onEnd({ height: 0 });
    await flush();

    expect(scrollView.setNativeProps).toHaveBeenCalledWith({ contentInset: { bottom: 166 } });
    expect(scrollView.setNativeProps).toHaveBeenCalledWith({ contentInset: { bottom: 0 } });
    expect(scrollView.scrollToEnd).not.toHaveBeenCalled();
  });

  test("an empty list has no end to keep in view", async () => {
    let { ref, scrollView, list } = makeList({ isAtEnd: true });
    render(ref, { hasMessages: false, composerHeight: 120 });

    keyboard().onStart({ height: KEYBOARD_HEIGHT });
    keyboard().onMove({ height: KEYBOARD_HEIGHT });
    await flush();

    expect(scrollView.scrollToEnd).not.toHaveBeenCalled();
    expect(list.scrollToEnd).not.toHaveBeenCalled();
  });

  test("the inset never goes below zero", async () => {
    let { ref, scrollView } = makeList({ isAtEnd: true });
    render(ref);

    keyboard().onMove({ height: 10 });
    await flush();

    expect(scrollView.setNativeProps).toHaveBeenCalledWith({ contentInset: { bottom: 0 } });
  });

  test("a growing composer keeps the end in view", () => {
    let { ref, list } = makeList({ isAtEnd: true });
    let { rerender } = render(ref);
    let callsAfterMount = list.scrollToEnd.mock.calls.length;

    rerender({ hasMessages: true, composerHeight: 160 });

    expect(list.scrollToEnd.mock.calls.length).toBe(callsAfterMount + 1);
    expect(list.scrollToEnd).toHaveBeenLastCalledWith({ animated: false });
  });

  test("hands the keyboard handler a fresh, constant-length dependency array each render", () => {
    let { ref } = makeList({ isAtEnd: true });
    let { rerender } = render(ref);
    let calls = (useKeyboardHandler as jest.Mock).mock.calls;
    let first = calls[calls.length - 1][1];

    rerender({ hasMessages: true, composerHeight: 120 });
    let second = calls[calls.length - 1][1];

    // Reanimated pushes a worklet hash into whatever array it is given, so a
    // reused array would grow by one every render.
    expect(second).not.toBe(first);
    expect(second).toHaveLength(first.length);
  });
});
