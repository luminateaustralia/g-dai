CREATE TABLE `allocation_run` (
	`id` text PRIMARY KEY NOT NULL,
	`import_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`is_demo` integer DEFAULT false NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`summary_json` text
);
--> statement-breakpoint
CREATE TABLE `allocation_week` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`pool` text NOT NULL,
	`week_id` text NOT NULL,
	`week_start` text NOT NULL,
	`week_end` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `allocation_ledger_row` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`week_id` text NOT NULL,
	`pool` text NOT NULL,
	`product_subtype` text NOT NULL,
	`donor_order_id` text,
	`donor_name` text,
	`donor_email` text,
	`qty_donated` real,
	`qty_allocated_this_week` real DEFAULT 0 NOT NULL,
	`carry_forward_balance` real,
	`flex_order_id` text,
	`shelter_id` text,
	`shelter_name` text NOT NULL,
	`shelter_suburb` text,
	`shelter_sensitive` integer DEFAULT false NOT NULL,
	`meals_fulfilled` real DEFAULT 0 NOT NULL,
	`too_good_gap_fill` integer DEFAULT false NOT NULL,
	`gap_qty` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `allocation_carry_forward` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`pool` text NOT NULL,
	`donor_order_id` text NOT NULL,
	`week_id` text NOT NULL,
	`remaining_qty` real NOT NULL
);
