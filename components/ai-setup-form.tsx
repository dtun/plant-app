import { zodResolver } from "@hookform/resolvers/zod";
import "expo-sqlite/localStorage/install";
import React, { useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { z } from "zod";

import { FormField } from "./ui/form-field";
import { OptionSelector } from "./ui/option-selector";

let aiSetupSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  provider: z.enum(["OpenAI", "Anthropic"], {
    required_error: "Provider is required",
  }),
});

type AISetupFormData = z.infer<typeof aiSetupSchema>;

let providerOptions = ["OpenAI", "Anthropic"] as const;

interface AISetupFormProps {
  onSaved?: () => void;
}

export function AISetupForm({ onSaved }: AISetupFormProps) {
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
      let storedApiKey = globalThis.localStorage.getItem("ai_user_api_key");
      let storedProvider = globalThis.localStorage.getItem("ai_user_provider");

      if (storedApiKey) {
        setValue("apiKey", storedApiKey);
      }
      if (storedProvider && (storedProvider === "OpenAI" || storedProvider === "Anthropic")) {
        setValue("provider", storedProvider as "OpenAI" | "Anthropic");
      }
    } catch (error) {
      console.error("Error loading stored settings:", error);
    }
  }, [setValue]);

  function onSubmit(data: AISetupFormData) {
    try {
      globalThis.localStorage.setItem("ai_user_api_key", data.apiKey);
      globalThis.localStorage.setItem("ai_user_provider", data.provider);

      console.log("AI Setup saved:", {
        provider: data.provider,
        apiKeyLength: data.apiKey.length,
      });
      Alert.alert("Settings Saved", "Your AI configuration has been saved successfully.");
      onSaved?.();
    } catch (error) {
      console.error("Error saving settings:", error);
      Alert.alert("Error", "Failed to save settings. Please try again.");
    }
  }

  function handleReset() {
    try {
      globalThis.localStorage.removeItem("ai_user_api_key");
      globalThis.localStorage.removeItem("ai_user_provider");
      reset({ apiKey: "", provider: undefined });
      Alert.alert("Settings Reset", "Your AI configuration has been reset.");
      onSaved?.();
    } catch (error) {
      console.error("Error resetting settings:", error);
      Alert.alert("Error", "Failed to reset settings. Please try again.");
    }
  }

  useEffect(() => {
    loadStoredSettings();
  }, [loadStoredSettings]);

  return (
    <View className="flex-1 gap-4">
      <FormField label="API Key" required error={errors.apiKey?.message}>
        <Controller
          control={control}
          name="apiKey"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="border border-icon rounded-xl p-3 text-base text-color bg-background"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Enter your API key"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        />
      </FormField>

      <FormField label="Provider" required error={errors.provider?.message}>
        <Controller
          control={control}
          name="provider"
          render={({ field: { onChange, value } }) => (
            <OptionSelector options={providerOptions} value={value} onChange={onChange} />
          )}
        />
      </FormField>

      <View className="mt-8 gap-3">
        <TouchableOpacity
          className="rounded-xl p-4 items-center bg-tint"
          onPress={handleSubmit(onSubmit)}
        >
          <Text className="text-white text-base font-semibold">Save Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity className="rounded-xl p-4 items-center" onPress={handleReset}>
          <Text className="text-base font-semibold text-color">Reset All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
