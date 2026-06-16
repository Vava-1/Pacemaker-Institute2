CREATE TABLE `processed_webhooks` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`event_id` varchar(255) NOT NULL,
	`event_type` varchar(100) NOT NULL,
	`processed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `processed_webhooks_id` PRIMARY KEY(`id`),
	CONSTRAINT `processed_webhooks_event_id_unique` UNIQUE(`event_id`)
);
