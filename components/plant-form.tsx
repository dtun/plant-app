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
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";

let plantSchema = z.object({
  plantType: z.string().min(1, "Plant type is required"),
  description: z.string().min(1, "Plant description is required"),
  photoDescription: z.string().optional(),
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
  let tintColor = useThemeColor({}, "tint");
  let [isGenerating, setIsGenerating] = useState(false);
  let [selectedImage, setSelectedImage] = useState<string | null>(null);
  let [isAnalyzing, setIsAnalyzing] = useState(false);

  let {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PlantFormData>({
    resolver: zodResolver(plantSchema),
    defaultValues: {
      plantType: "",
      description: "",
      photoDescription: "",
      size: undefined,
    },
  });

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
        plantType: data.plantType,
        description: data.description,
        photoDescription: data.photoDescription || undefined,
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
        Describe Your Plant
      </ThemedText>

      {selectedImage ? (
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: selectedImage }}
            style={styles.photoPreview}
            accessible={true}
            accessibilityRole="image"
            accessibilityLabel="Selected plant photo"
          />
          <TouchableOpacity
            style={[styles.photoButton, styles.removePhotoButton]}
            onPress={removePhoto}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
            accessibilityHint="Remove the selected plant photo"
          >
            <ThemedText
              style={[styles.photoButtonText, styles.removePhotoButtonText]}
            >
              Remove Photo
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.primaryPhotoButton,
            { borderColor: tintColor, backgroundColor: `${tintColor}15` },
          ]}
          onPress={handleShowImagePicker}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Add plant photo"
          accessibilityHint="Take a photo or select from library to help identify your plant"
        >
          <View style={styles.primaryPhotoButtonContent}>
            <IconSymbol name="camera.fill" size={32} color={tintColor} />
            <ThemedText
              style={[styles.primaryPhotoButtonText, { color: tintColor }]}
            >
              Add Plant Photo
            </ThemedText>
          </View>
        </TouchableOpacity>
      )}
      {isAnalyzing && (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="small" color={tintColor} />
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
            <ThemedText type="defaultSemiBold" style={styles.label}>
              AI Photo Analysis
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { color: textColor, borderColor, backgroundColor },
              ]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value || ""}
              placeholder="AI-generated description will appear here"
              placeholderTextColor={placeholderColor}
              multiline
              numberOfLines={4}
              editable={true}
            />
            <ThemedText style={styles.helpText}>
              You can edit the AI-generated description if needed
            </ThemedText>
          </View>
        )}
      />

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
          Plant Description *
        </ThemedText>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { color: textColor, borderColor, backgroundColor },
                errors.description && styles.inputError,
              ]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Describe your plant's appearance and personality"
              placeholderTextColor={placeholderColor}
              multiline
              numberOfLines={5}
            />
          )}
        />
        {errors.description && (
          <ThemedText style={styles.errorText}>
            {errors.description.message}
          </ThemedText>
        )}
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
                    value === size && [
                      styles.sizeOptionSelected,
                      { backgroundColor: tintColor, borderColor: tintColor },
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
      <View style={styles.buttonContainer}>
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
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Reset form"
          accessibilityHint="Clear all form fields and start over"
        >
          <ThemedText style={styles.resetButtonText}>Reset</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

let styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    textAlign: "center",
  },
  fieldContainer: {
    marginBottom: 8,
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
    // backgroundColor and borderColor set dynamically via tintColor
  },
  sizeOptionText: {
    fontSize: 16,
  },
  sizeOptionTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  buttonContainer: {
    marginTop: 16,
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
  photoContainer: {
    alignItems: "center",
    gap: 12,
  },
  photoPreview: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  photoButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginVertical: 8,
    borderStyle: "dashed",
  },
  primaryPhotoButton: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginVertical: 8,
    minHeight: 120,
    justifyContent: "center",
  },
  primaryPhotoButtonContent: {
    alignItems: "center",
    gap: 12,
  },
  primaryPhotoButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  removePhotoButton: {
    backgroundColor: "#ff4444",
    borderColor: "#ff4444",
  },
  removePhotoButtonText: {
    color: "#fff",
  },
  analyzingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
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
    marginTop: 4,
    fontStyle: "italic",
    opacity: 0.7,
  },
});
