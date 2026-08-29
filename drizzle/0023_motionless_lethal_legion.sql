CREATE TABLE `data_backup_schedule` (
	`id` int NOT NULL,
	`taskUid` varchar(65) NOT NULL,
	`updatedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `data_backup_schedule_id` PRIMARY KEY(`id`),
	CONSTRAINT `data_backup_schedule_taskUid_unique` UNIQUE(`taskUid`)
);
--> statement-breakpoint
CREATE TABLE `data_backups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`backupKey` varchar(64) NOT NULL,
	`source` enum('automatic','manual') NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`sizeBytes` int NOT NULL,
	`recordCount` int NOT NULL,
	`summary` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `data_backups_id` PRIMARY KEY(`id`),
	CONSTRAINT `data_backups_backupKey_unique` UNIQUE(`backupKey`)
);
--> statement-breakpoint
CREATE INDEX `data_backup_schedule_task_uid_index` ON `data_backup_schedule` (`taskUid`);--> statement-breakpoint
CREATE INDEX `data_backups_created_at_index` ON `data_backups` (`createdAt`);