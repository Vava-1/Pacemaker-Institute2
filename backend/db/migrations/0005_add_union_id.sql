-- ============================================================
-- Migration 0005: sync all schema drift accumulated since 0000
-- This single file brings the live DB fully in line with schema.ts
-- ============================================================

-- 1. USERS — seven columns added to schema.ts after migration 0000
ALTER TABLE `users` ADD COLUMN `union_id` varchar(255);
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `weekly_points` int NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `monthly_points` int NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `accuracy_percent` int NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `rank_tier` enum('Bronze','Silver','Gold','Platinum','Diamond') NOT NULL DEFAULT 'Bronze';
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `longest_streak` int NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `last_submission_date` varchar(20);
--> statement-breakpoint

-- 2. PASSWORD_RESETS — column was created as `token_hash` in migration 0000
--    but schema.ts declares it as `token`; rename to match Drizzle ORM queries
ALTER TABLE `password_resets` CHANGE COLUMN `token_hash` `token` varchar(255) NOT NULL;
--> statement-breakpoint

-- 3. COURSES — plan_tier column missing from migration 0000
ALTER TABLE `courses` ADD COLUMN `plan_tier` enum('free','basic','pro','premium') NOT NULL DEFAULT 'basic';
--> statement-breakpoint

-- 4. ENROLLMENTS — payment columns missing from migration 0000
ALTER TABLE `enrollments` ADD COLUMN `payment_status` enum('pending','paid','refunded') NOT NULL DEFAULT 'pending';
--> statement-breakpoint
ALTER TABLE `enrollments` ADD COLUMN `payment_intent_id` varchar(255);
--> statement-breakpoint
ALTER TABLE `enrollments` ADD COLUMN `amount` decimal(10,2) DEFAULT '0.00';
--> statement-breakpoint

-- 5. EXERCISE_ATTEMPTS — AI evaluation columns missing from migration 0000
ALTER TABLE `exercise_attempts` ADD COLUMN `ai_score` int;
--> statement-breakpoint
ALTER TABLE `exercise_attempts` ADD COLUMN `ai_feedback` text;
--> statement-breakpoint
ALTER TABLE `exercise_attempts` ADD COLUMN `ai_correctness_percent` int;
--> statement-breakpoint
ALTER TABLE `exercise_attempts` ADD COLUMN `ai_evaluation` json;
--> statement-breakpoint

-- 6. EXERCISES — expand type enum and add new columns
ALTER TABLE `exercises` MODIFY COLUMN `type` enum('multiple_choice','fill_blank','matching','true_false','open_ended','code_challenge') NOT NULL DEFAULT 'multiple_choice';
--> statement-breakpoint
ALTER TABLE `exercises` ADD COLUMN `user_id` bigint unsigned;
--> statement-breakpoint
ALTER TABLE `exercises` ADD COLUMN `ai_generated` boolean DEFAULT false;
--> statement-breakpoint
ALTER TABLE `exercises` ADD COLUMN `topic_tags` json;
--> statement-breakpoint
ALTER TABLE `exercises` ADD COLUMN `time_limit_minutes` int;
--> statement-breakpoint
ALTER TABLE `exercises` ADD COLUMN `expires_at` timestamp;
--> statement-breakpoint
CREATE INDEX `exercises_user_daily_idx` ON `exercises` (`user_id`, `daily_date`);
--> statement-breakpoint

-- 7. LEADERBOARD_ENTRIES — accuracy column missing from migration 0000
ALTER TABLE `leaderboard_entries` ADD COLUMN `accuracy` int DEFAULT 0;
--> statement-breakpoint

-- 8. MESSAGES — reply and reactions columns missing from migration 0000
ALTER TABLE `messages` ADD COLUMN `reply_to_id` bigint unsigned;
--> statement-breakpoint
ALTER TABLE `messages` ADD COLUMN `reactions` json NOT NULL DEFAULT ('[]');
--> statement-breakpoint
CREATE INDEX `messages_reply_idx` ON `messages` (`reply_to_id`);
--> statement-breakpoint

