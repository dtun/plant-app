export {};

declare module "@radix-ui/react-context-menu" {
  interface ContextMenuProps {
    onOpenWillChange?: (willOpen: boolean) => void;
  }
}

declare module "@radix-ui/react-dropdown-menu" {
  interface DropdownMenuProps {
    onOpenWillChange?: (willOpen: boolean) => void;
  }
}
