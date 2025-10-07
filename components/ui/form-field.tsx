import { ThemedText } from "@/components/themed-text";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

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
    <View style={[styles.container, style]}>
      {label ? (
        <ThemedText type="defaultSemiBold" style={styles.label}>
          {label}
          {required ? <ThemedText style={styles.required}>*</ThemedText> : null}
        </ThemedText>
      ) : null}
      {children}
      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
    </View>
  );
}

let styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {},
  required: {
    color: "#ff4444",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 14,
    marginTop: 4,
  },
});
