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

jest.mock("@lingui/react");
jest.mock("@/src/i18n");
jest.mock("react-native-keyboard-controller");
jest.mock("zeego/context-menu");
jest.mock("zeego/dropdown-menu");
jest.mock("expo-haptics");
jest.mock("expo-clipboard");
jest.mock("@/utils/haptics");
