import { Events, makeSchema, Schema, State } from "@livestore/livestore";

// Minimal placeholder event
const placeholderEvent = Events.synced({
  name: "v1.PlaceholderCreated",
  schema: Schema.Struct({
    id: Schema.String,
    timestamp: Schema.Number,
  }),
});

export const events = { placeholderEvent };

// Minimal placeholder table
const placeholderTable = State.SQLite.table({
  name: "placeholder",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    timestamp: State.SQLite.integer(),
  },
});

export const tables = { placeholder: placeholderTable };

// Connect events to state changes
const materializers = State.SQLite.materializers(events, {
  "v1.PlaceholderCreated": ({
    id,
    timestamp,
  }: {
    id: string;
    timestamp: number;
  }) => tables.placeholder.insert({ id, timestamp }),
});

// Create and export schema
const state = State.SQLite.makeState({ tables, materializers });
export const schema = makeSchema({ events, state });
