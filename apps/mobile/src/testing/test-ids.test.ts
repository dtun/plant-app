import { chatMessageTestId, plantRowTestId, providerOptionTestId, testIds } from "./test-ids";

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)+$/;

function allStaticIds(): string[] {
  return Object.values(testIds).flatMap((screen) => Object.values(screen));
}

test("every static testID is unique", () => {
  let ids = allStaticIds();
  expect(new Set(ids).size).toBe(ids.length);
});

test("every static testID follows the kebab-case <screen>.<element> convention", () => {
  for (let id of allStaticIds()) {
    expect(id).toMatch(ID_PATTERN);
  }
});

test("dynamic ids put the dynamic segment last", () => {
  expect(plantRowTestId("abc-123")).toBe("plant-list.row.abc-123");
  expect(chatMessageTestId("msg-1")).toBe("chat.message.msg-1");
  expect(providerOptionTestId("OpenAI")).toBe("settings.provider-option.openai");
});
