// Mock LiveStore modules for testing

export let Events = {
  synced: jest.fn((config: any) => config),
};

export let Schema = {
  Struct: jest.fn((schema: any) => schema),
  String: "string",
  Number: "number",
  Boolean: "boolean",
  optional: jest.fn((type: any) => ({ optional: true, type })),
};

export let State = {
  SQLite: {
    table: jest.fn((config: any) => config),
    text: jest.fn((options: any) => ({ type: "text", ...options })),
    integer: jest.fn((options: any) => ({ type: "integer", ...options })),
    boolean: jest.fn((options: any) => ({ type: "boolean", ...options })),
    makeState: jest.fn((config: any) => config),
    materializers: jest.fn((events: any, materializers: any) => materializers),
  },
};

export const makeSchema = jest.fn((config: any) => config);
