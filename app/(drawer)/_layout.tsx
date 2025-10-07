import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Image } from "expo-image";
import { Drawer } from "expo-router/drawer";
import React from "react";
import { StyleSheet } from "react-native";

let leafImage = require("@/assets/images/KeepTend-Leaf.png");

export default function DrawerLayout() {
  let colorScheme = useColorScheme();
  let tintColor = Colors[colorScheme ?? "light"].tint;
  let textColor = useThemeColor({}, "text");

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
            <IconSymbol size={28} name="leaf" color={color} />
          ),
          headerTitle: () => (
            <Image source={leafImage} style={styles.leafImage} />
          ),
          headerLeft: () => null,
          headerShown: true,
          headerTintColor: tintColor,
        }}
      />
      <Drawer.Screen
        name="share"
        options={{
          drawerLabel: "Share",
          title: "Share",
          drawerIcon: ({ color }) => (
            <IconSymbol size={28} name="qrcode.viewfinder" color={color} />
          ),
          headerTitle: () => (
            <Image source={leafImage} style={styles.leafImage} />
          ),
          headerShown: true,
          headerTintColor: textColor,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: "Settings",
          title: "Settings",
          drawerItemStyle: { display: "none" },
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
          drawerIcon: ({ color }) => (
            <IconSymbol size={28} name="wrench" color={color} />
          ),
          headerShown: true,
          headerTintColor: textColor,
        }}
      />
    </Drawer>
  );
}

let styles = StyleSheet.create({
  leafImage: {
    height: 32,
    width: 32,
    alignSelf: "center",
    marginVertical: 4,
  },
});
