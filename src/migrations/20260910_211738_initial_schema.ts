import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_media_type" AS ENUM('photo', 'video', 'audio');
  CREATE TYPE "public"."enum_media_source" AS ENUM('task_step', 'closing_checklist', 'blocker', 'comment', 'broadcast', 'admin');
  CREATE TYPE "public"."enum_workers_role" AS ENUM('worker', 'foreman');
  CREATE TYPE "public"."enum_checklist_templates_type" AS ENUM('opening', 'closing');
  CREATE TYPE "public"."enum_checklist_answers_status" AS ENUM('ok', 'problem');
  CREATE TYPE "public"."enum_blockers_kind" AS ENUM('gap', 'not_ready', 'critical', 'defect');
  CREATE TYPE "public"."enum_comments_context_type" AS ENUM('task', 'step', 'general');
  CREATE TYPE "public"."enum_broadcasts_kind" AS ENUM('message', 'task');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"type" "enum_media_type" DEFAULT 'photo',
  	"source" "enum_media_source" DEFAULT 'admin',
  	"taken_at" timestamp(3) with time zone,
  	"shift_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "workers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_workers_role" DEFAULT 'worker' NOT NULL,
  	"active" boolean DEFAULT true,
  	"pin_hash" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "shifts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"responsible_user_id" integer NOT NULL,
  	"opened_at" timestamp(3) with time zone,
  	"closed_at" timestamp(3) with time zone,
  	"handover_ok" boolean,
  	"handover_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "checklist_templates_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"requires_photo" boolean DEFAULT false
  );
  
  CREATE TABLE "checklist_templates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_checklist_templates_type" NOT NULL,
  	"version" numeric DEFAULT 1,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "checklist_runs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"shift_id" integer NOT NULL,
  	"template_id" integer NOT NULL,
  	"template_version" numeric NOT NULL,
  	"completed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "checklist_answers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"run_id" integer NOT NULL,
  	"item_key" varchar NOT NULL,
  	"status" "enum_checklist_answers_status" NOT NULL,
  	"photo_id" integer,
  	"note" varchar,
  	"answered_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tasks_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"key_point" varchar,
  	"why" varchar,
  	"media_id" integer
  );
  
  CREATE TABLE "tasks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"title" varchar NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"stage_no" numeric,
  	"target_qty" numeric NOT NULL,
  	"carried_from_task_id" integer,
  	"reference_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "task_progress" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"task_id" integer NOT NULL,
  	"shift_id" integer NOT NULL,
  	"worker_id" integer NOT NULL,
  	"qty_delta" numeric NOT NULL,
  	"unit_ids" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "blockers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_blockers_kind" NOT NULL,
  	"task_id" integer,
  	"shift_id" integer NOT NULL,
  	"worker_id" integer NOT NULL,
  	"text" varchar,
  	"audio_url" varchar,
  	"transcript" varchar,
  	"qty_done" numeric,
  	"target_qty" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "blockers_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "comments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"shift_id" integer NOT NULL,
  	"worker_id" integer NOT NULL,
  	"text" varchar,
  	"audio_url" varchar,
  	"transcript" varchar,
  	"context_type" "enum_comments_context_type" DEFAULT 'general',
  	"context_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "comments_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "changes_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"what_was_said" varchar NOT NULL,
  	"what_changed" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "broadcasts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_broadcasts_kind" NOT NULL,
  	"body" varchar NOT NULL,
  	"extra" varchar,
  	"task_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "broadcasts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"workers_id" integer
  );
  
  CREATE TABLE "broadcast_acks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"broadcast_id" integer NOT NULL,
  	"worker_id" integer NOT NULL,
  	"shown_at" timestamp(3) with time zone,
  	"acked_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ui_strings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"workers_id" integer,
  	"shifts_id" integer,
  	"checklist_templates_id" integer,
  	"checklist_runs_id" integer,
  	"checklist_answers_id" integer,
  	"tasks_id" integer,
  	"task_progress_id" integer,
  	"blockers_id" integer,
  	"comments_id" integer,
  	"changes_log_id" integer,
  	"broadcasts_id" integer,
  	"broadcast_acks_id" integer,
  	"ui_strings_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shifts" ADD CONSTRAINT "shifts_responsible_user_id_workers_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."workers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "checklist_templates_items" ADD CONSTRAINT "checklist_templates_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."checklist_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "checklist_runs" ADD CONSTRAINT "checklist_runs_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "checklist_runs" ADD CONSTRAINT "checklist_runs_template_id_checklist_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."checklist_templates"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "checklist_answers" ADD CONSTRAINT "checklist_answers_run_id_checklist_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."checklist_runs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "checklist_answers" ADD CONSTRAINT "checklist_answers_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tasks_steps" ADD CONSTRAINT "tasks_steps_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tasks_steps" ADD CONSTRAINT "tasks_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tasks" ADD CONSTRAINT "tasks_carried_from_task_id_tasks_id_fk" FOREIGN KEY ("carried_from_task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "task_progress" ADD CONSTRAINT "task_progress_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "task_progress" ADD CONSTRAINT "task_progress_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "task_progress" ADD CONSTRAINT "task_progress_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blockers" ADD CONSTRAINT "blockers_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blockers" ADD CONSTRAINT "blockers_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blockers" ADD CONSTRAINT "blockers_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blockers_rels" ADD CONSTRAINT "blockers_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blockers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blockers_rels" ADD CONSTRAINT "blockers_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "comments" ADD CONSTRAINT "comments_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "comments" ADD CONSTRAINT "comments_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "comments_rels" ADD CONSTRAINT "comments_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "comments_rels" ADD CONSTRAINT "comments_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "broadcasts_rels" ADD CONSTRAINT "broadcasts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."broadcasts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "broadcasts_rels" ADD CONSTRAINT "broadcasts_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "broadcasts_rels" ADD CONSTRAINT "broadcasts_rels_workers_fk" FOREIGN KEY ("workers_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "broadcast_acks" ADD CONSTRAINT "broadcast_acks_broadcast_id_broadcasts_id_fk" FOREIGN KEY ("broadcast_id") REFERENCES "public"."broadcasts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "broadcast_acks" ADD CONSTRAINT "broadcast_acks_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_workers_fk" FOREIGN KEY ("workers_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shifts_fk" FOREIGN KEY ("shifts_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_checklist_templates_fk" FOREIGN KEY ("checklist_templates_id") REFERENCES "public"."checklist_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_checklist_runs_fk" FOREIGN KEY ("checklist_runs_id") REFERENCES "public"."checklist_runs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_checklist_answers_fk" FOREIGN KEY ("checklist_answers_id") REFERENCES "public"."checklist_answers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tasks_fk" FOREIGN KEY ("tasks_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_task_progress_fk" FOREIGN KEY ("task_progress_id") REFERENCES "public"."task_progress"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blockers_fk" FOREIGN KEY ("blockers_id") REFERENCES "public"."blockers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_comments_fk" FOREIGN KEY ("comments_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_changes_log_fk" FOREIGN KEY ("changes_log_id") REFERENCES "public"."changes_log"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_broadcasts_fk" FOREIGN KEY ("broadcasts_id") REFERENCES "public"."broadcasts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_broadcast_acks_fk" FOREIGN KEY ("broadcast_acks_id") REFERENCES "public"."broadcast_acks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ui_strings_fk" FOREIGN KEY ("ui_strings_id") REFERENCES "public"."ui_strings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_shift_idx" ON "media" USING btree ("shift_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "workers_updated_at_idx" ON "workers" USING btree ("updated_at");
  CREATE INDEX "workers_created_at_idx" ON "workers" USING btree ("created_at");
  CREATE INDEX "shifts_responsible_user_idx" ON "shifts" USING btree ("responsible_user_id");
  CREATE INDEX "shifts_updated_at_idx" ON "shifts" USING btree ("updated_at");
  CREATE INDEX "shifts_created_at_idx" ON "shifts" USING btree ("created_at");
  CREATE INDEX "checklist_templates_items_order_idx" ON "checklist_templates_items" USING btree ("_order");
  CREATE INDEX "checklist_templates_items_parent_id_idx" ON "checklist_templates_items" USING btree ("_parent_id");
  CREATE INDEX "checklist_templates_updated_at_idx" ON "checklist_templates" USING btree ("updated_at");
  CREATE INDEX "checklist_templates_created_at_idx" ON "checklist_templates" USING btree ("created_at");
  CREATE INDEX "checklist_runs_shift_idx" ON "checklist_runs" USING btree ("shift_id");
  CREATE INDEX "checklist_runs_template_idx" ON "checklist_runs" USING btree ("template_id");
  CREATE INDEX "checklist_runs_updated_at_idx" ON "checklist_runs" USING btree ("updated_at");
  CREATE INDEX "checklist_runs_created_at_idx" ON "checklist_runs" USING btree ("created_at");
  CREATE INDEX "checklist_answers_run_idx" ON "checklist_answers" USING btree ("run_id");
  CREATE INDEX "checklist_answers_photo_idx" ON "checklist_answers" USING btree ("photo_id");
  CREATE INDEX "checklist_answers_updated_at_idx" ON "checklist_answers" USING btree ("updated_at");
  CREATE INDEX "checklist_answers_created_at_idx" ON "checklist_answers" USING btree ("created_at");
  CREATE INDEX "tasks_steps_order_idx" ON "tasks_steps" USING btree ("_order");
  CREATE INDEX "tasks_steps_parent_id_idx" ON "tasks_steps" USING btree ("_parent_id");
  CREATE INDEX "tasks_steps_media_idx" ON "tasks_steps" USING btree ("media_id");
  CREATE INDEX "tasks__order_idx" ON "tasks" USING btree ("_order");
  CREATE INDEX "tasks_carried_from_task_idx" ON "tasks" USING btree ("carried_from_task_id");
  CREATE INDEX "tasks_updated_at_idx" ON "tasks" USING btree ("updated_at");
  CREATE INDEX "tasks_created_at_idx" ON "tasks" USING btree ("created_at");
  CREATE INDEX "task_progress_task_idx" ON "task_progress" USING btree ("task_id");
  CREATE INDEX "task_progress_shift_idx" ON "task_progress" USING btree ("shift_id");
  CREATE INDEX "task_progress_worker_idx" ON "task_progress" USING btree ("worker_id");
  CREATE INDEX "task_progress_updated_at_idx" ON "task_progress" USING btree ("updated_at");
  CREATE INDEX "task_progress_created_at_idx" ON "task_progress" USING btree ("created_at");
  CREATE INDEX "blockers_task_idx" ON "blockers" USING btree ("task_id");
  CREATE INDEX "blockers_shift_idx" ON "blockers" USING btree ("shift_id");
  CREATE INDEX "blockers_worker_idx" ON "blockers" USING btree ("worker_id");
  CREATE INDEX "blockers_updated_at_idx" ON "blockers" USING btree ("updated_at");
  CREATE INDEX "blockers_created_at_idx" ON "blockers" USING btree ("created_at");
  CREATE INDEX "blockers_rels_order_idx" ON "blockers_rels" USING btree ("order");
  CREATE INDEX "blockers_rels_parent_idx" ON "blockers_rels" USING btree ("parent_id");
  CREATE INDEX "blockers_rels_path_idx" ON "blockers_rels" USING btree ("path");
  CREATE INDEX "blockers_rels_media_id_idx" ON "blockers_rels" USING btree ("media_id");
  CREATE INDEX "comments_shift_idx" ON "comments" USING btree ("shift_id");
  CREATE INDEX "comments_worker_idx" ON "comments" USING btree ("worker_id");
  CREATE INDEX "comments_updated_at_idx" ON "comments" USING btree ("updated_at");
  CREATE INDEX "comments_created_at_idx" ON "comments" USING btree ("created_at");
  CREATE INDEX "comments_rels_order_idx" ON "comments_rels" USING btree ("order");
  CREATE INDEX "comments_rels_parent_idx" ON "comments_rels" USING btree ("parent_id");
  CREATE INDEX "comments_rels_path_idx" ON "comments_rels" USING btree ("path");
  CREATE INDEX "comments_rels_media_id_idx" ON "comments_rels" USING btree ("media_id");
  CREATE INDEX "changes_log_updated_at_idx" ON "changes_log" USING btree ("updated_at");
  CREATE INDEX "changes_log_created_at_idx" ON "changes_log" USING btree ("created_at");
  CREATE INDEX "broadcasts_task_idx" ON "broadcasts" USING btree ("task_id");
  CREATE INDEX "broadcasts_updated_at_idx" ON "broadcasts" USING btree ("updated_at");
  CREATE INDEX "broadcasts_created_at_idx" ON "broadcasts" USING btree ("created_at");
  CREATE INDEX "broadcasts_rels_order_idx" ON "broadcasts_rels" USING btree ("order");
  CREATE INDEX "broadcasts_rels_parent_idx" ON "broadcasts_rels" USING btree ("parent_id");
  CREATE INDEX "broadcasts_rels_path_idx" ON "broadcasts_rels" USING btree ("path");
  CREATE INDEX "broadcasts_rels_users_id_idx" ON "broadcasts_rels" USING btree ("users_id");
  CREATE INDEX "broadcasts_rels_workers_id_idx" ON "broadcasts_rels" USING btree ("workers_id");
  CREATE INDEX "broadcast_acks_broadcast_idx" ON "broadcast_acks" USING btree ("broadcast_id");
  CREATE INDEX "broadcast_acks_worker_idx" ON "broadcast_acks" USING btree ("worker_id");
  CREATE INDEX "broadcast_acks_updated_at_idx" ON "broadcast_acks" USING btree ("updated_at");
  CREATE INDEX "broadcast_acks_created_at_idx" ON "broadcast_acks" USING btree ("created_at");
  CREATE UNIQUE INDEX "ui_strings_key_idx" ON "ui_strings" USING btree ("key");
  CREATE INDEX "ui_strings_updated_at_idx" ON "ui_strings" USING btree ("updated_at");
  CREATE INDEX "ui_strings_created_at_idx" ON "ui_strings" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_workers_id_idx" ON "payload_locked_documents_rels" USING btree ("workers_id");
  CREATE INDEX "payload_locked_documents_rels_shifts_id_idx" ON "payload_locked_documents_rels" USING btree ("shifts_id");
  CREATE INDEX "payload_locked_documents_rels_checklist_templates_id_idx" ON "payload_locked_documents_rels" USING btree ("checklist_templates_id");
  CREATE INDEX "payload_locked_documents_rels_checklist_runs_id_idx" ON "payload_locked_documents_rels" USING btree ("checklist_runs_id");
  CREATE INDEX "payload_locked_documents_rels_checklist_answers_id_idx" ON "payload_locked_documents_rels" USING btree ("checklist_answers_id");
  CREATE INDEX "payload_locked_documents_rels_tasks_id_idx" ON "payload_locked_documents_rels" USING btree ("tasks_id");
  CREATE INDEX "payload_locked_documents_rels_task_progress_id_idx" ON "payload_locked_documents_rels" USING btree ("task_progress_id");
  CREATE INDEX "payload_locked_documents_rels_blockers_id_idx" ON "payload_locked_documents_rels" USING btree ("blockers_id");
  CREATE INDEX "payload_locked_documents_rels_comments_id_idx" ON "payload_locked_documents_rels" USING btree ("comments_id");
  CREATE INDEX "payload_locked_documents_rels_changes_log_id_idx" ON "payload_locked_documents_rels" USING btree ("changes_log_id");
  CREATE INDEX "payload_locked_documents_rels_broadcasts_id_idx" ON "payload_locked_documents_rels" USING btree ("broadcasts_id");
  CREATE INDEX "payload_locked_documents_rels_broadcast_acks_id_idx" ON "payload_locked_documents_rels" USING btree ("broadcast_acks_id");
  CREATE INDEX "payload_locked_documents_rels_ui_strings_id_idx" ON "payload_locked_documents_rels" USING btree ("ui_strings_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "workers" CASCADE;
  DROP TABLE "shifts" CASCADE;
  DROP TABLE "checklist_templates_items" CASCADE;
  DROP TABLE "checklist_templates" CASCADE;
  DROP TABLE "checklist_runs" CASCADE;
  DROP TABLE "checklist_answers" CASCADE;
  DROP TABLE "tasks_steps" CASCADE;
  DROP TABLE "tasks" CASCADE;
  DROP TABLE "task_progress" CASCADE;
  DROP TABLE "blockers" CASCADE;
  DROP TABLE "blockers_rels" CASCADE;
  DROP TABLE "comments" CASCADE;
  DROP TABLE "comments_rels" CASCADE;
  DROP TABLE "changes_log" CASCADE;
  DROP TABLE "broadcasts" CASCADE;
  DROP TABLE "broadcasts_rels" CASCADE;
  DROP TABLE "broadcast_acks" CASCADE;
  DROP TABLE "ui_strings" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_media_type";
  DROP TYPE "public"."enum_media_source";
  DROP TYPE "public"."enum_workers_role";
  DROP TYPE "public"."enum_checklist_templates_type";
  DROP TYPE "public"."enum_checklist_answers_status";
  DROP TYPE "public"."enum_blockers_kind";
  DROP TYPE "public"."enum_comments_context_type";
  DROP TYPE "public"."enum_broadcasts_kind";`)
}
