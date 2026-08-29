CREATE TABLE `care_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plotId` int NOT NULL,
	`activityDate` timestamp NOT NULL,
	`description` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `care_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `latex_exports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plotId` int NOT NULL,
	`periodLabel` varchar(80) NOT NULL,
	`recordDate` timestamp NOT NULL,
	`frozenContaminatedLatex` decimal(14,2) NOT NULL,
	`latexThread` decimal(14,2) NOT NULL,
	`note` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `latex_exports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `latex_imports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plotId` int NOT NULL,
	`recordDate` timestamp NOT NULL,
	`frozenLatex` decimal(14,2) NOT NULL,
	`latexThread` decimal(14,2) NOT NULL,
	`note` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `latex_imports_id` PRIMARY KEY(`id`),
	CONSTRAINT `latex_imports_plot_date_unique` UNIQUE(`plotId`,`recordDate`)
);
--> statement-breakpoint
CREATE TABLE `plantation_plots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(48) NOT NULL,
	`name` varchar(160) NOT NULL,
	`unit` varchar(120) NOT NULL,
	`areaHa` decimal(12,2) NOT NULL,
	`note` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `plantation_plots_id` PRIMARY KEY(`id`),
	CONSTRAINT `plantation_plots_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `workers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`phone` varchar(32),
	`roleTitle` varchar(120) NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`note` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workforce_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workerId` int NOT NULL,
	`plotId` int NOT NULL,
	`task` varchar(220) NOT NULL,
	`assignmentDate` timestamp NOT NULL,
	`status` enum('planned','in_progress','completed') NOT NULL DEFAULT 'planned',
	`note` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workforce_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `care_activities_plot_date_index` ON `care_activities` (`plotId`,`activityDate`);--> statement-breakpoint
CREATE INDEX `latex_exports_plot_date_index` ON `latex_exports` (`plotId`,`recordDate`);--> statement-breakpoint
CREATE INDEX `latex_exports_period_index` ON `latex_exports` (`periodLabel`);--> statement-breakpoint
CREATE INDEX `latex_imports_date_index` ON `latex_imports` (`recordDate`);--> statement-breakpoint
CREATE INDEX `plantation_plots_unit_index` ON `plantation_plots` (`unit`);--> statement-breakpoint
CREATE INDEX `workers_status_index` ON `workers` (`status`);--> statement-breakpoint
CREATE INDEX `workforce_assignments_worker_date_index` ON `workforce_assignments` (`workerId`,`assignmentDate`);--> statement-breakpoint
CREATE INDEX `workforce_assignments_plot_date_index` ON `workforce_assignments` (`plotId`,`assignmentDate`);