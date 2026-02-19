import { i18n } from "@lingui/core";

export { i18n };

export async function activateLocale(locale: string): Promise<void> {
  let { messages } = await import(`./locales/${locale}/messages.po`);
  i18n.loadAndActivate({ locale, messages });
}
