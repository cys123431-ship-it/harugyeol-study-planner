CREATE TABLE `planner_snapshots` (
	`user_id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `planner_snapshots_updated_at_idx` ON `planner_snapshots` (`updated_at`);
