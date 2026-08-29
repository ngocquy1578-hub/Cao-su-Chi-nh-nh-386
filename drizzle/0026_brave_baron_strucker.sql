CREATE TABLE `plot_production_period_locks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`lockedBy` int NOT NULL,
	`lockedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plot_production_period_locks_id` PRIMARY KEY(`id`),
	CONSTRAINT `plot_production_period_locks_year_month_unique` UNIQUE(`year`,`month`)
);
