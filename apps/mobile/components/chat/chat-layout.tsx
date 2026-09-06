import { ChatHeader } from "@/components/chat/chat-header";
import { Composer } from "@/components/chat/composer";
import { MessageList } from "@/components/chat/message-list";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { SubmitButton } from "@/components/ui/submit-button";
import { useComposer } from "@/contexts/composer-context";
import { useMessageList } from "@/contexts/message-list-context";
import { testIds } from "@/src/testing/test-ids";
import { useLingui } from "@lingui/react/macro";
import { View } from "react-native";

/**
 * The chat screen, composed: a transparent header and a floating composer
 * layered over a message list that fills the screen and scrolls under both.
 */
export function ChatLayout() {
  let { t } = useLingui();
  let { isGenerating } = useMessageList();
  let { inputText, pendingImageUri, handleAttachPhoto, handleSend } = useComposer();

  return (
    <View className="flex-1 bg-background">
      <ChatHeader />
      <MessageList />
      <Composer>
        <Composer.Attachment />
        <Composer.Field placeholder={t`Type a message...`} testID={testIds.chat.composerInput} />
        <Composer.Toolbar>
          <PhotoUpload
            selectedImage={null}
            onImageSelect={handleAttachPhoto}
            testID={testIds.chat.attachPhotoButton}
          />
          <SubmitButton
            onPress={handleSend}
            disabled={(!inputText.trim() && !pendingImageUri) || isGenerating}
            isLoading={isGenerating}
            testID={testIds.chat.sendButton}
          />
        </Composer.Toolbar>
      </Composer>
    </View>
  );
}
