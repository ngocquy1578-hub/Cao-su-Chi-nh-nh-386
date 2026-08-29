CREATE TABLE `workforce_monthly_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`monthKey` varchar(7) NOT NULL,
	`activeCount` int NOT NULL,
	`totalCount` int NOT NULL,
	`updatedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workforce_monthly_snapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `workforce_monthly_snapshots_month_unique` UNIQUE(`monthKey`)
);
