CREATE TABLE `internal_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`username` varchar(64) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`groupType` enum('board','functional','production') NOT NULL,
	`roleCode` varchar(64) NOT NULL,
	`scopeUnits` text NOT NULL,
	`permissionProfile` text NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `internal_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `internal_accounts_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `internal_accounts_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE INDEX `internal_accounts_group_index` ON `internal_accounts` (`groupType`,`roleCode`);