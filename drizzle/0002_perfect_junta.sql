CREATE TABLE `health_transport_probes` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`status` text NOT NULL,
	`result` text,
	`created_at` text NOT NULL
);
