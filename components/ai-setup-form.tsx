import { zodResolver } from "@hookform/resolvers/zod";
import "expo-sqlite/localStorage/install";
import React, { useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";

import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

let aiSetupSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  provider: z.enum(["OpenAI", "Anthropic"], {
    required_error: "Provider is required",
  }),
});

type AISetupFormData = z.infer<typeof aiSetupSchema>;

let providerOptions = ["OpenAI", "Anthropic"] as const;

export function AISetupForm() {
  let textColor = useThemeColor({}, "text");
  let backgroundColor = useThemeColor({}, "background");
  let borderColor = useThemeColor({ light: "#ccc", dark: "#555" }, "icon");
  let placeholderColor = useThemeColor({ light: "#999", dark: "#666" }, "text");
  let tintColor = useThemeColor({}, "tint");
  let {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AISetupFormData>({
    resolver: zodResolver(aiSetupSchema),
    defaultValues: {
      apiKey: "",
      provider: undefined,
    },
  });

  let loadStoredSettings = useCallback(() => {
    try {
      let storedApiKey = globalThis.localStorage.getItem("ai_api_key");
      let storedProvider = globalThis.localStorage.getItem("ai_provider");

      if (storedApiKey) {
        setValue("apiKey", storedApiKey);
      }
      if (
        storedProvider &&
        (storedProvider === "OpenAI" || storedProvider === "Anthropic")
      ) {
        setValue("provider", storedProvider as "OpenAI" | "Anthropic");
      }
    } catch (error) {
      console.error("Error loading stored settings:", error);
    }
  }, [setValue]);

  function onSubmit(data: AISetupFormData) {
    try {
      globalThis.localStorage.setItem("ai_api_key", data.apiKey);
      globalThis.localStorage.setItem("ai_provider", data.provider);

      console.log("AI Setup saved:", {
        provider: data.provider,
        apiKeyLength: data.apiKey.length,
      });
      Alert.alert(
        "Settings Saved",
        "Your AI configuration has been saved successfully."
      );
    } catch (error) {
      console.error("Error saving settings:", error);
      Alert.alert("Error", "Failed to save settings. Please try again.");
    }
  }

  function handleReset() {
    try {
      globalThis.localStorage.removeItem("ai_api_key");
      globalThis.localStorage.removeItem("ai_provider");
      reset();
      Alert.alert("Settings Reset", "All AI settings have been cleared.");
    } catch (error) {
      console.error("Error resetting settings:", error);
      Alert.alert("Error", "Failed to reset settings. Please try again.");
    }
  }

  useEffect(() => {
    loadStoredSettings();
  }, [loadStoredSettings]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        AI Configuration
      </ThemedText>

      <View style={styles.fieldContainer}>
        <ThemedText type="defaultSemiBold" style={styles.label}>
          API Key *
        </ThemedText>
        <Controller
          control={control}
          name="apiKey"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                styles.input,
                { color: textColor, borderColor, backgroundColor },
                errors.apiKey && styles.inputError,
              ]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Enter your API key"
              placeholderTextColor={placeholderColor}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />
        {errors.apiKey && (
          <ThemedText style={styles.errorText}>
            {errors.apiKey.message}
          </ThemedText>
        )}
      </View>

      <View style={styles.fieldContainer}>
        <ThemedText type="defaultSemiBold" style={styles.label}>
          Provider *
        </ThemedText>
        <Controller
          control={control}
          name="provider"
          render={({ field: { onChange, value } }) => (
            <View style={styles.providerContainer}>
              {providerOptions.map((provider) => (
                <TouchableOpacity
                  key={provider}
                  style={[
                    styles.providerOption,
                    { borderColor },
                    value === provider && [
                      styles.providerOptionSelected,
                      { backgroundColor: tintColor, borderColor: tintColor },
                    ],
                  ]}
                  onPress={() => onChange(provider)}
                >
                  <ThemedText
                    style={[
                      styles.providerOptionText,
                      value === provider && styles.providerOptionTextSelected,
                    ]}
                  >
                    {provider}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
        {errors.provider && (
          <ThemedText style={styles.errorText}>
            {errors.provider.message}
          </ThemedText>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            [styles.submitButton, { backgroundColor: tintColor }],
          ]}
          onPress={handleSubmit(onSubmit)}
        >
          <ThemedText style={styles.buttonText}>Save Settings</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.resetButton, { borderColor }]}
          onPress={handleReset}
        >
          <ThemedText style={styles.resetButtonText}>Reset All</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

let styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  title: {
    marginBottom: 24,
    textAlign: "center",
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: "#ff4444",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 14,
    marginTop: 4,
  },
  providerContainer: {
    flexDirection: "row",
    gap: 12,
  },
  providerOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  providerOptionSelected: {
    // backgroundColor and borderColor set dynamically via tintColor
  },
  providerOptionText: {
    fontSize: 16,
  },
  providerOptionTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  buttonContainer: {
    marginTop: 32,
    gap: 12,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  submitButton: {
    // backgroundColor set dynamically via tintColor
  },
  resetButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
