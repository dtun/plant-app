import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ReactNode } from "react";
import { StyleSheet, TextInput, View } from "react-native";

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
  let textColor = useThemeColor({}, "text");
  let backgroundColor = useThemeColor({}, "background");
  let borderColor = useThemeColor({ light: "#ccc", dark: "#555" }, "icon");
  let placeholderColor = useThemeColor({ light: "#999", dark: "#666" }, "text");

  return (
    <>
      <View style={[styles.container, { borderColor, backgroundColor }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.input,
              { color: textColor },
              error && styles.inputError,
            ]}
            onBlur={onBlur}
            onChangeText={onChangeText}
            value={value}
            placeholder={placeholder}
            placeholderTextColor={placeholderColor}
            multiline={multiline}
            numberOfLines={numberOfLines}
          />
        </View>
        <View style={styles.buttonsContainer}>
          {leftButton}
          {rightButton}
        </View>
      </View>
      {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
    </>
  );
}

let styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
    padding: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    minHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    paddingRight: 12,
    paddingTop: 0,
    paddingBottom: 0,
  },
  inputError: {
    borderColor: "#ff4444",
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 14,
    marginTop: 8,
    marginLeft: 16,
  },
});
