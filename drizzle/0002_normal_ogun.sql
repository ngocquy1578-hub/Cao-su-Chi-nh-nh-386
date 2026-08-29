ALTER TABLE `latex_imports` ADD `periodLabel` varchar(80) NOT NULL;--> statement-breakpoint
CREATE INDEX `latex_imports_period_index` ON `latex_imports` (`periodLabel`);