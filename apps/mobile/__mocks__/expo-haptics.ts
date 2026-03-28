export let NotificationFeedbackType = {
  Success: "success",
  Warning: "warning",
  Error: "error",
};

export let ImpactFeedbackStyle = {
  Light: "light",
  Medium: "medium",
  Heavy: "heavy",
};

export let notificationAsync = jest.fn();
export let impactAsync = jest.fn();
export let selectionAsync = jest.fn();
