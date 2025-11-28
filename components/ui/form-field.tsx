import { ThemedText } from "@/components/themed-text";
import { ReactNode } from "react";
import { View } from "react-native";

interface FormFieldProps {
  children: ReactNode;
  error?: string;
  label?: string;
  required?: boolean;
  style?: any;
}

export function FormField({
  children,
  error,
  label,
  required,
  style,
}: FormFieldProps) {
  return (
    <View className="gap-2" style={style}>
      {label ? (
        <ThemedText type="defaultSemiBold">
          {label}
          {required ? <ThemedText className="text-error">*</ThemedText> : null}
        </ThemedText>
      ) : null}
      {children}
      {error ? (
        <ThemedText className="text-error text-sm mt-1">{error}</ThemedText>
      ) : null}
    </View>
  );
}
