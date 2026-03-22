import { i18n as mockI18n } from "@lingui/core";

mockI18n.loadAndActivate({ locale: "en", messages: {} });

export let i18n = mockI18n;
export function activateLocale() {}
