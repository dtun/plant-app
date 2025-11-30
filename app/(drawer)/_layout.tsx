import { HeaderLeafImg } from "@/components/ui/header-leaf-img";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Drawer } from "expo-router/drawer";
import { useResolveClassNames } from "uniwind";

export default function DrawerLayout() {
  let tintColor = useResolveClassNames("text-color").color?.toString();

  return (
    <Drawer
      screenOptions={{
        drawerActiveTintColor: tintColor,
        headerShown: true,
        headerTintColor: tintColor,
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
