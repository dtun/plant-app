import React from "react";
import { View } from "react-native";

function KeyboardProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function KeyboardStickyView({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={style}>{children}</View>;
}

function useKeyboardHandler() {}

export { KeyboardProvider, KeyboardStickyView, useKeyboardHandler };
