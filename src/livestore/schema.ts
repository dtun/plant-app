/**
 * LiveStore Database Schema
 *
 * Defines tables, events, and materializers for local-first storage.
 * Used by LiveStoreProvider in app/_layout.tsx.
 *
 * Schema follows the pattern:
 * - Events: Define data changes (v1.{Entity}{Action})
 * - Tables: Define SQLite table structure
 * - Materializers: Connect events to state changes
 */

import { Events, makeSchema, Schema, State } from "@livestore/livestore";

// ============================================================================
// Events
// ============================================================================

/**
 * User events - Account creation and updates
 */
let userCreated = Events.synced({
  name: "v1.UserCreated",
  schema: Schema.Struct({
    id: Schema.String,
    tier: Schema.String, // 'free' | 'pro'
    email: Schema.optional(Schema.String),
    subscriptionId: Schema.optional(Schema.String),
    syncEnabled: Schema.Boolean,
    createdAt: Schema.Number,
  }),
});

let userUpdated = Events.synced({
  name: "v1.UserUpdated",
  schema: Schema.Struct({
    id: Schema.String,
    tier: Schema.optional(Schema.String),
    email: Schema.optional(Schema.String),
    subscriptionId: Schema.optional(Schema.String),
    syncEnabled: Schema.optional(Schema.Boolean),
  }),
});

/**
 * Usage tracking events - Monthly usage for free tier limits
 */
let usageRecorded = Events.synced({
  name: "v1.UsageRecorded",
  schema: Schema.Struct({
    id: Schema.String,
    userId: Schema.String,
    month: Schema.String, // Format: YYYY-MM
    count: Schema.Number,
    createdAt: Schema.Number,
  }),
});

/**
 * Plant events - CRUD operations for plant data
 */
let plantCreated = Events.synced({
  name: "v1.PlantCreated",
  schema: Schema.Struct({
    id: Schema.String,
    userId: Schema.String,
    name: Schema.String,
    description: Schema.optional(Schema.String),
    size: Schema.optional(Schema.String),
    photoUri: Schema.optional(Schema.String),
    aiAnalysis: Schema.optional(Schema.String),
    createdAt: Schema.Number,
    updatedAt: Schema.Number,
    syncedAt: Schema.optional(Schema.Number),
  }),
});

let plantUpdated = Events.synced({
  name: "v1.PlantUpdated",
  schema: Schema.Struct({
    id: Schema.String,
    name: Schema.optional(Schema.String),
    description: Schema.optional(Schema.String),
    size: Schema.optional(Schema.String),
    photoUri: Schema.optional(Schema.String),
    aiAnalysis: Schema.optional(Schema.String),
    updatedAt: Schema.Number,
    syncedAt: Schema.optional(Schema.Number),
  }),
});

let plantDeleted = Events.synced({
  name: "v1.PlantDeleted",
  schema: Schema.Struct({
    id: Schema.String,
    deletedAt: Schema.Number,
  }),
});

/**
 * Chat message events - Conversation history per plant
 */
let messageCreated = Events.synced({
  name: "v1.MessageCreated",
  schema: Schema.Struct({
    id: Schema.String,
    plantId: Schema.String,
    userId: Schema.String,
    role: Schema.String, // 'user' | 'assistant'
    content: Schema.String,
    createdAt: Schema.Number,
    syncedAt: Schema.optional(Schema.Number),
  }),
});

export let events = {
  userCreated,
  userUpdated,
  usageRecorded,
  plantCreated,
  plantUpdated,
  plantDeleted,
  messageCreated,
};

// ============================================================================
// Tables
// ============================================================================

/**
 * User table - Stores user account information and subscription status
 *
 * Tracks:
 * - Account tier (free/pro) for feature gating
 * - Subscription details for billing
 * - Sync preferences for cloud synchronization
 */
let userTable = State.SQLite.table({
  name: "user",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    tier: State.SQLite.text({ default: "free" }), // 'free' | 'pro'
    email: State.SQLite.text({ nullable: true }),
    subscriptionId: State.SQLite.text({ nullable: true }),
    syncEnabled: State.SQLite.boolean({ default: false }),
    createdAt: State.SQLite.integer(),
  },
});

/**
 * Usage table - Tracks monthly usage for free tier limits
 *
 * Tracks:
 * - Monthly plant/chat creation counts
 * - Used to enforce free tier limits
 * - Partitioned by month for easy querying
 */
let usageTable = State.SQLite.table({
  name: "usage",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    userId: State.SQLite.text(),
    month: State.SQLite.text(), // Format: YYYY-MM
    count: State.SQLite.integer({ default: 0 }),
    createdAt: State.SQLite.integer(),
  },
});

/**
 * Plants table - Stores plant information and care data
 *
 * Tracks:
 * - Basic plant information (name, description, size)
 * - Photo reference for visual identification
 * - AI-generated care instructions and analysis
 * - Sync timestamps for cloud synchronization
 *
 * Relationships:
 * - userId → user.id (many-to-one)
 * - id ← chatMessages.plantId (one-to-many)
 */
let plantsTable = State.SQLite.table({
  name: "plants",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    userId: State.SQLite.text(),
    name: State.SQLite.text(),
    description: State.SQLite.text({ nullable: true }),
    size: State.SQLite.text({ nullable: true }),
    photoUri: State.SQLite.text({ nullable: true }),
    aiAnalysis: State.SQLite.text({ nullable: true }),
    createdAt: State.SQLite.integer(),
    updatedAt: State.SQLite.integer(),
    syncedAt: State.SQLite.integer({ nullable: true }),
    deletedAt: State.SQLite.integer({ nullable: true }), // Soft delete
  },
});

