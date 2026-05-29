CREATE TABLE `app_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'viewer' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`actor_role` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`detail` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `client_outcome_observation` (
	`id` text PRIMARY KEY NOT NULL,
	`import_id` text NOT NULL,
	`intake_number` text NOT NULL,
	`cohort_id` text,
	`client_name` text,
	`metric_key` text NOT NULL,
	`time_point` text NOT NULL,
	`raw_value` text,
	`numeric_value` real,
	`is_missing` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `impact_cohort` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `impact_cohort_name_unique` ON `impact_cohort` (`name`);--> statement-breakpoint
CREATE TABLE `impact_metric_definition` (
	`key` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`full_question` text,
	`domain` text NOT NULL,
	`category` text NOT NULL,
	`scale_type` text NOT NULL,
	`scale_min` real NOT NULL,
	`scale_max` real NOT NULL,
	`missing_values` text DEFAULT '[]' NOT NULL,
	`higher_is_better` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `impact_metric_result` (
	`id` text PRIMARY KEY NOT NULL,
	`report_id` text NOT NULL,
	`metric_key` text NOT NULL,
	`cohort_id` text,
	`time_point` text NOT NULL,
	`avg_value` real,
	`n_count` integer DEFAULT 0 NOT NULL,
	`missing_count` integer DEFAULT 0 NOT NULL,
	`change_from_baseline` real
);
--> statement-breakpoint
CREATE TABLE `impact_report` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`period_id` text,
	`import_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`deidentified` integer DEFAULT true NOT NULL,
	`methodology_notes` text,
	`generated_by` text,
	`generated_at` integer NOT NULL,
	`data_freshness_at` integer
);
--> statement-breakpoint
CREATE TABLE `impact_report_period` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`start_date` text,
	`end_date` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `impact_source_import` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`uploaded_by` text,
	`uploaded_at` integer NOT NULL,
	`checksum` text,
	`observation_count` integer DEFAULT 0 NOT NULL,
	`intake_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'imported' NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `intake_outcome` (
	`id` text PRIMARY KEY NOT NULL,
	`import_id` text NOT NULL,
	`intake_number` text NOT NULL,
	`name` text,
	`cohort` text,
	`completed_program` integer,
	`employed` integer,
	`raw_data` text
);
--> statement-breakpoint
CREATE TABLE `customer_order` (
	`id` text PRIMARY KEY NOT NULL,
	`import_id` text NOT NULL,
	`order_id` text,
	`donor_id` text,
	`product` text,
	`product_category` text,
	`total_quantity` real,
	`suburb` text,
	`state` text,
	`postcode` text,
	`raw_data` text
);
--> statement-breakpoint
CREATE TABLE `donation_source_import` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`uploaded_by` text,
	`uploaded_at` integer NOT NULL,
	`checksum` text,
	`order_count` integer DEFAULT 0 NOT NULL,
	`shelter_count` integer DEFAULT 0 NOT NULL,
	`fulfilment_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'imported' NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `donation_trace` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_order_id` text,
	`fulfilment_id` text,
	`shelter_id` text,
	`status` text NOT NULL,
	`match_method` text NOT NULL,
	`confidence` real DEFAULT 0 NOT NULL,
	`source_records` text,
	`manual_override` integer DEFAULT false NOT NULL,
	`reviewed_by` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `donation_trace_match_attempt` (
	`id` text PRIMARY KEY NOT NULL,
	`trace_id` text,
	`fulfilment_id` text,
	`candidate_order_id` text,
	`method` text NOT NULL,
	`confidence` real DEFAULT 0 NOT NULL,
	`accepted` integer DEFAULT false NOT NULL,
	`detail` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `donor` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`first_name` text,
	`last_name` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shelter` (
	`id` text PRIMARY KEY NOT NULL,
	`import_id` text NOT NULL,
	`company_name` text NOT NULL,
	`normalised_name` text NOT NULL,
	`state` text,
	`suburb` text,
	`lga` text,
	`postcode` text,
	`meals_eligible` integer,
	`carepack_eligible` integer,
	`sensitive_address` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shelter_donation_fulfilment` (
	`id` text PRIMARY KEY NOT NULL,
	`import_id` text NOT NULL,
	`source` text NOT NULL,
	`order_id` text,
	`invoice_no` text,
	`customer_name` text,
	`shelter_id` text,
	`company_name_raw` text,
	`postcode` text,
	`product` text,
	`product_category` text,
	`quantity` real,
	`method` text,
	`delivery_suburb` text,
	`dispatch_date` text,
	`fulfilment_date` text,
	`status` text,
	`raw_data` text
);
