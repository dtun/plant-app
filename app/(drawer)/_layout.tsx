import { HeaderLeafImg } from "@/components/ui/header-leaf-img";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Drawer } from "expo-router/drawer";

export default function DrawerLayout() {
  let textColor = useThemeColor({}, "text");

  return (
    <Drawer
      screenOptions={{
        drawerActiveTintColor: textColor,
        headerShown: true,
        headerTintColor: textColor,
        headerTitle: HeaderLeafImg,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerIcon: ({ color }) => (
            <IconSymbol size={28} name="leaf" color={color} />
          ),
          drawerLabel: "Home",
          title: "Home",
        }}
      />
      <Drawer.Screen
        name="share"
        options={{
          drawerIcon: ({ color }) => (
            <IconSymbol size={28} name="qrcode.viewfinder" color={color} />
          ),
          drawerLabel: "Share",
          title: "Share",
        }}
      />
    </Drawer>
  );
}
