import { ActivityIndicator } from "@/components/ui/activity-indicator";
import { ChatInput } from "@/components/ui/chat-input";
import { FormField } from "@/components/ui/form-field";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { SubmitButton } from "@/components/ui/submit-button";
import { events } from "@/src/livestore/schema";
import {
  analyzePhotoAndSetDescription,
  generatePlantName,
  type PlantData,
} from "@/utils/ai-service";
import { getDeviceId } from "@/utils/device";
import {
  pickImageFromLibrary,
  showPhotoPickerAlert,
  takePhotoWithCamera,
} from "@/utils/photo-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStore } from "@livestore/react";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, FlatList, Keyboard, Pressable, Text, TextInput, View } from "react-native";
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

interface PlantFormProps {
  setOptions?: (options: Partial<object>) => void;
}

export function PlantForm({ setOptions }: PlantFormProps = {}) {
  let [isGenerating, setIsGenerating] = useState(false);
  let [selectedImage, setSelectedImage] = useState<string | null>(null);
  let [isAnalyzing, setIsAnalyzing] = useState(false);
  let { store } = useStore();
  let router = useRouter();

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

  function savePlantAndStartChat(plantName: string, data: PlantFormData): void {
    try {
      let plantId = Crypto.randomUUID();
      let userId = getDeviceId();
      let now = Date.now();

      store.commit(
        events.plantCreated({
          id: plantId,
          userId,
          name: plantName,
          description: data.plantInput || data.photoDescription || undefined,
          size: data.size || undefined,
          photoUri: selectedImage || undefined,
          aiAnalysis: data.photoDescription || undefined,
          createdAt: now,
          updatedAt: now,
        })
      );

      handleReset();
      router.push(`/chat/${plantId}`);
    } catch (error) {
      console.error("Error saving plant:", error);

      let errorMessage = "Failed to save plant. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert("Save Error", errorMessage);
    }
  }

  async function onSubmit(data: PlantFormData) {
    setIsGenerating(true);

    Keyboard.dismiss();

    try {
      let plantData: PlantData = {
        plantType: data.plantType || "Plant", // Use provided type or default
        description: data.plantInput || data.photoDescription || "Unknown",
        photoDescription: data.photoDescription || undefined,
        size: data.size || undefined,
      };

      let plantName = await generatePlantName(plantData);

      Alert.alert("Your Plant's Name", `"${plantName}"`, [
        {
          text: "Start Chat",
          style: "default",
          onPress: () => savePlantAndStartChat(plantName, data),
        },
        { text: "Cancel", style: "cancel" },
      ]);
    } catch (error) {
      console.error("Error generating plant name:", error);

      let errorMessage = "Failed to generate plant name. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (errorMessage.includes("configuration not found")) {
        Alert.alert("AI Setup Required", "Please configure your AI settings first.", [
          { text: "Try Again", style: "cancel" },
        ]);
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

  useEffect(() => {
    setOptions?.({
      headerRight: hasFieldsWithValues
        ? () => (
            <Pressable
              onPress={handleReset}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Reset form"
              accessibilityHint="Clear all form fields and start over"
              className="mr-4"
            >
              <Text className="text-base py-1 text-color">Reset</Text>
            </Pressable>
          )
        : null,
    });
  }, [hasFieldsWithValues, handleReset, setOptions]);

  return (
    <FlatList
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "flex-end",
        gap: 16,
      }}
      data={[
        {
          render: (
            <FormField label="What type of plant is it?" error={errors.plantType?.message}>
              <Controller
                control={control}
                name="plantType"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="border border-icon rounded-xl px-3 py-3 text-base text-color bg-background placeholder:text-placeholder"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value || ""}
                    placeholder="e.g., Succulent, Fern, Flowering Plant..."
                  />
                )}
              />
            </FormField>
          ),
        },
        {
          render: isAnalyzing ? (
            <View className="flex-row items-center justify-center gap-1 py-2">
              <ActivityIndicator size="small" colorClassName="text-color" />
              <Text className="text-sm italic text-color">Analyzing photo...</Text>
            </View>
          ) : null,
        },
        {
          render: watchedFields.photoDescription ? (
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-semibold text-color">Photo Analysis</Text>
              {selectedImage ? (
                <Pressable
                  onPress={removePhoto}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                  accessibilityHint="Remove the selected plant photo"
                  className="flex-row items-center gap-1 py-1 px-2"
                >
                  <IconSymbol name="trash" size={20} />
                </Pressable>
              ) : null}
            </View>
          ) : null,
        },
        {
          render: (
            <Controller
              control={control}
              name="plantInput"
              render={({ field: { onChange, onBlur, value } }) => (
                <ChatInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={selectedImage ? "Anything else?" : "Describe your plant..."}
                  error={errors.plantInput?.message}
                  leftButton={
                    <PhotoUpload
                      selectedImage={selectedImage}
                      onImageSelect={handleShowImagePicker}
                    />
                  }
                  rightButton={
                    <SubmitButton onPress={handleSubmit(onSubmit)} isLoading={isGenerating} />
                  }
                />
              )}
            />
          ),
        },
      ].filter((item) => item.render)}
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <Text className="text-center text-2xl font-light text-color">About your plant</Text>
      }
      renderItem={({ item: { render } }) => render}
      className="flex-1"
    />
  );
}
