import { HeaderLeafImg } from "@/components/ui/header-leaf-img";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Drawer } from "expo-router/drawer";

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
          headerTitle: HeaderLeafImg,
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
          headerTitle: HeaderLeafImg,
          headerShown: true,
          headerTintColor: textColor,
        }}
      />
    </Drawer>
  );
}
