import { ReactNode } from "react";
import { Text, View } from "react-native";

interface FormFieldProps {
  children: ReactNode;
  error?: string;
  label?: string;
  required?: boolean;
  style?: any;
}

export function FormField({ children, error, label, required, style }: FormFieldProps) {
  return (
    <View className="gap-2" style={style}>
      {label ? (
        <Text className="text-base font-semibold text-color">
          {label}
          {required ? <Text className="text-error">*</Text> : null}
        </Text>
      ) : null}
      {children}
      {error ? <Text className="text-sm mt-1 text-error">{error}</Text> : null}
    </View>
  );
}
