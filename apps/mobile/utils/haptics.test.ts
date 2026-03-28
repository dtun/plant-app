jest.unmock("@/utils/haptics");

import * as Haptics from "expo-haptics";
import * as haptics from "./haptics";

beforeEach(() => {
  jest.clearAllMocks();
});

test("success() triggers success notification", () => {
  haptics.success();

  expect(Haptics.notificationAsync).toHaveBeenCalledWith(
    Haptics.NotificationFeedbackType.Success,
  );
});

test("warning() triggers warning notification", () => {
  haptics.warning();

  expect(Haptics.notificationAsync).toHaveBeenCalledWith(
    Haptics.NotificationFeedbackType.Warning,
  );
});

test("error() triggers error notification", () => {
  haptics.error();

  expect(Haptics.notificationAsync).toHaveBeenCalledWith(
    Haptics.NotificationFeedbackType.Error,
  );
});

test("light() triggers light impact", () => {
  haptics.light();

  expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
});

test("medium() triggers medium impact", () => {
  haptics.medium();

  expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
});

test("selection() triggers selection feedback", () => {
  haptics.selection();

  expect(Haptics.selectionAsync).toHaveBeenCalled();
});
