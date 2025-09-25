import { Drawer } from "expo-router/drawer";
import React from "react";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function DrawerLayout() {
  let colorScheme = useColorScheme();
  let tintColor = Colors[colorScheme ?? "light"].tint;

  return (
    <Drawer
      screenOptions={{
        drawerActiveTintColor: tintColor,
        headerShown: false,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: "Home",
          title: "Home",
          drawerIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
          headerTitle: "",
          headerShown: true,
          headerTintColor: tintColor,
          headerTransparent: true,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: "Settings",
          title: "Settings",
          drawerIcon: ({ color }) => (
            <IconSymbol size={28} name="gear" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="ai-setup"
        options={{
          drawerLabel: "AI Setup",
          title: "AI Setup",
          drawerItemStyle: { display: "none" },
        }}
      />
    </Drawer>
  );
}
