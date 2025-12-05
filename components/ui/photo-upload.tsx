import { IconSymbol } from "@/components/ui/icon-symbol";
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
  return (
    <View className="flex-row items-center gap-2">
      <TouchableOpacity
        className="rounded items-center justify-center bg-gray-900 dark:bg-gray-800"
        style={{ width: size, height: size }}
        onPress={onImageSelect}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Add plant photo"
        accessibilityHint="Take a photo or select from library"
      >
        <IconSymbol
          colorClassName={null}
          name="camera.fill"
          size={20}
          color="#fff"
        />
      </TouchableOpacity>
      {selectedImage ? (
        <Image
          source={{ uri: selectedImage }}
          className="self-center rounded"
          style={{ width: size, height: size }}
        />
      ) : null}
    </View>
  );
}
