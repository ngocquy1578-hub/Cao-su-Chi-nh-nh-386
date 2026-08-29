CREATE TABLE `plot_latex_productions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plotId` int NOT NULL,
	`recordDate` timestamp NOT NULL,
	`frozenContaminatedLatex` decimal(14,2) NOT NULL,
	`dryRubber` decimal(14,2) NOT NULL,
	`source` varchar(100) NOT NULL DEFAULT 'Nhập tay',
	`note` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plot_latex_productions_id` PRIMARY KEY(`id`),
	CONSTRAINT `plot_latex_productions_plot_date_unique` UNIQUE(`plotId`,`recordDate`)
);
--> statement-breakpoint
CREATE INDEX `plot_latex_productions_date_index` ON `plot_latex_productions` (`recordDate`);