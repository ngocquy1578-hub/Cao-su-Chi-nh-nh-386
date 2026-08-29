CREATE TABLE `team_latex_exports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unit` varchar(120) NOT NULL,
	`periodLabel` varchar(80) NOT NULL,
	`recordDate` timestamp NOT NULL,
	`frozenContaminatedLatex` decimal(14,2) NOT NULL,
	`latexThread` decimal(14,2) NOT NULL,
	`source` varchar(100) NOT NULL DEFAULT 'Excel import',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_latex_exports_id` PRIMARY KEY(`id`),
	CONSTRAINT `team_latex_exports_unique` UNIQUE(`unit`,`recordDate`)
);
--> statement-breakpoint
CREATE TABLE `team_latex_imports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unit` varchar(120) NOT NULL,
	`gardenName` varchar(160) NOT NULL,
	`periodLabel` varchar(80) NOT NULL,
	`recordDate` timestamp NOT NULL,
	`frozenLatex` decimal(14,2) NOT NULL,
	`latexThread` decimal(14,2) NOT NULL,
	`source` varchar(100) NOT NULL DEFAULT 'Excel import',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_latex_imports_id` PRIMARY KEY(`id`),
	CONSTRAINT `team_latex_imports_unique` UNIQUE(`unit`,`gardenName`,`recordDate`)
);
--> statement-breakpoint
ALTER TABLE `plantation_plots` ADD `plantedYear` int;--> statement-breakpoint
ALTER TABLE `plantation_plots` ADD `cultivar` varchar(160);--> statement-breakpoint
ALTER TABLE `plantation_plots` ADD `inventoryPits` int;--> statement-breakpoint
ALTER TABLE `plantation_plots` ADD `inventoryTrees` int;--> statement-breakpoint
ALTER TABLE `plantation_plots` ADD `tappingTrees` int;--> statement-breakpoint
ALTER TABLE `plantation_plots` ADD `tappingDensity` decimal(12,2);--> statement-breakpoint
ALTER TABLE `plantation_plots` ADD `plotRank` varchar(12);--> statement-breakpoint
ALTER TABLE `workers` ADD `unit` varchar(120);--> statement-breakpoint
ALTER TABLE `workers` ADD `phoneticName` varchar(160);--> statement-breakpoint
ALTER TABLE `workers` ADD `gender` enum('male','female') DEFAULT 'male' NOT NULL;--> statement-breakpoint
CREATE INDEX `team_latex_exports_period_index` ON `team_latex_exports` (`periodLabel`);--> statement-breakpoint
CREATE INDEX `team_latex_imports_period_index` ON `team_latex_imports` (`periodLabel`);