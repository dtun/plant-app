import { DrawerToggleButton } from "@react-navigation/drawer";
import { useLingui } from "@lingui/react/macro";
import { Stack } from "expo-router";

/**
 * A drawer screen's own native stack, so its header matches the chat screen's:
 * a transparent native header with a text title, the screen scrolling under it.
 * The drawer toggle stands in for the back button.
 */
export function DrawerStack({ title }: { title: string }) {
  let { t } = useLingui();

  return (
    <Stack
      screenOptions={{
        title,
        headerTransparent: true,
        headerLeft: ({ tintColor }) => (
          <DrawerToggleButton tintColor={tintColor} accessibilityLabel={t`Show navigation menu`} />
        ),
      }}
    />
  );
}
