/**
 * The single source of truth for `testID`s on instrumented screens.
 * Convention and platform notes: docs/testing/test-ids.md.
 *
 * Frozen lookup tables are true constants (never reassigned, never mutated),
 * so `const` is the right keyword here per ADR 0002.
 */

const plantList = Object.freeze({
  namePlantButton: "plant-list.name-plant-button",
  row: "plant-list.row",
});

const plantForm = Object.freeze({
  descriptionInput: "plant-form.description-input",
  photoButton: "plant-form.photo-button",
  submitButton: "plant-form.submit-button",
  removePhotoButton: "plant-form.remove-photo-button",
  resetButton: "plant-form.reset-button",
});

const chat = Object.freeze({
  composerInput: "chat.composer-input",
  sendButton: "chat.send-button",
  attachPhotoButton: "chat.attach-photo-button",
  removeAttachmentButton: "chat.remove-attachment-button",
  headerMenuButton: "chat.header-menu-button",
  message: "chat.message",
});

const settings = Object.freeze({
  apiKeyInput: "settings.api-key-input",
  providerOption: "settings.provider-option",
  saveButton: "settings.save-button",
  resetButton: "settings.reset-button",
});

export const testIds = Object.freeze({ plantList, plantForm, chat, settings });

/** A row in the plant list; the dynamic segment is the plant id. */
export function plantRowTestId(plantId: string): string {
  return `${plantList.row}.${plantId}`;
}

/** A message bubble in the chat; the dynamic segment is the message id. */
export function chatMessageTestId(messageId: string): string {
  return `${chat.message}.${messageId}`;
}

/** A provider choice on the settings screen; the dynamic segment is the lower-cased provider name. */
export function providerOptionTestId(provider: string): string {
  return `${settings.providerOption}.${provider.toLowerCase()}`;
}
