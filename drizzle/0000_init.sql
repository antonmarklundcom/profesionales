CREATE TABLE `categories` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`name_es` varchar(120) NOT NULL,
	`icon` varchar(60),
	`lead_price_gs` bigint NOT NULL DEFAULT 0,
	`max_pros_per_lead` smallint unsigned NOT NULL DEFAULT 3,
	`form_questions` json NOT NULL DEFAULT ('[]'),
	`active` boolean NOT NULL DEFAULT true,
	`sort` smallint NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `credit_packs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`price_gs` bigint NOT NULL,
	`credits_gs` bigint NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`sort` smallint NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credit_packs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_transactions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`professional_id` bigint unsigned NOT NULL,
	`amount_gs` bigint NOT NULL,
	`type` enum('purchase','lead_charge','refund','bonus','adjustment') NOT NULL,
	`lead_assignment_id` bigint unsigned,
	`idempotency_key` varchar(190) NOT NULL,
	`note` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `credit_transactions_idempotency_uq` UNIQUE(`idempotency_key`)
);
--> statement-breakpoint
CREATE TABLE `lead_assignments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`lead_id` bigint unsigned NOT NULL,
	`professional_id` bigint unsigned NOT NULL,
	`status` enum('offered','accepted','declined','expired') NOT NULL DEFAULT 'offered',
	`accept_token` varchar(64) NOT NULL,
	`price_gs` bigint NOT NULL DEFAULT 0,
	`offered_at` timestamp NOT NULL DEFAULT (now()),
	`accepted_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lead_assignments_id` PRIMARY KEY(`id`),
	CONSTRAINT `lead_assignments_lead_pro_uq` UNIQUE(`lead_id`,`professional_id`),
	CONSTRAINT `lead_assignments_token_uq` UNIQUE(`accept_token`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`public_code` varchar(32) NOT NULL,
	`category_id` bigint unsigned NOT NULL,
	`zone_id` bigint unsigned NOT NULL,
	`description` text NOT NULL,
	`answers` json NOT NULL DEFAULT ('{}'),
	`photos` json NOT NULL DEFAULT ('[]'),
	`customer_name` varchar(160) NOT NULL,
	`customer_whatsapp` varchar(20) NOT NULL,
	`customer_type` enum('particular','empresa') NOT NULL DEFAULT 'particular',
	`status` enum('new','matched','closed','spam') NOT NULL DEFAULT 'new',
	`source` enum('web','spoke','ads','admin') NOT NULL DEFAULT 'web',
	`source_domain` varchar(190),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `leads_public_code_uq` UNIQUE(`public_code`)
);
--> statement-breakpoint
CREATE TABLE `professional_categories` (
	`professional_id` bigint unsigned NOT NULL,
	`category_id` bigint unsigned NOT NULL,
	CONSTRAINT `professional_categories_professional_id_category_id_pk` PRIMARY KEY(`professional_id`,`category_id`)
);
--> statement-breakpoint
CREATE TABLE `professional_zones` (
	`professional_id` bigint unsigned NOT NULL,
	`zone_id` bigint unsigned NOT NULL,
	CONSTRAINT `professional_zones_professional_id_zone_id_pk` PRIMARY KEY(`professional_id`,`zone_id`)
);
--> statement-breakpoint
CREATE TABLE `professionals` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`business_name` varchar(160) NOT NULL,
	`slug` varchar(180) NOT NULL,
	`cedula_ruc` varchar(40) NOT NULL,
	`whatsapp` varchar(20) NOT NULL,
	`bio` text,
	`years_experience` smallint unsigned,
	`photo_url` varchar(500),
	`verified_at` timestamp,
	`avg_rating_x100` smallint unsigned NOT NULL DEFAULT 0,
	`review_count` int unsigned NOT NULL DEFAULT 0,
	`credit_balance_gs` bigint NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `professionals_id` PRIMARY KEY(`id`),
	CONSTRAINT `professionals_user_uq` UNIQUE(`user_id`),
	CONSTRAINT `professionals_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`professional_id` bigint unsigned NOT NULL,
	`lead_id` bigint unsigned,
	`rating` smallint unsigned NOT NULL,
	`comment` text,
	`customer_name` varchar(160) NOT NULL,
	`request_token` varchar(64) NOT NULL,
	`status` enum('pending','published','rejected') NOT NULL DEFAULT 'pending',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `reviews_request_token_uq` UNIQUE(`request_token`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` varchar(120) NOT NULL,
	`value` varchar(1000) NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `spoke_tokens` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`domain` varchar(190) NOT NULL,
	`category_id` bigint unsigned,
	`active` boolean NOT NULL DEFAULT true,
	`last_used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `spoke_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `spoke_tokens_hash_uq` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('admin','professional') NOT NULL DEFAULT 'professional',
	`status` enum('active','suspended') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_uq` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `zones` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`name` varchar(120) NOT NULL,
	`department` varchar(120) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`sort` smallint NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `zones_id` PRIMARY KEY(`id`),
	CONSTRAINT `zones_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `credit_transactions` ADD CONSTRAINT `credit_transactions_professional_id_professionals_id_fk` FOREIGN KEY (`professional_id`) REFERENCES `professionals`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `credit_transactions` ADD CONSTRAINT `credit_transactions_lead_assignment_id_lead_assignments_id_fk` FOREIGN KEY (`lead_assignment_id`) REFERENCES `lead_assignments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_assignments` ADD CONSTRAINT `lead_assignments_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_assignments` ADD CONSTRAINT `lead_assignments_professional_id_professionals_id_fk` FOREIGN KEY (`professional_id`) REFERENCES `professionals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_zone_id_zones_id_fk` FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `professional_categories` ADD CONSTRAINT `professional_categories_professional_id_professionals_id_fk` FOREIGN KEY (`professional_id`) REFERENCES `professionals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `professional_categories` ADD CONSTRAINT `professional_categories_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `professional_zones` ADD CONSTRAINT `professional_zones_professional_id_professionals_id_fk` FOREIGN KEY (`professional_id`) REFERENCES `professionals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `professional_zones` ADD CONSTRAINT `professional_zones_zone_id_zones_id_fk` FOREIGN KEY (`zone_id`) REFERENCES `zones`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `professionals` ADD CONSTRAINT `professionals_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_professional_id_professionals_id_fk` FOREIGN KEY (`professional_id`) REFERENCES `professionals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `spoke_tokens` ADD CONSTRAINT `spoke_tokens_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `categories_active_idx` ON `categories` (`active`,`sort`);--> statement-breakpoint
CREATE INDEX `credit_packs_active_idx` ON `credit_packs` (`active`,`sort`);--> statement-breakpoint
CREATE INDEX `credit_transactions_pro_idx` ON `credit_transactions` (`professional_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `lead_assignments_pro_status_idx` ON `lead_assignments` (`professional_id`,`status`);--> statement-breakpoint
CREATE INDEX `lead_assignments_offered_idx` ON `lead_assignments` (`offered_at`);--> statement-breakpoint
CREATE INDEX `leads_status_idx` ON `leads` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `leads_category_zone_idx` ON `leads` (`category_id`,`zone_id`);--> statement-breakpoint
CREATE INDEX `professional_categories_category_idx` ON `professional_categories` (`category_id`);--> statement-breakpoint
CREATE INDEX `professional_zones_zone_idx` ON `professional_zones` (`zone_id`);--> statement-breakpoint
CREATE INDEX `professionals_verified_idx` ON `professionals` (`verified_at`);--> statement-breakpoint
CREATE INDEX `reviews_pro_status_idx` ON `reviews` (`professional_id`,`status`);--> statement-breakpoint
CREATE INDEX `spoke_tokens_domain_idx` ON `spoke_tokens` (`domain`);--> statement-breakpoint
CREATE INDEX `zones_active_idx` ON `zones` (`active`,`sort`);