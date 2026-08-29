CREATE TABLE `user_dashboard_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`teamOverviewColumns` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_dashboard_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_dashboard_preferences_user_unique` UNIQUE(`userId`)
);
