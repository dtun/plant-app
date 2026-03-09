import { renderHook } from "@testing-library/react-native";

import { useMessageAnimation } from "./use-message-animation";

test("returns 'none' for messages not marked as new", () => {
  let { result } = renderHook(() => useMessageAnimation());

  expect(result.current.getAnimationType("msg-1", "user")).toBe("none");
  expect(result.current.getAnimationType("msg-2", "assistant")).toBe("none");
});

test("returns 'slide-up' for new user messages", () => {
  let { result } = renderHook(() => useMessageAnimation());

  result.current.markAsNew("msg-1");

  expect(result.current.getAnimationType("msg-1", "user")).toBe("slide-up");
});

test("returns 'fade-in' for new assistant messages", () => {
  let { result } = renderHook(() => useMessageAnimation());

  result.current.markAsNew("msg-2");

  expect(result.current.getAnimationType("msg-2", "assistant")).toBe("fade-in");
});

test("isNewMessage returns true for marked messages", () => {
  let { result } = renderHook(() => useMessageAnimation());

  expect(result.current.isNewMessage("msg-1")).toBe(false);

  result.current.markAsNew("msg-1");

  expect(result.current.isNewMessage("msg-1")).toBe(true);
});

test("tracks multiple message IDs independently", () => {
  let { result } = renderHook(() => useMessageAnimation());

  result.current.markAsNew("msg-1");
  result.current.markAsNew("msg-2");

  expect(result.current.getAnimationType("msg-1", "user")).toBe("slide-up");
  expect(result.current.getAnimationType("msg-2", "assistant")).toBe("fade-in");
  expect(result.current.getAnimationType("msg-3", "user")).toBe("none");
});
