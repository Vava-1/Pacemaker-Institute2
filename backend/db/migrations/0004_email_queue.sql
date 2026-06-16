CREATE TABLE `email_queue` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`to` varchar(320) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`status` enum('pending','sent','failed') DEFAULT 'pending',
	`attempts` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`sent_at` timestamp,
	CONSTRAINT `email_queue_id` PRIMARY KEY(`id`)
);
