import { IconSymbol } from "@/components/ui/icon-symbol";
import { useComposer } from "@/contexts/composer-context";
import { withAlpha } from "@/utils/color";
import { useLingui } from "@lingui/react/macro";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  type ColorValue,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResolveClassNames } from "uniwind";

/**
 * The floating composer dock: a card that sits over the bottom of the message
 * list and rides the keyboard. The list scrolls underneath it, through a fade
 * to the screen background, and pads its content by the dock's measured height
 * (see `MessageList`) so nothing rests hidden behind it.
 *
 * Compose the card's contents from the parts below:
 *
 *   <Composer>
 *     <Composer.Attachment />
 *     <Composer.Field placeholder={...} />
 *     <Composer.Toolbar>{buttons}</Composer.Toolbar>
 *   </Composer>
 */
export function Composer({ children }: { children: ReactNode }) {
  let insets = useSafeAreaInsets();
  let { handleComposerLayout } = useComposer();
  let fade = useBackdropFade();

  return (
    // When the keyboard is open the bottom safe area sits under the keyboard,
    // so lift the dock by keyboard height minus that inset: the card lands
    // right on the keyboard instead of floating a home-indicator above it.
    <KeyboardStickyView
      offset={{ opened: insets.bottom }}
      style={styles.dock}
      onLayout={handleComposerLayout}
    >
      {fade ? (
        <LinearGradient pointerEvents="none" colors={fade} style={StyleSheet.absoluteFill} />
      ) : null}
      <View className="px-3 pt-4" style={{ paddingBottom: insets.bottom + 8 }}>
        <View className="rounded-3xl border border-icon bg-background p-2 pt-3 gap-2">
          {children}
        </View>
      </View>
    </KeyboardStickyView>
  );
}

/** Preview of the photo queued to send with the next message, if any. */
function Attachment() {
  let { t } = useLingui();
  let { pendingImageUri, setPendingImageUri } = useComposer();

  if (!pendingImageUri) return null;

  return (
    <View className="flex-row items-center px-2 pt-1">
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
  );
}

/** The message text field. Grows with its content up to a few lines. */
function Field({ placeholder }: { placeholder: string }) {
  let { inputText, setInputText } = useComposer();

  return (
    <TextInput
      className="text-base text-color px-2 py-0 min-h-10 max-h-28 placeholder:text-placeholder"
      value={inputText}
      onChangeText={setInputText}
      placeholder={placeholder}
      accessibilityLabel={placeholder}
      multiline
    />
  );
}

/** Row of actions under the field: leading controls left, send right. */
function Toolbar({ children }: { children: ReactNode }) {
  return <View className="flex-row items-center justify-between">{children}</View>;
}

Composer.Attachment = Attachment;
Composer.Field = Field;
Composer.Toolbar = Toolbar;

/**
 * Gradient from transparent to the screen background, so messages scrolling
 * under the dock fade out instead of being clipped. Null when the resolved
 * background color can't be decomposed, in which case the dock is just
 * transparent around the card.
 */
function useBackdropFade(): readonly [ColorValue, ColorValue] | null {
  let { backgroundColor } = useResolveClassNames("bg-background");
  let clear = withAlpha(backgroundColor, 0);
  return backgroundColor !== undefined && clear ? [clear, backgroundColor] : null;
}

let styles = StyleSheet.create({
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
