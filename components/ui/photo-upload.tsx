import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Image } from "expo-image";
import { TouchableOpacity, View } from "react-native";

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
  size = 32,
}: PhotoUploadProps) {
  let textColor = useThemeColor({}, "text");
  let borderColor = useThemeColor({ light: "#ccc", dark: "#555" }, "icon");

  return (
    <View className="flex-row items-center gap-2">
      <TouchableOpacity
        className="rounded-lg border items-center justify-center gap-2"
        style={{ borderColor, width: size, height: size }}
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
          className="self-center rounded-lg"
          style={{ width: size, height: size }}
        />
      ) : null}
    </View>
  );
}
