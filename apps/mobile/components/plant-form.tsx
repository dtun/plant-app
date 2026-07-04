import { ActivityIndicator } from "@/components/ui/activity-indicator";
import { ChatInput } from "@/components/ui/chat-input";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { SubmitButton } from "@/components/ui/submit-button";
import { i18n } from "@/src/i18n";
import { intelligence, type PlantData } from "@/src/intelligence";
import { events } from "@/src/livestore/schema";
import { getDeviceId } from "@/utils/device";
import {
  pickImageFromLibrary,
  showPhotoPickerAlert,
  takePhotoWithCamera,
  type PhotoFailure,
} from "@/utils/photo-utils";
import { msg } from "@lingui/core/macro";
import { Trans, useLingui } from "@lingui/react/macro";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStore } from "@livestore/react";
import * as Crypto from "expo-crypto";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, Text, TextInput, View, Keyboard } from "react-native";
import { z } from "zod";
import {
  KeyboardAwareScrollView,
  useReanimatedKeyboardAnimation,
} from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

let leafImage = require("@/assets/images/KeepTend-Leaf.png");

const KEYBOARD_OPEN_GAP = 8;

let careTaglines = [
  msg`Your plants are lucky to have you`,
  msg`A little care goes a long way`,
  msg`Happy plants, happy home`,
  msg`Every leaf thanks you`,
  msg`Nurture today, bloom tomorrow`,
  msg`Small care, big growth`,
  msg`Your green friends are thriving`,
  msg`Tend with a little love`,
];

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
  let tagline = useMemo(() => careTaglines[Math.floor(Math.random() * careTaglines.length)], []);
  let insets = useSafeAreaInsets();
  let inputRef = useRef<TextInput>(null);
  // Stick the input to the keyboard via Reanimated (height.value is negative when open); KeyboardStickyView's legacy Animated driver fails to track the keyboard on RN 0.83 / Fabric, leaving the input covered.
  let { height, progress } = useReanimatedKeyboardAnimation();
  let inputAreaStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: height.value }],
    paddingBottom: KEYBOARD_OPEN_GAP + (insets.bottom - KEYBOARD_OPEN_GAP) * (1 - progress.value),
  }));

  // Focus on the next frame so the keyboard controller's observers are ready before the keyboard opens; autoFocus races that setup and leaves the input stranded behind the keyboard.
  useEffect(() => {
    let frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  let plantSchema = useMemo(
    () =>
      z
        .object({
          plantInput: z.string().optional(),
          photoDescription: z.string().optional(),
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
      size: undefined,
    },
  });

  let watchedFields = watch();
  let hasFieldsWithValues = !!(
    watchedFields.plantInput ||
    watchedFields.photoDescription ||
    watchedFields.size ||
    selectedImage
  );

  async function analyzePhoto(imageUri: string, base64?: string | null) {
    setIsAnalyzing(true);
    try {
      let result = await intelligence().generatePhotoDescription({ imageUri, base64 });
      if (!result.ok) {
        Alert.alert(t`Photo Analysis Error`, result.failure.message);
        return;
      }
      setValue("photoDescription", result.value);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function notifyPhotoFailure(failure: PhotoFailure, surface: "camera" | "library") {
    if (failure.kind === "cancelled") return;
    if (failure.kind === "permission-denied") {
      Alert.alert(
        t`Permission Required`,
        surface === "camera"
          ? t`Please allow access to your camera to take plant photos.`
          : t`Please allow access to your photo library to select plant photos.`
      );
      return;
    }
    Alert.alert(
      t`Error`,
      surface === "camera"
        ? t`Failed to take photo. Please try again.`
        : t`Failed to pick image. Please try again.`
    );
  }

  async function handlePickImage() {
    let result = await pickImageFromLibrary();
    if (result.ok) {
      setSelectedImage(result.uri);
      await analyzePhoto(result.uri, result.base64);
    } else {
      notifyPhotoFailure(result.failure, "library");
    }
  }

  async function handleTakePhoto() {
    let result = await takePhotoWithCamera();
    if (result.ok) {
      setSelectedImage(result.uri);
      await analyzePhoto(result.uri, result.base64);
    } else {
      notifyPhotoFailure(result.failure, "camera");
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
        description: data.plantInput || data.photoDescription || "Unknown",
        photoDescription: data.photoDescription || undefined,
        size: data.size || undefined,
      };

      let result = await intelligence().generatePlantName(plantData);

      if (!result.ok) {
        switch (result.failure.kind) {
          case "no-config":
          case "invalid-key":
            Alert.alert(t`AI Setup Required`, t`Please configure your AI settings first.`, [
              { text: t`Try Again`, style: "cancel" },
            ]);
            break;
          case "quota":
          case "network":
          case "unknown":
            Alert.alert(t`Error`, result.failure.message);
            break;
        }
        return;
      }

      let plantName = result.value;
      Alert.alert(t`Your Plant's Name`, `"${plantName}"`, [
        {
          text: t`Start Chat`,
          style: "default",
          onPress: () => savePlantAndStartChat(plantName, data),
        },
        { text: t`Cancel`, style: "cancel" },
      ]);
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
        <View className="flex-1 items-center justify-center gap-2">
          <View className="h-12 w-12">
            <Image
              source={leafImage}
              style={{ height: "100%", width: "100%" }}
              contentFit="contain"
            />
          </View>
          <Text className="text-center text-lg font-light text-color">{i18n._(tagline)}</Text>
        </View>
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
      </KeyboardAwareScrollView>
      <Animated.View style={inputAreaStyle}>
        <Controller
          control={control}
          name="plantInput"
          render={({ field: { onChange, onBlur, value } }) => (
            <ChatInput
              inputRef={inputRef}
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
      </Animated.View>
    </>
  );
}
