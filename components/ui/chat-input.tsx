import { ThemedText } from "@/components/themed-text";
import { ReactNode } from "react";
import { TextInput, View } from "react-native";

interface ChatInputProps {
  error?: string;
  leftButton?: ReactNode;
  multiline?: boolean;
  numberOfLines?: number;
  onBlur?: () => void;
  onChangeText: (text: string) => void;
  placeholder?: string;
  rightButton?: ReactNode;
  value?: string;
}

export function ChatInput({
  error,
  leftButton,
  multiline = true,
  numberOfLines = 4,
  onBlur,
  onChangeText,
  placeholder,
  rightButton,
  value,
}: ChatInputProps) {
  return (
    <>
      <View className="border border-icon rounded-xl gap-2 p-2 pt-3 pb-2 bg-background">
        <View className="flex-row min-h-12">
          <TextInput
            className="flex-1 text-base text-color pr-3 mb-1 max-h-12 py-0 placeholder:text-placeholder"
            onBlur={onBlur}
            onChangeText={onChangeText}
            value={value}
            placeholder={placeholder}
            multiline={multiline}
            numberOfLines={numberOfLines}
          />
        </View>
        <View className="flex-row gap-2 justify-between">
          {leftButton}
          {rightButton}
        </View>
      </View>
      {error ? (
        <ThemedText className="text-error text-sm mt-2 ml-4">
          {error}
        </ThemedText>
      ) : null}
    </>
  );
}
