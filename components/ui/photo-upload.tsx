import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Image } from "expo-image";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface PhotoUploadProps {
  onImageSelect: () => void;
  onRemoveImage?: () => void;
  selectedImage?: string | null;
  size?: number;
}

export function PhotoUpload({
  onImageSelect,
  onRemoveImage,
  selectedImage,
  size = 48,
}: PhotoUploadProps) {
  let textColor = useThemeColor({}, "text");
  let borderColor = useThemeColor({ light: "#ccc", dark: "#555" }, "icon");

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { borderColor, width: size, height: size }]}
        onPress={onImageSelect}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Add plant photo"
        accessibilityHint="Take a photo or select from library"
      >
        <IconSymbol name="camera.fill" size={20} color={textColor} />
      </TouchableOpacity>
      {selectedImage ? (
        <Image
          source={{ uri: selectedImage }}
          style={[styles.image, { width: size, height: size }]}
        />
      ) : null}
    </View>
  );
}

let styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  button: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  image: {
    alignSelf: "center",
    borderRadius: 8,
  },
});
