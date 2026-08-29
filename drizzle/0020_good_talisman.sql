CREATE TABLE `workforce_snapshot_schedule` (
	`id` int NOT NULL,
	`taskUid` varchar(65) NOT NULL,
	`updatedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workforce_snapshot_schedule_id` PRIMARY KEY(`id`),
	CONSTRAINT `workforce_snapshot_schedule_taskUid_unique` UNIQUE(`taskUid`)
);
--> statement-breakpoint
CREATE TABLE `workforce_team_monthly_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`monthKey` varchar(7) NOT NULL,
	`unit` varchar(120) NOT NULL,
	`activeCount` int NOT NULL,
	`totalCount` int NOT NULL,
	`updatedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workforce_team_monthly_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `workforce_team_monthly_snapshots_month_unit_unique` UNIQUE(`monthKey`,`unit`)
);
--> statement-breakpoint
CREATE INDEX `workforce_snapshot_schedule_task_uid_index` ON `workforce_snapshot_schedule` (`taskUid`);--> statement-breakpoint
CREATE INDEX `workforce_team_monthly_snapshots_unit_month_index` ON `workforce_team_monthly_snapshots` (`unit`,`monthKey`);