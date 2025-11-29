import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Image } from "expo-image";
import { Drawer } from "expo-router/drawer";
import React from "react";
import { View } from "react-native";

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
            <View className="h-8 w-8">
              <Image source={leafImage} style={{ height: "100%" }} />
            </View>
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
            <View className="h-8 w-8">
              <Image source={leafImage} style={{ height: "100%" }} />
            </View>
          ),
          headerShown: true,
          headerTintColor: textColor,
        }}
      />
    </Drawer>
  );
}
