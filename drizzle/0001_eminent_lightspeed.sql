CREATE TABLE `health_events` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`record_id` text NOT NULL,
	`action` text NOT NULL,
	`request_key` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_idempotency` ON `health_events` (`owner_id`,`request_key`);--> statement-breakpoint
ALTER TABLE `health_records` ADD `deleted_at` text;--> statement-breakpoint
ALTER TABLE `health_records` ADD `updated_at` text;