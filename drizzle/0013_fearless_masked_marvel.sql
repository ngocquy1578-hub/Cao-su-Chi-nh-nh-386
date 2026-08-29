CREATE TABLE `management_group_targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupType` enum('board','functional','production') NOT NULL,
	`staffingTarget` int NOT NULL,
	`updatedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `management_group_targets_id` PRIMARY KEY(`id`),
	CONSTRAINT `management_group_targets_group_unique` UNIQUE(`groupType`)
);
