import { sqliteTable,text,uniqueIndex } from 'drizzle-orm/sqlite-core';
export const healthRecords=sqliteTable('health_records',{id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),namespace:text('namespace').notNull(),fingerprint:text('fingerprint').notNull(),payload:text('payload').notNull(),createdAt:text('created_at').notNull(),deletedAt:text('deleted_at'),updatedAt:text('updated_at')},t=>[uniqueIndex('record_dedupe').on(t.ownerId,t.namespace,t.fingerprint)]);
export const healthDrafts=sqliteTable('health_drafts',{id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),namespace:text('namespace').notNull(),requestKey:text('request_key').notNull(),payload:text('payload').notNull(),status:text('status').notNull(),createdAt:text('created_at').notNull()},t=>[uniqueIndex('draft_idempotency').on(t.ownerId,t.namespace,t.requestKey)]);

export const healthEvents=sqliteTable('health_events',{id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),recordId:text('record_id').notNull(),action:text('action').notNull(),requestKey:text('request_key').notNull(),createdAt:text('created_at').notNull()},t=>[uniqueIndex('event_idempotency').on(t.ownerId,t.requestKey)]);

// Isolated non-health compatibility diagnostics; no image, callback or secret fields.
export const healthTransportProbes=sqliteTable('health_transport_probes',{id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),status:text('status').notNull(),result:text('result'),createdAt:text('created_at').notNull()});
