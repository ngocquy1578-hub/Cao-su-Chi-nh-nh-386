ALTER TABLE `workers` ADD `employeeCode` varchar(64);--> statement-breakpoint
ALTER TABLE `workers` ADD CONSTRAINT `workers_employee_code_unique` UNIQUE(`employeeCode`);