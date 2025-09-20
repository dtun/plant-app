import { useThemeColor } from "@/hooks/use-theme-color";
import { generatePlantName, type PlantData } from "@/utils/ai-service";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

let plantSchema = z.object({
  plantType: z.string().min(1, "Plant type is required"),
  appearance: z.string().min(1, "Appearance is required"),
  personality: z.string().optional(),
  size: z.enum(["Small", "Medium", "Large"], {
    required_error: "Size is required",
  }),
});

type PlantFormData = z.infer<typeof plantSchema>;

let sizeOptions = ["Small", "Medium", "Large"] as const;

export function PlantForm() {
  let textColor = useThemeColor({}, "text");
  let backgroundColor = useThemeColor({}, "background");
  let borderColor = useThemeColor({ light: "#ccc", dark: "#555" }, "icon");
  let placeholderColor = useThemeColor({ light: "#999", dark: "#666" }, "text");
  let [isGenerating, setIsGenerating] = useState(false);

  let {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlantFormData>({
    resolver: zodResolver(plantSchema),
    defaultValues: {
      plantType: "",
      appearance: "",
      personality: "",
      size: undefined,
    },
  });

  async function onSubmit(data: PlantFormData) {
    setIsGenerating(true);

    try {
      let plantData: PlantData = {
        plantType: data.plantType,
        appearance: data.appearance,
        personality: data.personality || undefined,
        size: data.size,
      };

      let plantName = await generatePlantName(plantData);

      Alert.alert("Your Plant's Name", `Meet "${plantName}"!`, [
        { text: "Perfect!", style: "default" },
      ]);

      console.log("Generated plant name:", plantName);
      console.log("Plant data:", plantData);
    } catch (error) {
      console.error("Error generating plant name:", error);

      let errorMessage = "Failed to generate plant name. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (errorMessage.includes("configuration not found")) {
        Alert.alert(
          "AI Setup Required",
          "Please configure your AI settings first.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Go to Settings", style: "default" },
          ]
        );
      } else {
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  function handleReset() {
    reset();
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Name Your Plant
      </ThemedText>
      <View style={styles.fieldContainer}>
        <ThemedText type="defaultSemiBold" style={styles.label}>
          Plant Type *
        </ThemedText>
        <Controller
          control={control}
          name="plantType"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                styles.input,
                { color: textColor, borderColor, backgroundColor },
                errors.plantType && styles.inputError,
              ]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="e.g., Fiddle Leaf Fig"
              placeholderTextColor={placeholderColor}
            />
          )}
        />
        {errors.plantType && (
          <ThemedText style={styles.errorText}>
            {errors.plantType.message}
          </ThemedText>
        )}
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText type="defaultSemiBold" style={styles.label}>
          Appearance *
        </ThemedText>
        <Controller
          control={control}
          name="appearance"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { color: textColor, borderColor, backgroundColor },
                errors.appearance && styles.inputError,
              ]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Describe how your plant looks"
              placeholderTextColor={placeholderColor}
              multiline
              numberOfLines={3}
            />
          )}
        />
        {errors.appearance && (
          <ThemedText style={styles.errorText}>
            {errors.appearance.message}
          </ThemedText>
        )}
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText type="defaultSemiBold" style={styles.label}>
          Personality (Optional)
        </ThemedText>
        <Controller
          control={control}
          name="personality"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { color: textColor, borderColor, backgroundColor },
              ]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value || ""}
              placeholder="Describe your plant's personality"
              placeholderTextColor={placeholderColor}
              multiline
              numberOfLines={2}
            />
          )}
        />
      </View>
      <View style={styles.fieldContainer}>
        <ThemedText type="defaultSemiBold" style={styles.label}>
          Size *
        </ThemedText>
        <Controller
          control={control}
          name="size"
          render={({ field: { onChange, value } }) => (
            <View style={styles.sizeContainer}>
              {sizeOptions.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeOption,
                    { borderColor },
                    value === size && styles.sizeOptionSelected,
                  ]}
                  onPress={() => onChange(size)}
                >
                  <ThemedText
                    style={[
                      styles.sizeOptionText,
                      value === size && styles.sizeOptionTextSelected,
                    ]}
                  >
                    {size}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
        {errors.size && (
          <ThemedText style={styles.errorText}>
            {errors.size.message}
          </ThemedText>
        )}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.submitButton,
            isGenerating && styles.buttonDisabled,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator size="small" color="#fff" />
              <ThemedText
                style={[styles.buttonText, styles.buttonTextWithIcon]}
              >
                Generating Name...
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.buttonText}>
              Generate Plant Name
            </ThemedText>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.resetButton, { borderColor }]}
          onPress={handleReset}
        >
          <ThemedText style={styles.resetButtonText}>Reset</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

let styles = StyleSheet.create({
  container: {},
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
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: "#ff4444",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 14,
    marginTop: 4,
  },
  sizeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  sizeOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  sizeOptionSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  sizeOptionText: {
    fontSize: 16,
  },
  sizeOptionTextSelected: {
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
    backgroundColor: "#007AFF",
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
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonTextWithIcon: {
    marginLeft: 0,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
