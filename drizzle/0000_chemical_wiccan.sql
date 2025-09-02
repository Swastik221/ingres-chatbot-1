CREATE TABLE `groundwater_assessments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`region_id` integer NOT NULL,
	`assessment_year` integer NOT NULL,
	`annual_recharge` real NOT NULL,
	`extractable_resources` real NOT NULL,
	`total_extraction` real NOT NULL,
	`stage_of_extraction` text NOT NULL,
	`extraction_ratio` real NOT NULL,
	`trend` text NOT NULL,
	`assessment_date` text NOT NULL,
	`data_source` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `historical_data` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`region_id` integer NOT NULL,
	`year` integer NOT NULL,
	`month` integer,
	`parameter_type` text NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `regions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`parent_id` integer,
	`code` text NOT NULL,
	`latitude` real,
	`longitude` real,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `regions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `regions_code_unique` ON `regions` (`code`);--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`permissions` text NOT NULL,
	`organization` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
