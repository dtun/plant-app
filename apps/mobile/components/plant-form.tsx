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
import { Trans, useLingui } from "@lingui/react/macro";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStore } from "@livestore/react";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, Text, TextInput, View, Keyboard } from "react-native";
import { z } from "zod";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";

interface PlantFormProps {
  setOptions?: (options: Partial<object>) => void;
}

export function PlantForm({ setOptions }: PlantFormProps = {}) {
  let { t } = useLingui();
  let [isGenerating, setIsGenerating] = useState(false);
  let [selectedImage, setSelectedImage] = useState<string | null>(null);
  let [isAnalyzing, setIsAnalyzing] = useState(false);
  let { store } = useStore();
  let router = useRouter();

  let plantSchema = useMemo(
    () =>
      z
        .object({
          plantInput: z.string().optional(),
          photoDescription: z.string().optional(),
          plantType: z.string().optional(),
          size: z.enum(["Small", "Medium", "Large"]).optional(),
        })
        .refine(
          (data) => {
            return !!(data.plantInput || data.photoDescription);
          },
          {
            message: t`Please describe your plant or add a photo`,
            path: ["plantInput"],
          }
        ),
    [t]
  );

  type PlantFormData = z.infer<typeof plantSchema>;

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
        (error) => Alert.alert(t`Photo Analysis Error`, error)
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
        (error) => Alert.alert(t`Photo Analysis Error`, error)
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

      let errorMessage = t`Failed to save plant. Please try again.`;
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert(t`Save Error`, errorMessage);
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

      Alert.alert(t`Your Plant's Name`, `"${plantName}"`, [
        {
          text: t`Start Chat`,
          style: "default",
          onPress: () => savePlantAndStartChat(plantName, data),
        },
        { text: t`Cancel`, style: "cancel" },
      ]);
    } catch (error) {
      console.error("Error generating plant name:", error);

      let errorMessage = t`Failed to generate plant name. Please try again.`;
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (errorMessage.includes("configuration not found")) {
        Alert.alert(t`AI Setup Required`, t`Please configure your AI settings first.`, [
          { text: t`Try Again`, style: "cancel" },
        ]);
      } else {
        Alert.alert(t`Error`, errorMessage);
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
              accessibilityLabel={t`Reset form`}
              accessibilityHint={t`Clear all form fields and start over`}
              className="mr-4"
            >
              <Text className="text-base py-1 text-color">
                <Trans>Reset</Trans>
              </Text>
            </Pressable>
          )
        : null,
    });
  }, [hasFieldsWithValues, handleReset, setOptions, t]);

  return (
    <>
      <KeyboardAwareScrollView
        bounces={false}
        contentContainerStyle={{ flex: 1, gap: 16, justifyContent: "flex-end" }}
      >
        <Text className="text-center text-2xl font-light text-color">
          <Trans>About your plant</Trans>
        </Text>
        <FormField label={t`What type of plant is it?`} error={errors.plantType?.message}>
          <Controller
            control={control}
            name="plantType"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="border border-icon rounded-xl px-3 py-3 text-base text-color bg-background placeholder:text-placeholder"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value || ""}
                placeholder={t`e.g., Succulent, Fern, Flowering Plant...`}
              />
            )}
          />
          {isAnalyzing || watchedFields.photoDescription ? (
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-semibold text-color">
                {isAnalyzing ? <Trans>Analyzing photo...</Trans> : <Trans>Photo Analysis</Trans>}
              </Text>
              {isAnalyzing ? (
                <ActivityIndicator size="small" colorClassName="text-color" />
              ) : (
                <Pressable
                  onPress={removePhoto}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t`Remove photo`}
                  accessibilityHint={t`Remove the selected plant photo`}
                  className="flex-row items-center gap-1 py-1 px-2"
                >
                  <IconSymbol name="trash" size={20} />
                </Pressable>
              )}
            </View>
          ) : null}
        </FormField>
      </KeyboardAwareScrollView>
      <KeyboardStickyView>
        <Controller
          control={control}
          name="plantInput"
          render={({ field: { onChange, onBlur, value } }) => (
            <ChatInput
              autoFocus
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={selectedImage ? t`Anything else?` : t`Describe your plant...`}
              error={errors.plantInput?.message}
              leftButton={
                <PhotoUpload selectedImage={selectedImage} onImageSelect={handleShowImagePicker} />
              }
              rightButton={
                <SubmitButton
                  onPress={handleSubmit(onSubmit)}
                  isLoading={isGenerating || isAnalyzing}
                />
              }
            />
          )}
        />
      </KeyboardStickyView>
    </>
  );
}
