declare module "*.po" {
  import type { Messages } from "@lingui/core";
  export let messages: Messages;
}
