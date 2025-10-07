import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ChatInput } from "@/components/ui/chat-input";
import { FormField } from "@/components/ui/form-field";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { SizeSelector } from "@/components/ui/size-selector";
import { SubmitButton } from "@/components/ui/submit-button";
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
import { router } from "expo-router";
import { useCallback, useLayoutEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
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
    plantType: z.string().optional(),
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
      plantType: "",
      size: undefined,
    },
  });

  let watchedFields = watch();
  let hasFieldsWithValues = !!(
    watchedFields.plantInput ||
    watchedFields.photoDescription ||
    watchedFields.plantType ||
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
    Keyboard.dismiss();
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
        plantType: data.plantType || "Plant", // Use provided type or default
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
            {
              text: "Go to AI Setup",
              style: "default",
              onPress: () => router.push("/(drawer)/ai-setup"),
            },
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
              style={[styles.resetButton]}
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
  }, [hasFieldsWithValues, navigation, handleReset, tintColor, textColor]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        About your plant
      </ThemedText>

      <FormField
        label="What type of plant is it?"
        error={errors.plantType?.message}
      >
        <Controller
          control={control}
          name="plantType"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                styles.input,
                {
                  color: textColor,
                  borderColor,
                  backgroundColor,
                },
              ]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value || ""}
              placeholder="e.g., Succulent, Fern, Flowering Plant..."
              placeholderTextColor={placeholderColor}
            />
          )}
        />
      </FormField>

      <FormField label="What size is your plant?" error={errors.size?.message}>
        <Controller
          control={control}
          name="size"
          render={({ field: { onChange, value } }) => (
            <SizeSelector
              options={sizeOptions}
              value={value}
              onChange={onChange}
            />
          )}
        />
      </FormField>

      {isAnalyzing ? (
        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="small" color={textColor} />
          <ThemedText style={styles.analyzingText}>
            Analyzing photo...
          </ThemedText>
        </View>
      ) : null}

      {watchedFields.photoDescription ? (
        <Controller
          control={control}
          name="photoDescription"
          render={({ field: { onChange, onBlur, value } }) => (
            <FormField label="Photo Analysis">
              <View style={styles.labelRow}>
                <View style={{ flex: 1 }}>
                  <ChatInput
                    value={value || ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Autogenerated description will appear here"
                    numberOfLines={4}
                  />
                </View>
                {selectedImage ? (
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
                ) : null}
              </View>
              <ThemedText style={styles.helpText}>
                You can edit the autogenerated description if needed
              </ThemedText>
            </FormField>
          )}
        />
      ) : null}

      <Controller
        control={control}
        name="plantInput"
        render={({ field: { onChange, onBlur, value } }) => (
          <ChatInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={
              selectedImage ? "Anything else?" : "Describe your plant..."
            }
            error={errors.plantInput?.message}
            leftButton={
              <PhotoUpload
                selectedImage={selectedImage}
                onImageSelect={handleShowImagePicker}
              />
            }
            rightButton={
              <SubmitButton
                onPress={handleSubmit(onSubmit)}
                isLoading={isGenerating}
              />
            }
          />
        )}
      />
    </ThemedView>
  );
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    gap: 16,
  },
  title: {
    textAlign: "center",
    fontSize: 32,
    fontWeight: "300",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  resetButton: {
    marginRight: 16,
  },
  resetButtonText: {
    fontSize: 16,
    paddingVertical: 4,
  },
});
