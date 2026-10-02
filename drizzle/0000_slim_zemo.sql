CREATE TABLE `health_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`namespace` text NOT NULL,
	`request_key` text NOT NULL,
	`payload` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `draft_idempotency` ON `health_drafts` (`owner_id`,`namespace`,`request_key`);--> statement-breakpoint
CREATE TABLE `health_records` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`namespace` text NOT NULL,
	`fingerprint` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `record_dedupe` ON `health_records` (`owner_id`,`namespace`,`fingerprint`);