import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "step_media" (
  	"id" serial PRIMARY KEY NOT NULL,
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
  
  ALTER TABLE "tasks_steps" DROP CONSTRAINT "tasks_steps_media_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "step_media_id" integer;
  CREATE INDEX "step_media_updated_at_idx" ON "step_media" USING btree ("updated_at");
  CREATE INDEX "step_media_created_at_idx" ON "step_media" USING btree ("created_at");
  CREATE UNIQUE INDEX "step_media_filename_idx" ON "step_media" USING btree ("filename");
  ALTER TABLE "tasks_steps" ADD CONSTRAINT "tasks_steps_media_id_step_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."step_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_step_media_fk" FOREIGN KEY ("step_media_id") REFERENCES "public"."step_media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_step_media_id_idx" ON "payload_locked_documents_rels" USING btree ("step_media_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "step_media" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "step_media" CASCADE;
  ALTER TABLE "tasks_steps" DROP CONSTRAINT "tasks_steps_media_id_step_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_step_media_fk";
  
  DROP INDEX "payload_locked_documents_rels_step_media_id_idx";
  ALTER TABLE "tasks_steps" ADD CONSTRAINT "tasks_steps_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "step_media_id";`)
}