/**
 * Chat messages table - Stores conversation history per plant
 *
 * Tracks:
 * - User questions and AI responses about plant care
 * - Role-based messages (user/assistant) for chat interface
 * - Sync timestamps for cloud synchronization
 *
 * Relationships:
 * - plantId → plants.id (many-to-one)
 * - userId → user.id (many-to-one)
 */
let chatMessagesTable = State.SQLite.table({
  name: "chatMessages",
  columns: {
    id: State.SQLite.text({ primaryKey: true }),
    plantId: State.SQLite.text(),
    userId: State.SQLite.text(),
    role: State.SQLite.text(), // 'user' | 'assistant'
    content: State.SQLite.text(),
    createdAt: State.SQLite.integer(),
    syncedAt: State.SQLite.integer({ nullable: true }),
  },
});

export let tables = {
  user: userTable,
  usage: usageTable,
  plants: plantsTable,
  chatMessages: chatMessagesTable,
};

// ============================================================================
// Materializers
// ============================================================================

/**
 * Materializers connect events to state changes
 *
 * When an event is committed:
 * 1. Event is appended to the event log
 * 2. Materializer transforms event into table operation
 * 3. Table is updated in SQLite
 *
 * This pattern ensures:
 * - All state changes are auditable
 * - Easy synchronization across devices
 * - Time-travel debugging capabilities
 */
let materializers = State.SQLite.materializers(events, {
  "v1.UserCreated": ({
    id,
    tier,
    email,
    subscriptionId,
    syncEnabled,
    createdAt,
  }: {
    id: string;
    tier: string;
    email?: string;
    subscriptionId?: string;
    syncEnabled: boolean;
    createdAt: number;
  }) =>
    tables.user.insert({
      id,
      tier,
      email: email ?? null,
      subscriptionId: subscriptionId ?? null,
      syncEnabled,
      createdAt,
    }),

  "v1.UserUpdated": ({
    id,
    tier,
    email,
    subscriptionId,
    syncEnabled,
  }: {
    id: string;
    tier?: string;
    email?: string;
    subscriptionId?: string;
    syncEnabled?: boolean;
  }) =>
    tables.user.update({
      id,
      ...(tier !== undefined && { tier }),
      ...(email !== undefined && { email }),
      ...(subscriptionId !== undefined && { subscriptionId }),
      ...(syncEnabled !== undefined && { syncEnabled }),
    }),

  "v1.UsageRecorded": ({
    id,
    userId,
    month,
    count,
    createdAt,
  }: {
    id: string;
    userId: string;
    month: string;
    count: number;
    createdAt: number;
  }) =>
    tables.usage.insert({
      id,
      userId,
      month,
      count,
      createdAt,
    }),

  "v1.PlantCreated": ({
    id,
    userId,
    name,
    description,
    size,
    photoUri,
    aiAnalysis,
    createdAt,
    updatedAt,
    syncedAt,
  }: {
    id: string;
    userId: string;
    name: string;
    description?: string;
    size?: string;
    photoUri?: string;
    aiAnalysis?: string;
    createdAt: number;
    updatedAt: number;
    syncedAt?: number;
  }) =>
    tables.plants.insert({
      id,
      userId,
      name,
      description: description ?? null,
      size: size ?? null,
      photoUri: photoUri ?? null,
      aiAnalysis: aiAnalysis ?? null,
      createdAt,
      updatedAt,
      syncedAt: syncedAt ?? null,
      deletedAt: null,
    }),

  "v1.PlantUpdated": ({
    id,
    name,
    description,
    size,
    photoUri,
    aiAnalysis,
    updatedAt,
    syncedAt,
  }: {
    id: string;
    name?: string;
    description?: string;
    size?: string;
    photoUri?: string;
    aiAnalysis?: string;
    updatedAt: number;
    syncedAt?: number;
  }) =>
    tables.plants.update({
      id,
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(size !== undefined && { size }),
      ...(photoUri !== undefined && { photoUri }),
      ...(aiAnalysis !== undefined && { aiAnalysis }),
      updatedAt,
      ...(syncedAt !== undefined && { syncedAt }),
    }),

  "v1.PlantDeleted": ({ id, deletedAt }: { id: string; deletedAt: number }) =>
    tables.plants.update({
      id,
      deletedAt,
    }),

  "v1.MessageCreated": ({
    id,
    plantId,
    userId,
    role,
    content,
    createdAt,
    syncedAt,
  }: {
    id: string;
    plantId: string;
    userId: string;
    role: string;
    content: string;
    createdAt: number;
    syncedAt?: number;
  }) =>
    tables.chatMessages.insert({
      id,
      plantId,
      userId,
      role,
      content,
      createdAt,
      syncedAt: syncedAt ?? null,
    }),
});

// ============================================================================
// Schema Export
// ============================================================================

let state = State.SQLite.makeState({ tables, materializers });
export let schema = makeSchema({ events, state });

/**
 * App-specific schema type for use throughout the app
 *
 * Use this type to access:
 * - Event types for committing changes
 * - Table query types for reading data
 * - Type-safe store operations
 *
 * Example:
 * ```typescript
 * import { schema, events, type AppSchema } from '@/src/livestore/schema';
 * import { useStore } from '@livestore/react';
 *
 * let { store } = useStore({ schema });
 * store.commit(events.plantCreated({ ... }));
 * ```
 */
export type AppSchema = typeof schema;
