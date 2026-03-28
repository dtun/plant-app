import { IconSymbol } from "@/components/ui/icon-symbol";
import * as haptics from "@/utils/haptics";
import { useLingui } from "@lingui/react/macro";
import { Pressable } from "react-native";
import * as DropdownMenu from "zeego/dropdown-menu";

interface ChatHeaderMenuProps {
  onClearChat: () => void;
}

export function ChatHeaderMenu({ onClearChat }: ChatHeaderMenuProps) {
  let { t } = useLingui();

  return (
    <DropdownMenu.Root onOpenWillChange={(open) => open && haptics.selection()}>
      <DropdownMenu.Trigger>
        <Pressable
          className="self-center"
          accessibilityRole="button"
          accessibilityLabel={t`Chat options`}
          accessibilityHint={t`Opens chat options menu`}
        >
          <IconSymbol name="ellipsis.circle" size={22} colorClassName="text-color" />
        </Pressable>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item key="share" disabled>
          <DropdownMenu.ItemTitle>{t`Share`}</DropdownMenu.ItemTitle>
          <DropdownMenu.ItemSubtitle>{t`Coming soon`}</DropdownMenu.ItemSubtitle>
          <DropdownMenu.ItemIcon ios={{ name: "square.and.arrow.up" }} />
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item key="clear" onSelect={onClearChat} destructive>
          <DropdownMenu.ItemTitle>{t`Clear Chat`}</DropdownMenu.ItemTitle>
          <DropdownMenu.ItemIcon ios={{ name: "trash" }} />
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
