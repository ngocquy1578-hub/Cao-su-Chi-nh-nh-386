CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`username` varchar(80),
	`displayName` varchar(160),
	`eventType` varchar(64) NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` varchar(96),
	`summary` text NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `activity_logs_user_created_index` ON `activity_logs` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `activity_logs_event_created_index` ON `activity_logs` (`eventType`,`createdAt`);