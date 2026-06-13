import { AnimatedMessageBubble } from "@/components/animated-message-bubble";
import { DaySeparator } from "@/components/chat/day-separator";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { ChatInput } from "@/components/ui/chat-input";
import { ChatHeaderMenu } from "@/components/chat/chat-header-menu";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { SubmitButton } from "@/components/ui/submit-button";
import { useChatContext } from "@/contexts/chat-context";
import { useComposer } from "@/contexts/composer-context";
import { useMessageList } from "@/contexts/message-list-context";
import { useLingui } from "@lingui/react/macro";
import { AnimatedLegendList } from "@legendapp/list/reanimated";
import { Stack } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import Animated, { FadeIn, useAnimatedProps } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useResolveClassNames } from "uniwind";

export function ChatLayout() {
  let { t } = useLingui();
  let { plant, handleClearChat } = useChatContext();
  let {
    messages,
    listData,
    flatListRef,
    keyboardHeight,
    isGenerating,
    getAnimationType,
  } = useMessageList();
  let {
    inputText,
    setInputText,
    pendingImageUri,
    setPendingImageUri,
    handleComposerLayout,
    handleAttachPhoto,
    handleSend,
  } = useComposer();

  let inputAreaStyle = useResolveClassNames("px-4 pt-2 bg-background");

  // Track the keyboard with a native scroll inset on the UI thread, so opening
  // the keyboard lifts the last messages without re-rendering or re-laying-out
  // the list (the v0 iOS approach). iOS-only prop; a no-op on Android.
  let listAnimatedProps = useAnimatedProps(() => ({
    contentInset: { bottom: keyboardHeight.value },
    scrollIndicatorInsets: { bottom: keyboardHeight.value },
  }));

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: plant?.name ?? t`Chat`,
          headerBackTitle: t`Chats`,
          headerRight: () => (
            <>
              {plant?.photoUri ? (
                <View className="w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    source={{ uri: plant.photoUri! }}
                    className="w-8 h-8"
                    accessibilityLabel={t`Photo of ${plant.name}`}
                  />
                </View>
              ) : null}
              <ChatHeaderMenu onClearChat={handleClearChat} />
            </>
          ),
        }}
      />

      <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1 }}>
        <AnimatedLegendList
          ref={flatListRef}
          animatedProps={listAnimatedProps}
          data={listData}
          estimatedItemSize={80}
          keyExtractor={(item, index) =>
            item.type === "message" ? item.message.id : `sep-${index}`
          }
          renderItem={({ item }) => {
            if (item.type === "separator") {
              return <DaySeparator label={item.label} />;
            }
            let animationType = getAnimationType(item.message.id, item.message.role);
            return (
              <AnimatedMessageBubble
                id={item.message.id}
                animationType={animationType}
                animationDelay={item.message.role === "assistant" ? 200 : 0}
                role={item.message.role}
                content={item.message.content}
                imageUri={item.message.imageUri}
              />
            );
          }}
          ListFooterComponent={isGenerating ? <TypingIndicator /> : null}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-8">
              <Text className="text-icon text-base text-center">
                {t`Say hello to ${plant?.name ?? t`your plant`}!`}
              </Text>
            </View>
          }
          alignItemsAtEnd
          maintainScrollAtEnd
          maintainScrollAtEndThreshold={0.1}
          maintainVisibleContentPosition
          contentContainerStyle={{
            // Only stretch/center for the empty state. When populated, leave
            // sizing to alignItemsAtEnd — flexGrow inflates the measured
            // content size and breaks its padding + scroll-range math.
            flexGrow: messages.length === 0 ? 1 : undefined,
            justifyContent: messages.length === 0 ? "center" : undefined,
            paddingTop: 8,
            paddingBottom: 8,
          }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        />
      </Animated.View>

      <KeyboardStickyView>
        <SafeAreaView edges={["bottom", "left", "right"]} style={inputAreaStyle}>
          {pendingImageUri ? (
            <View className="flex-row items-center mb-2">
              <View className="relative">
                <Image
                  source={{ uri: pendingImageUri }}
                  className="w-16 h-16 rounded-lg"
                  accessibilityLabel={t`Selected photo preview`}
                />
                <TouchableOpacity
                  onPress={() => setPendingImageUri(null)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full w-5 h-5 items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel={t`Remove selected photo`}
                >
                  <IconSymbol name="xmark" size={10} color="#fff" colorClassName={null} />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
          <ChatInput
            onLayout={handleComposerLayout}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t`Type a message...`}
            leftButton={<PhotoUpload selectedImage={null} onImageSelect={handleAttachPhoto} />}
            rightButton={
              <SubmitButton
                onPress={handleSend}
                disabled={(!inputText.trim() && !pendingImageUri) || isGenerating}
                isLoading={isGenerating}
              />
            }
          />
        </SafeAreaView>
      </KeyboardStickyView>
    </View>
  );
}
