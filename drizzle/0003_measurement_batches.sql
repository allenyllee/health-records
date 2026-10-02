CREATE TABLE `health_batch_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`namespace` text NOT NULL,
	`request_key` text NOT NULL,
	`digest` text NOT NULL,
	`payload` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `batch_draft_idempotency` ON `health_batch_drafts` (`owner_id`,`namespace`,`request_key`);--> statement-breakpoint
CREATE TABLE `health_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`namespace` text NOT NULL,
	`request_key` text NOT NULL,
	`digest` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	`deleted_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `batch_idempotency` ON `health_batches` (`owner_id`,`namespace`,`request_key`);