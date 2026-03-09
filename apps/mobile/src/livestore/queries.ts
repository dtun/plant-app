/**
 * LiveStore Query Factories
 *
 * Centralizes all queryDb calls and their associated schemas.
 * Component files import query factories instead of constructing raw SQL.
 */

import { queryDb, Schema, sql } from "@livestore/livestore";

// ============================================================================
// Row Schemas
// ============================================================================

let PlantSchema = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  name: Schema.String,
  description: Schema.NullOr(Schema.String),
  size: Schema.NullOr(Schema.String),
  photoUri: Schema.NullOr(Schema.String),
  aiAnalysis: Schema.NullOr(Schema.String),
  createdAt: Schema.Number,
  updatedAt: Schema.Number,
  syncedAt: Schema.NullOr(Schema.Number),
  deletedAt: Schema.NullOr(Schema.Number),
});

let MessageSchema = Schema.Struct({
  id: Schema.String,
  plantId: Schema.String,
  userId: Schema.String,
  role: Schema.String,
  content: Schema.String,
  imageUri: Schema.NullOr(Schema.String),
  createdAt: Schema.Number,
});

let PlantWithLastMessageSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  photoUri: Schema.NullOr(Schema.String),
  lastMessageContent: Schema.NullOr(Schema.String),
  lastMessageCreatedAt: Schema.NullOr(Schema.Number),
});

// ============================================================================
// Types
// ============================================================================

export type Plant = typeof PlantSchema.Type;
export type Message = typeof MessageSchema.Type;
export type PlantWithLastMessage = typeof PlantWithLastMessageSchema.Type;

// ============================================================================
// Query Factories
// ============================================================================

/**
 * Returns all non-deleted named plants joined with their most recent chat message.
 * Sorted by most recent message first, plants with no messages at the bottom.
 */
export let plantsWithLastMessage$ = queryDb(
  {
    query: sql`
    SELECT
      p.id,
      p.name,
      p.photoUri,
      m.content AS lastMessageContent,
      m.createdAt AS lastMessageCreatedAt
    FROM plants p
    LEFT JOIN (
      SELECT plantId, content, createdAt
      FROM chatMessages cm1
      WHERE cm1.deletedAt IS NULL
        AND cm1.createdAt = (
        SELECT MAX(cm2.createdAt)
        FROM chatMessages cm2
        WHERE cm2.plantId = cm1.plantId
          AND cm2.deletedAt IS NULL
      )
    ) m ON m.plantId = p.id
    WHERE p.deletedAt IS NULL
      AND p.name IS NOT NULL
      AND p.name != ''
    ORDER BY
      CASE WHEN m.createdAt IS NULL THEN 1 ELSE 0 END,
      m.createdAt DESC,
      p.createdAt DESC
  `,
    schema: Schema.Array(PlantWithLastMessageSchema),
  },
  { label: "plantsWithLastMessage" }
);

/**
 * Query factory: single plant by ID (returns array, caller takes first element)
 */
export function plantById$(plantId: string) {
  return queryDb(
    {
      query: sql`SELECT * FROM plants WHERE id = '${plantId}'`,
      schema: Schema.Array(PlantSchema),
    },
    { label: `plant-${plantId}` }
  );
}

/**
 * Query factory: chat messages for a plant, ordered chronologically
 */
export function messagesByPlant$(plantId: string) {
  return queryDb(
    {
      query: sql`SELECT id, plantId, userId, role, content, imageUri, createdAt
        FROM chatMessages
        WHERE plantId = '${plantId}' AND deletedAt IS NULL
        ORDER BY createdAt ASC`,
      schema: Schema.Array(MessageSchema),
    },
    { label: `chatMessages-${plantId}` }
  );
}
