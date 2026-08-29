CREATE TABLE `daily_care_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('tapping','reinforcement','care','treatment') NOT NULL,
	`activityDate` timestamp NOT NULL,
	`unit` varchar(120) NOT NULL,
	`gardenName` varchar(160),
	`plotId` int,
	`areaHa` decimal(12,2),
	`tappingSection` int,
	`planQuantity` decimal(14,2) NOT NULL,
	`actualQuantity` decimal(14,2) NOT NULL,
	`cumulativeQuantity` decimal(14,2) NOT NULL,
	`metricUnit` varchar(24) NOT NULL,
	`completedGardens` int,
	`pendingGardens` int,
	`partialGardens` int,
	`progressPercent` decimal(8,2),
	`nextGarden` varchar(160),
	`note` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_care_records_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_care_unique_entry` UNIQUE(`category`,`unit`,`gardenName`,`activityDate`)
);
--> statement-breakpoint
CREATE INDEX `daily_care_category_date_index` ON `daily_care_records` (`category`,`activityDate`);--> statement-breakpoint
CREATE INDEX `daily_care_unit_date_index` ON `daily_care_records` (`unit`,`activityDate`);