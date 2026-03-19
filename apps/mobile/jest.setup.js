// Jest setup for React Native Testing Library
// Note: @testing-library/react-native v12.4+ has built-in Jest matchers
// No need to import extend-expect separately

// Mock react-native-worklets before importing reanimated
jest.mock("react-native-worklets", () => require("react-native-worklets/lib/module/mock"));

// Mock react-native-reanimated
require("react-native-reanimated").setUpTests();

// Enable manual mocks from __mocks__ directories
// Jest will look for the implementation in the __mocks__ folder
jest.mock("uniwind");
jest.mock("expo-sqlite");
jest.mock("expo-constants");
jest.mock("expo-file-system");
jest.mock("expo-crypto");
jest.mock("@livestore/adapter-expo");
jest.mock("@livestore/livestore");
jest.mock("@livestore/react");
jest.mock("@/src/livestore/schema");

jest.mock("@lingui/react", () => {
  let passthrough = (d) => {
    let message = d?.message ?? d?.id ?? String(d);
    if (d?.values) {
      Object.keys(d.values).forEach((key) => {
        message = message.replace(`{${key}}`, String(d.values[key]));
      });
    }
    return message;
  };
  return {
    I18nProvider: ({ children }) => children,
    useLingui: () => ({
      i18n: { _: passthrough, locale: "en" },
      _: passthrough,
    }),
    Trans: ({ children, id, message }) => message ?? id ?? children,
  };
});

// Mock @/src/i18n to avoid importing .po files in tests.
// Activate the real i18n singleton so utility functions using i18n._() work.
jest.mock("@/src/i18n", () => {
  let { i18n: mockI18n } = require("@lingui/core");
  mockI18n.loadAndActivate({ locale: "en", messages: {} });
  return { i18n: mockI18n, activateLocale: () => {} };
});

jest.mock("react-native-keyboard-controller", () =>
  require("react-native-keyboard-controller/jest")
);
