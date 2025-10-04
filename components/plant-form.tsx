import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  analyzePhotoAndSetDescription,
  generatePlantName,
  type PlantData,
} from "@/utils/ai-service";
import {
  pickImageFromLibrary,
  showPhotoPickerAlert,
  takePhotoWithCamera,
} from "@/utils/photo-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import React, { useCallback, useLayoutEffect, useState } from "react";
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

let plantSchema = z
  .object({
    plantInput: z.string().optional(),
    photoDescription: z.string().optional(),
    size: z.enum(["Small", "Medium", "Large"]).optional(),
  })
  .refine(
    (data) => {
      // Plant input is required only if photoDescription is not provided
      return !!(data.plantInput || data.photoDescription);
    },
    {
      message: "Please describe your plant or add a photo",
      path: ["plantInput"], // Error shows on plant input field
    }
  );

type PlantFormData = z.infer<typeof plantSchema>;

let sizeOptions = ["Small", "Medium", "Large"] as const;

export function PlantForm() {
  let navigation = useNavigation();
  let textColor = useThemeColor({}, "text");
  let backgroundColor = useThemeColor({}, "background");
  let borderColor = useThemeColor({ light: "#ccc", dark: "#555" }, "icon");
  let placeholderColor = useThemeColor({ light: "#999", dark: "#666" }, "text");
  let tintColor = useThemeColor({}, "tint");
  let [isGenerating, setIsGenerating] = useState(false);
  let [selectedImage, setSelectedImage] = useState<string | null>(null);
  let [isAnalyzing, setIsAnalyzing] = useState(false);

  let {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PlantFormData>({
    resolver: zodResolver(plantSchema),
    defaultValues: {
      plantInput: "",
      photoDescription: "",
      size: "Small",
    },
  });

  let watchedFields = watch();
  let hasFieldsWithValues = !!(
    watchedFields.plantInput ||
    watchedFields.photoDescription ||
    watchedFields.size ||
    selectedImage
  );

  async function handlePickImage() {
    let result = await pickImageFromLibrary();
    if (!result.cancelled) {
      setSelectedImage(result.uri);
      await analyzePhotoAndSetDescription(
        result.uri,
        setIsAnalyzing,
        (description) => setValue("photoDescription", description),
        (error) => Alert.alert("Photo Analysis Error", error)
      );
    }
  }

  async function handleTakePhoto() {
    let result = await takePhotoWithCamera();
    if (!result.cancelled) {
      setSelectedImage(result.uri);
      await analyzePhotoAndSetDescription(
        result.uri,
        setIsAnalyzing,
        (description) => setValue("photoDescription", description),
        (error) => Alert.alert("Photo Analysis Error", error)
      );
    }
  }

  function handleShowImagePicker() {
    showPhotoPickerAlert(handleTakePhoto, handlePickImage);
  }

  function removePhoto() {
    setSelectedImage(null);
    setValue("photoDescription", "");
  }

  async function onSubmit(data: PlantFormData) {
    setIsGenerating(true);

    try {
      let plantData: PlantData = {
        plantType: "Plant", // We'll let AI determine from the combined input
        description: data.plantInput || data.photoDescription || "Unknown",
        photoDescription: data.photoDescription || undefined,
        size: data.size || undefined,
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

  let handleReset = useCallback(() => {
    reset();
    setSelectedImage(null);
  }, [reset, setSelectedImage]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: hasFieldsWithValues
        ? () => (
            <TouchableOpacity
              onPress={handleReset}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Reset form"
              accessibilityHint="Clear all form fields and start over"
              style={[styles.resetButton, { backgroundColor: backgroundColor }]}
            >
              <ThemedText
                style={[styles.resetButtonText, { color: textColor }]}
              >
                Reset
              </ThemedText>
            </TouchableOpacity>
          )
        : null,
    });
  }, [
    hasFieldsWithValues,
    navigation,
    handleReset,
    tintColor,
    textColor,
    backgroundColor,
  ]);

  return (
    <ThemedView style={styles.container}>
      {isAnalyzing && (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="small" color="#fff" />
          <ThemedText style={styles.analyzingText}>
            Analyzing photo...
          </ThemedText>
        </View>
      )}

      <Controller
        control={control}
        name="photoDescription"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={[styles.fieldContainer, !value && styles.hiddenField]}>
            <View style={styles.labelRow}>
              <ThemedText type="defaultSemiBold" style={styles.label}>
                Photo Analysis
              </ThemedText>

              {selectedImage && (
                <TouchableOpacity
                  onPress={removePhoto}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                  accessibilityHint="Remove the selected plant photo"
                  style={styles.removePhotoButton}
                >
                  <IconSymbol name="trash" size={20} color={textColor} />
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { color: textColor, borderColor, backgroundColor },
              ]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value || ""}
              placeholder="Autogenerated description will appear here"
              placeholderTextColor={placeholderColor}
              multiline
              numberOfLines={4}
              editable={true}
            />
            <ThemedText style={styles.helpText}>
              You can edit the autogenerated description if needed
            </ThemedText>
          </View>
        )}
      />

      <View style={styles.fieldContainer}>
        <ThemedText type="defaultSemiBold" style={styles.label}>
          What size is your plant?
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
                    value === size && [
                      styles.sizeOptionSelected,
                      { borderColor: borderColor },
                    ],
                  ]}
                  onPress={() => onChange(size)}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${size.toLowerCase()} size`}
                  accessibilityState={{ selected: value === size }}
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

      <View
        style={[styles.chatInputContainer, { borderColor, backgroundColor }]}
      >
        <Controller
          control={control}
          name="plantInput"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <View style={[styles.chatInputWrapper]}>
                <TextInput
                  style={[
                    styles.chatInput,
                    { color: textColor },
                    errors.plantInput && styles.inputError,
                  ]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder={
                    selectedImage ? "Anything else?" : "Describe your plant..."
                  }
                  placeholderTextColor={placeholderColor}
                  multiline
                  textAlignVertical="top"
                  returnKeyType="done"
                />
              </View>
              {errors.plantInput && (
                <ThemedText style={styles.chatInputError}>
                  {errors.plantInput.message}
                </ThemedText>
              )}
            </>
          )}
        />
        <View style={styles.chatInputButtons}>
          <View style={styles.chatPhotoButtonContainer}>
            <TouchableOpacity
              style={[styles.chatPhotoButton, { borderColor }]}
              onPress={handleShowImagePicker}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Add plant photo"
              accessibilityHint="Take a photo or select from library"
            >
              <IconSymbol name="camera.fill" size={24} color={textColor} />
            </TouchableOpacity>
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={styles.chatPhotoButtonImage}
              />
            ) : (
              <></>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.button,
              [styles.submitButton, { backgroundColor: tintColor }],
              isGenerating && styles.buttonDisabled,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isGenerating}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={
              isGenerating ? "Generating plant name" : "Generate plant name"
            }
            accessibilityHint="Create a unique name for your plant based on the provided details"
            accessibilityState={{ disabled: isGenerating }}
          >
            {isGenerating ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <ThemedText style={styles.buttonText}>
                <IconSymbol name="arrow.up" size={24} color="#fff" />
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

let styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    textAlign: "center",
  },
  fieldContainer: {
    gap: 8,
  },
  label: {},
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
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
    gap: 8,
  },
  sizeOption: {
    flex: 1,
    padding: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  sizeOptionSelected: {
    borderWidth: 1,
    borderRadius: 12,
    // backgroundColor and borderColor set dynamically via tintColor
  },
  sizeOptionText: {
    fontSize: 16,
  },
  sizeOptionTextSelected: {
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
  },
  button: {
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButton: {
    height: 48,
    width: 48,
    // backgroundColor set dynamically via tintColor
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
  analyzingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
  },
  analyzingText: {
    fontSize: 14,
    fontStyle: "italic",
  },
  hiddenField: {
    display: "none",
  },
  helpText: {
    fontSize: 12,
    fontStyle: "italic",
    opacity: 0.7,
  },
  removePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  chatInputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
    padding: 12,
  },
  chatInputWrapper: {
    flexDirection: "row",
    minHeight: 120,
  },
  chatInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    paddingRight: 12,
    paddingTop: 0,
    paddingBottom: 0,
  },
  chatPhotoButton: {
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: 48,
    height: 48,
  },
  chatInputError: {
    color: "#ff4444",
    fontSize: 14,
    marginTop: 8,
    marginLeft: 16,
  },
  chatInputButtons: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  resetButton: {
    borderRadius: 8,
    marginRight: 16,
    paddingHorizontal: 8,
    height: 32,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 4,
  },
  chatPhotoButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatPhotoButtonImage: {
    height: 48,
    width: 48,
    alignSelf: "center",
    borderRadius: 8,
  },
});
