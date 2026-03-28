export let setStringAsync = jest.fn();
export let getStringAsync = jest.fn(() => Promise.resolve(""));
export let hasStringAsync = jest.fn(() => Promise.resolve(false));
