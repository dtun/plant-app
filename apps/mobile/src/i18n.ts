import { i18n, type Messages } from "@lingui/core";
import { messages as enMessages } from "./locales/en/messages.po";
import { messages as esMessages } from "./locales/es/messages.po";

export { i18n };

let localeMap: Record<string, Messages> = {
  en: enMessages,
  es: esMessages,
};

export function activateLocale(locale: string): void {
  let messages = localeMap[locale] ?? localeMap.en;
  i18n.loadAndActivate({ locale, messages });
}
