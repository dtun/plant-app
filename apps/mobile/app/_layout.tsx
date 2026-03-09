import { createAdapter, getStoreId } from "@/db/store";
import { useColorScheme } from "@/hooks/use-color-scheme";
import "@/polyfills/crypto";
import "@/polyfills/intl";
import { activateLocale, i18n } from "@/src/i18n";
import { schema } from "@/src/livestore/schema";
import { initializeDeviceId } from "@/utils/device";
import { I18nProvider } from "@lingui/react";
import { LiveStoreProvider } from "@livestore/react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { getLocales } from "expo-localization";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import "react-native-reanimated";
import "../global.css";

export const unstable_settings = {
  anchor: "(drawer)",
};

export default function RootLayout() {
  let [isReady, setIsReady] = useState(false);
  let colorScheme = useColorScheme();

  useEffect(() => {
    let deviceLocale = getLocales()[0]?.languageCode ?? "en";
    activateLocale(deviceLocale);
    initializeDeviceId().then(() => setIsReady(true));
  }, []);

  // Create device-specific adapter only after device ID is initialized
  let adapter = useMemo(() => (isReady ? createAdapter() : null), [isReady]);
  let storeId = useMemo(() => (isReady ? getStoreId() : ""), [isReady]);
  // React 19 has automatic batching, but LiveStoreProvider requires this prop
  // Using identity function since batching is automatic
  let batchUpdates = useMemo(() => (fn: () => void) => fn(), []);

  if (!isReady || !adapter) {
    return null;
  }

  return (
    <I18nProvider i18n={i18n}>
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
              <Stack.Screen name="chat/[plantId]" options={{ headerShown: true }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </KeyboardProvider>
      </LiveStoreProvider>
    </I18nProvider>
  );
}
