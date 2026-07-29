import { IconSymbol } from "@/components/ui/icon-symbol";
import { useLingui } from "@lingui/react/macro";
import { Image } from "expo-image";
import { TouchableOpacity, View } from "react-native";
import { useResolveClassNames } from "uniwind";

interface PhotoUploadProps {
  onImageSelect: () => void;
  onRemoveImage?: () => void;
  selectedImage?: string | null;
  size?: number;
}

export function PhotoUpload({
  onImageSelect,
  selectedImage,
  size = 32,
}: PhotoUploadProps) {
  let { t } = useLingui();
  let { borderRadius: borderRadiusLg } = useResolveClassNames('rounded-lg');
  return (
    <View className="flex-row items-center gap-2">
      <TouchableOpacity
        className="rounded-lg items-center justify-center bg-gray-900 dark:bg-gray-800"
        style={{ width: size, height: size }}
        onPress={onImageSelect}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={t`Add plant photo`}
        accessibilityHint={t`Take a photo or select from library`}
      >
        <IconSymbol colorClassName={null} name="camera.fill" size={20} color="#fff" />
      </TouchableOpacity>
      {selectedImage ? (
        <Image
          source={{ uri: selectedImage }}
          className="self-center rounded-lg"
          style={{ width: size, height: size, borderRadius: borderRadiusLg }}
          />
      ) : null}
    </View>
  );
}
