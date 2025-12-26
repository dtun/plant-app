import { createAdapter, getStoreId } from "@/db/store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import "@/polyfills/crypto";
import { schema } from "@/src/livestore/schema";
import { LiveStoreProvider } from "@livestore/react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";
import "../global.css";

export const unstable_settings = {
  anchor: "(drawer)",
};

export default function RootLayout() {
  let colorScheme = useColorScheme();
  // Create device-specific adapter
  let adapter = useMemo(() => createAdapter(), []);
  let storeId = useMemo(() => getStoreId(), []);
  // React 19 has automatic batching, but LiveStoreProvider requires this prop
  // Using identity function since batching is automatic
  let batchUpdates = useMemo(() => (fn: () => void) => fn(), []);

  return (
    <LiveStoreProvider
      schema={schema}
      storeId={storeId}
      adapter={adapter}
      batchUpdates={batchUpdates}
    >
      <KeyboardProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(drawer)" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </KeyboardProvider>
    </LiveStoreProvider>
  );
}
