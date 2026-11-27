-- Problemas e sugestões do Portal relatados pela equipe.
CREATE TABLE `portal_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text DEFAULT 'bug' NOT NULL,
	`title` text NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`screen` text DEFAULT '' NOT NULL,
	`device` text DEFAULT '' NOT NULL,
	`image_key` text,
	`status` text DEFAULT 'open' NOT NULL,
	`response` text DEFAULT '' NOT NULL,
	`created_by_id` integer,
	`created_by_name` text DEFAULT 'Equipe' NOT NULL,
	`updated_by_name` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null
);--> statement-breakpoint
CREATE INDEX `portal_reports_status_idx` ON `portal_reports` (`status`,`created_at`);
