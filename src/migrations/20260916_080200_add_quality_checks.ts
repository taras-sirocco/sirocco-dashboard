import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "quality_checks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"shift_id" integer NOT NULL,
  	"task_id" integer NOT NULL,
  	"qty_done" numeric NOT NULL,
  	"qty_accepted" numeric NOT NULL,
  	"comment" varchar,
  	"checked_by_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "quality_checks_id" integer;
  ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "quality_checks" ADD CONSTRAINT "quality_checks_checked_by_id_workers_id_fk" FOREIGN KEY ("checked_by_id") REFERENCES "public"."workers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quality_checks_fk" FOREIGN KEY ("quality_checks_id") REFERENCES "public"."quality_checks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "quality_checks_shift_idx" ON "quality_checks" USING btree ("shift_id");
  CREATE INDEX "quality_checks_task_idx" ON "quality_checks" USING btree ("task_id");
  CREATE UNIQUE INDEX "shift_task_idx" ON "quality_checks" USING btree ("shift_id","task_id");
  CREATE INDEX "quality_checks_checked_by_idx" ON "quality_checks" USING btree ("checked_by_id");
  CREATE INDEX "quality_checks_updated_at_idx" ON "quality_checks" USING btree ("updated_at");
  CREATE INDEX "quality_checks_created_at_idx" ON "quality_checks" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_quality_checks_id_idx" ON "payload_locked_documents_rels" USING btree ("quality_checks_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "quality_checks" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "quality_checks" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_quality_checks_fk";

  DROP INDEX "payload_locked_documents_rels_quality_checks_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "quality_checks_id";`)
}
