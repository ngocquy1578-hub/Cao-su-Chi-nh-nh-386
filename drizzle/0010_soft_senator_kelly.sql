CREATE TABLE `workforce_team_targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unit` varchar(120) NOT NULL,
	`staffingTarget` int NOT NULL,
	`updatedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workforce_team_targets_id` PRIMARY KEY(`id`),
	CONSTRAINT `workforce_team_targets_unit_unique` UNIQUE(`unit`)
);
