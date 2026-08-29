CREATE TABLE `worker_plot_allocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workerId` int NOT NULL,
	`plotId` int NOT NULL,
	`gardenType` enum('A','B','C') NOT NULL,
	`rowStart` int NOT NULL,
	`rowEnd` int NOT NULL,
	`areaHa` decimal(12,3) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `worker_plot_allocations_id` PRIMARY KEY(`id`),
	CONSTRAINT `worker_plot_alloc_rows_unique` UNIQUE(`workerId`,`plotId`,`rowStart`,`rowEnd`)
);
--> statement-breakpoint
CREATE INDEX `worker_plot_alloc_worker_index` ON `worker_plot_allocations` (`workerId`);--> statement-breakpoint
CREATE INDEX `worker_plot_alloc_plot_index` ON `worker_plot_allocations` (`plotId`);