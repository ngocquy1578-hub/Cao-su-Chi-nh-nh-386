CREATE TABLE `plot_garden_allocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plotId` int NOT NULL,
	`gardenType` enum('A','B','C') NOT NULL,
	`areaHa` decimal(12,3) NOT NULL,
	`tappingTrees` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plot_garden_allocations_id` PRIMARY KEY(`id`),
	CONSTRAINT `plot_garden_allocations_plot_garden_unique` UNIQUE(`plotId`,`gardenType`)
);
--> statement-breakpoint
CREATE INDEX `plot_garden_allocations_plot_index` ON `plot_garden_allocations` (`plotId`);
--> statement-breakpoint
INSERT INTO `plot_garden_allocations` (`plotId`, `gardenType`, `areaHa`, `tappingTrees`, `createdBy`)
SELECT `id`, `gardenType`, `areaHa`, COALESCE(`tappingTrees`, 0), `createdBy`
FROM `plantation_plots`
WHERE `gardenType` IS NOT NULL;
