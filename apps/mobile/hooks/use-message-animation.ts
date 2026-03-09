import { useRef } from "react";

export type AnimationType = "slide-up" | "fade-in" | "none";

export function useMessageAnimation() {
  let newMessageIds = useRef(new Set<string>());

  function markAsNew(id: string) {
    newMessageIds.current.add(id);
  }

  function isNewMessage(id: string): boolean {
    return newMessageIds.current.has(id);
  }

  function getAnimationType(id: string, role: string): AnimationType {
    if (!newMessageIds.current.has(id)) {
      return "none";
    }
    return role === "user" ? "slide-up" : "fade-in";
  }

  return { markAsNew, isNewMessage, getAnimationType };
}
