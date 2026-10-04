import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLingui } from "@lingui/react/macro";
import { Drawer } from "expo-router/drawer";
import { useResolveClassNames } from "uniwind";

export default function DrawerLayout() {
  let { t } = useLingui();
  let tintColor = useResolveClassNames("text-color").color?.toString();

  return (
    <Drawer
      screenOptions={{
        drawerActiveTintColor: tintColor,
        // Other screens bring their own native header via `DrawerStack`.
        headerShown: false,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerIcon: ({ color }) => <IconSymbol size={28} name="leaf" color={color} />,
          drawerLabel: t`Home`,
          title: t`Home`,
          headerShown: true,
          headerTintColor: tintColor,
          headerTitle: () => null,
          headerTransparent: true,
        }}
      />
      <Drawer.Screen
        name="chats"
        options={{
          drawerIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
          drawerLabel: t`Chats`,
          title: t`Chats`,
        }}
      />
      <Drawer.Screen
        name="ai-settings"
        options={{
          drawerIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
          drawerLabel: t`AI Settings`,
          title: t`AI Settings`,
        }}
      />
      <Drawer.Screen
        name="share"
        options={{
          drawerIcon: ({ color }) => (
            <IconSymbol size={28} name="qrcode.viewfinder" color={color} />
          ),
          drawerLabel: t`Share`,
          title: t`Share`,
        }}
      />
    </Drawer>
  );
}
