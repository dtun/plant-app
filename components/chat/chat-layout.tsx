import { AnimatedMessageBubble } from "@/components/animated-message-bubble";
import { DaySeparator } from "@/components/chat/day-separator";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { ChatInput } from "@/components/ui/chat-input";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { SubmitButton } from "@/components/ui/submit-button";
import { useChatContext } from "@/contexts/chat-context";
import { useComposer } from "@/contexts/composer-context";
import { useMessageList } from "@/contexts/message-list-context";
import { LegendList } from "@legendapp/list";
import { Stack } from "expo-router";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useResolveClassNames } from "uniwind";

export function ChatLayout() {
  let { plant, handleClearChat } = useChatContext();
  let {
    messages,
    listData,
    flatListRef,
    scrollToBottom,
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

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: plant?.name ?? "Chat",
          headerBackTitle: "Chats",
          headerRight: () => (
            <>
              {plant?.photoUri ? (
                <View className="w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    source={{ uri: plant.photoUri! }}
                    className="w-8 h-8"
                    accessibilityLabel={`Photo of ${plant.name}`}
                  />
                </View>
              ) : null}
              <Pressable
                onPress={handleClearChat}
                className="self-center"
                accessibilityRole="button"
                accessibilityLabel="Chat options"
                accessibilityHint="Opens chat options menu"
              >
                <Text className="text-base px-2 text-color p-1">Reset</Text>
              </Pressable>
            </>
          ),
        }}
      />

      <Animated.View entering={FadeIn.duration(200)} style={{ flex: 1 }}>
        <LegendList
          ref={flatListRef}
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
                Say hello to {plant?.name ?? "your plant"}!
              </Text>
            </View>
          }
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: messages.length === 0 ? "center" : "flex-end",
            paddingTop: 8,
            paddingBottom: keyboardHeight > 0 ? keyboardHeight + 8 : 8,
          }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToBottom}
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
                  accessibilityLabel="Selected photo preview"
                />
                <TouchableOpacity
                  onPress={() => setPendingImageUri(null)}
                  className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full w-5 h-5 items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Remove selected photo"
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
            placeholder="Type a message..."
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