-- 9. NOTIFICATIONS — expand type enum with welcome + course_published
ALTER TABLE `notifications` MODIFY COLUMN `type` enum('course','exercise','badge','liveClass','message','payment','system','welcome','course_published') DEFAULT 'system';
--> statement-breakpoint

-- 10. BADGES — expand requirement_type enum with lessons + messages
ALTER TABLE `badges` MODIFY COLUMN `requirement_type` enum('exercises','streak','courses','hours','score','lessons','messages') DEFAULT 'exercises';
--> statement-breakpoint

-- 11. USER_SUBSCRIPTIONS — Stripe column and past_due status missing
ALTER TABLE `user_subscriptions` ADD COLUMN `stripe_subscription_id` varchar(255);
--> statement-breakpoint
ALTER TABLE `user_subscriptions` ADD COLUMN `plan` varchar(100);
--> statement-breakpoint
ALTER TABLE `user_subscriptions` MODIFY COLUMN `status` enum('active','cancelled','expired','past_due') DEFAULT 'active';
--> statement-breakpoint

-- 12. CHAT_ROOMS — last_activity column missing from migration 0000
ALTER TABLE `chat_rooms` ADD COLUMN `last_activity` timestamp NOT NULL DEFAULT (now());
--> statement-breakpoint

-- 13. AI_CONVERSATIONS — title column missing from migration 0000
ALTER TABLE `ai_conversations` ADD COLUMN `title` varchar(255);
--> statement-breakpoint

-- 14. CREATE blog_posts — table entirely absent from all prior migrations
CREATE TABLE `blog_posts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`excerpt` text NOT NULL,
	`content` text NOT NULL,
	`image` text,
	`author_name` varchar(255) NOT NULL,
	`author_avatar` text,
	`tags` json,
	`language` varchar(10) NOT NULL DEFAULT 'en',
	`published` boolean NOT NULL DEFAULT false,
	`featured` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blog_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_posts_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `blog_posts_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE INDEX `blog_posts_published_idx` ON `blog_posts` (`published`);
--> statement-breakpoint
CREATE INDEX `blog_posts_language_idx` ON `blog_posts` (`language`);
--> statement-breakpoint

-- 15. CREATE exercise_config — table entirely absent from all prior migrations
CREATE TABLE `exercise_config` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`questions_per_course` int NOT NULL DEFAULT 3,
	`easy_percent` int NOT NULL DEFAULT 30,
	`medium_percent` int NOT NULL DEFAULT 50,
	`hard_percent` int NOT NULL DEFAULT 20,
	`generation_time` varchar(10) NOT NULL DEFAULT '00:01',
	`ai_model` varchar(50) NOT NULL DEFAULT 'gemini-2.5-flash',
	`use_fallback_bank` boolean NOT NULL DEFAULT true,
	`prompt_template` text,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exercise_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

-- 16. CREATE exercise_review_status — table entirely absent from all prior migrations
CREATE TABLE `exercise_review_status` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`exercise_id` bigint unsigned NOT NULL,
	`status` enum('pending','approved','rejected','live') NOT NULL DEFAULT 'pending',
	`reviewed_by` bigint unsigned,
	`reviewed_at` timestamp,
	`rejection_reason` text,
	CONSTRAINT `exercise_review_status_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

-- 17. CREATE points_audit_log — table entirely absent from all prior migrations
CREATE TABLE `points_audit_log` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`points_changed` int NOT NULL,
	`new_total` int NOT NULL,
	`reason` text NOT NULL,
	`adjusted_by` bigint unsigned NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `points_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

-- 18. CREATE leaderboard_bans — table entirely absent from all prior migrations
CREATE TABLE `leaderboard_bans` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`reason` text NOT NULL,
	`banned_by` bigint unsigned NOT NULL,
	`banned_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `leaderboard_bans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint

-- 19. CREATE admin_activity_log — table entirely absent from all prior migrations
CREATE TABLE `admin_activity_log` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`admin_id` bigint unsigned NOT NULL,
	`action` varchar(100) NOT NULL,
	`target_type` varchar(50) NOT NULL,
	`target_id` bigint unsigned,
	`details` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_activity_log_id` PRIMARY KEY(`id`)
);
