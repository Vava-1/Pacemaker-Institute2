CREATE TABLE `activity_logs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`action` varchar(100) NOT NULL,
	`details` json,
	`session_start` timestamp DEFAULT (now()),
	`session_end` timestamp,
	`duration` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_conversations` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`discipline` varchar(100) NOT NULL,
	`messages` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `badges` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`color` varchar(20) DEFAULT '#f59e0b',
	`requirement_type` enum('exercises','streak','courses','hours','score') DEFAULT 'exercises',
	`requirement_value` int DEFAULT 1,
	`points` int DEFAULT 50,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(50),
	`color` varchar(20) DEFAULT '#3b82f6',
	`parent_id` bigint unsigned,
	`display_order` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `categories_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`course_id` bigint unsigned NOT NULL,
	`certificate_number` varchar(100) NOT NULL,
	`pdf_url` text,
	`issued_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_certificate_number_unique` UNIQUE(`certificate_number`),
	CONSTRAINT `certificates_number_idx` UNIQUE(`certificate_number`)
);
--> statement-breakpoint
CREATE TABLE `chat_rooms` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`is_private` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_rooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `chat_rooms_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`short_description` varchar(500),
	`category_id` bigint unsigned NOT NULL,
	`instructor_id` bigint unsigned NOT NULL,
	`level` enum('beginner','intermediate','advanced','all_levels') NOT NULL DEFAULT 'beginner',
	`language` varchar(50) DEFAULT 'en',
	`thumbnail` text,
	`preview_video` text,
	`price` decimal(10,2) DEFAULT '0.00',
	`original_price` decimal(10,2),
	`currency` varchar(10) DEFAULT 'usd',
	`duration` int DEFAULT 0,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`is_featured` boolean DEFAULT false,
	`rating` decimal(2,1) DEFAULT '0.0',
	`total_students` int DEFAULT 0,
	`total_lessons` int DEFAULT 0,
	`requirements` json,
	`learning_outcomes` json,
	`tags` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `courses_id` PRIMARY KEY(`id`),
	CONSTRAINT `courses_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`course_id` bigint unsigned NOT NULL,
	`progress` int NOT NULL DEFAULT 0,
	`total_time_spent` int DEFAULT 0,
	`last_lesson_id` bigint unsigned,
	`is_completed` boolean DEFAULT false,
	`enrolled_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`),
	CONSTRAINT `enrollments_user_course_idx` UNIQUE(`user_id`,`course_id`)
);
--> statement-breakpoint
CREATE TABLE `exercise_attempts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`exercise_id` bigint unsigned NOT NULL,
	`answer` text,
	`is_correct` boolean DEFAULT false,
	`points_earned` int DEFAULT 0,
	`time_spent` int DEFAULT 0,
	`attempted_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exercise_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`course_id` bigint unsigned,
	`category_id` bigint unsigned,
	`title` varchar(255) NOT NULL,
	`question` text NOT NULL,
	`type` enum('multiple_choice','fill_blank','matching','true_false') NOT NULL DEFAULT 'multiple_choice',
	`options` json,
	`correct_answer` text,
	`explanation` text,
	`difficulty` enum('easy','medium','hard') DEFAULT 'medium',
	`points` int DEFAULT 10,
	`language` varchar(50) DEFAULT 'en',
	`is_daily` boolean DEFAULT false,
	`daily_date` varchar(20),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leaderboard_entries` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`user_name` varchar(255),
	`user_avatar` text,
	`total_points` int NOT NULL DEFAULT 0,
	`exercises_completed` int DEFAULT 0,
	`correct_answers` int DEFAULT 0,
	`study_hours` decimal(6,2) DEFAULT '0.00',
	`current_streak` int DEFAULT 0,
	`best_streak` int DEFAULT 0,
	`period` enum('weekly','monthly','allTime') NOT NULL DEFAULT 'allTime',
	`rank` int,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leaderboard_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`enrollment_id` bigint unsigned NOT NULL,
	`lesson_id` bigint unsigned NOT NULL,
	`is_completed` boolean NOT NULL DEFAULT false,
	`watched_seconds` int DEFAULT 0,
	`last_accessed_at` timestamp DEFAULT (now()),
	CONSTRAINT `lesson_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `lp_enroll_lesson_idx` UNIQUE(`enrollment_id`,`lesson_id`)
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`module_id` bigint unsigned NOT NULL,
	`course_id` bigint unsigned NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`type` enum('video','text','pdf','quiz') NOT NULL DEFAULT 'video',
	`video_url` text,
	`content_text` text,
	`pdf_url` text,
	`duration` int DEFAULT 0,
	`display_order` int DEFAULT 0,
	`is_free` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_class_bookings` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`live_class_id` bigint unsigned NOT NULL,
	`attended` boolean DEFAULT false,
	`booked_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `live_class_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `live_classes` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`course_id` bigint unsigned,
	`instructor_id` bigint unsigned NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`scheduled_at` timestamp NOT NULL,
	`duration` int DEFAULT 60,
	`max_students` int DEFAULT 100,
	`meeting_url` text,
	`thumbnail` text,
	`status` enum('scheduled','live','ended','cancelled') DEFAULT 'scheduled',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `live_classes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`room_id` bigint unsigned,
	`sender_id` bigint unsigned NOT NULL,
	`receiver_id` bigint unsigned,
	`content` text NOT NULL,
	`is_read` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `modules` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`course_id` bigint unsigned NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`display_order` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `modules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`type` enum('course','exercise','badge','liveClass','message','payment','system') DEFAULT 'system',
	`title` varchar(255) NOT NULL,
	`message` text,
	`link` text,
	`is_read` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_resets` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`token_hash` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_resets_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_resets_token_idx` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`course_id` bigint unsigned NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'usd',
	`stripe_payment_intent_id` varchar(255),
	`stripe_session_id` varchar(255),
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_stripe_session_idx` UNIQUE(`stripe_session_id`)
);
--> statement-breakpoint
CREATE TABLE `platform_settings` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`setting_key` varchar(100) NOT NULL,
	`setting_value` text,
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `platform_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `platform_settings_key_idx` UNIQUE(`setting_key`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`referrer_id` bigint unsigned NOT NULL,
	`referred_id` bigint unsigned,
	`code` varchar(50) NOT NULL,
	`converted` boolean DEFAULT false,
	`reward_given` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`course_id` bigint unsigned NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `reviews_user_course_idx` UNIQUE(`user_id`,`course_id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`billing_period` enum('monthly','yearly') DEFAULT 'monthly',
	`features` json,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_plans_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` varchar(255),
	`avatar` text,
	`content` text NOT NULL,
	`rating` int DEFAULT 5,
	`is_featured` boolean DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`badge_id` bigint unsigned NOT NULL,
	`earned_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_subscriptions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`plan_id` bigint unsigned NOT NULL,
	`status` enum('active','cancelled','expired') DEFAULT 'active',
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp,
	`cancelled_at` timestamp,
	CONSTRAINT `user_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`password_hash` varchar(255),
	`name` varchar(255),
	`avatar` text,
	`role` enum('user','instructor','admin') NOT NULL DEFAULT 'user',
	`email_verified` boolean NOT NULL DEFAULT false,
	`email_verify_token` varchar(255),
	`google_id` varchar(255),
	`is_suspended` boolean NOT NULL DEFAULT false,
	`native_language` varchar(50) DEFAULT 'en',
	`learning_languages` json,
	`total_points` int NOT NULL DEFAULT 0,
	`study_streak` int NOT NULL DEFAULT 0,
	`total_study_minutes` int NOT NULL DEFAULT 0,
	`referral_code` varchar(50),
	`is_online` boolean DEFAULT false,
	`last_active_at` timestamp DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`last_sign_in_at` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_idx` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `activity_logs_user_idx` ON `activity_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `ai_conversations_user_idx` ON `ai_conversations` (`user_id`);--> statement-breakpoint
CREATE INDEX `certificates_user_idx` ON `certificates` (`user_id`);--> statement-breakpoint
CREATE INDEX `certificates_course_idx` ON `certificates` (`course_id`);--> statement-breakpoint
CREATE INDEX `courses_status_idx` ON `courses` (`status`);--> statement-breakpoint
CREATE INDEX `courses_instructor_idx` ON `courses` (`instructor_id`);--> statement-breakpoint
CREATE INDEX `courses_category_idx` ON `courses` (`category_id`);--> statement-breakpoint
CREATE INDEX `courses_featured_idx` ON `courses` (`is_featured`);--> statement-breakpoint
CREATE INDEX `enrollments_user_idx` ON `enrollments` (`user_id`);--> statement-breakpoint
CREATE INDEX `enrollments_course_idx` ON `enrollments` (`course_id`);--> statement-breakpoint
CREATE INDEX `exercise_attempts_user_idx` ON `exercise_attempts` (`user_id`);--> statement-breakpoint
CREATE INDEX `exercise_attempts_exercise_idx` ON `exercise_attempts` (`exercise_id`);--> statement-breakpoint
CREATE INDEX `exercises_course_idx` ON `exercises` (`course_id`);--> statement-breakpoint
CREATE INDEX `exercises_daily_idx` ON `exercises` (`is_daily`,`daily_date`);--> statement-breakpoint
CREATE INDEX `leaderboard_user_period_idx` ON `leaderboard_entries` (`user_id`,`period`);--> statement-breakpoint
CREATE INDEX `leaderboard_points_idx` ON `leaderboard_entries` (`total_points`);--> statement-breakpoint
CREATE INDEX `lp_enrollment_idx` ON `lesson_progress` (`enrollment_id`);--> statement-breakpoint
CREATE INDEX `lessons_course_idx` ON `lessons` (`course_id`);--> statement-breakpoint
CREATE INDEX `lessons_module_idx` ON `lessons` (`module_id`);--> statement-breakpoint
CREATE INDEX `messages_room_idx` ON `messages` (`room_id`);--> statement-breakpoint
CREATE INDEX `messages_sender_idx` ON `messages` (`sender_id`);--> statement-breakpoint
CREATE INDEX `modules_course_idx` ON `modules` (`course_id`);--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `notifications_read_idx` ON `notifications` (`user_id`,`is_read`);--> statement-breakpoint
CREATE INDEX `password_resets_user_idx` ON `password_resets` (`user_id`);--> statement-breakpoint
CREATE INDEX `payments_user_idx` ON `payments` (`user_id`);--> statement-breakpoint
CREATE INDEX `payments_course_idx` ON `payments` (`course_id`);--> statement-breakpoint
CREATE INDEX `payments_status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `reviews_course_idx` ON `reviews` (`course_id`);--> statement-breakpoint
CREATE INDEX `user_badges_user_idx` ON `user_badges` (`user_id`);--> statement-breakpoint
CREATE INDEX `users_google_idx` ON `users` (`google_id`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);