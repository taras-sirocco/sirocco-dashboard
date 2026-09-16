import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tasks_task_type" AS ENUM('production', 'rework');
  ALTER TABLE "tasks" ADD COLUMN "task_type" "enum_tasks_task_type" DEFAULT 'production' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tasks" DROP COLUMN "task_type";
  DROP TYPE "public"."enum_tasks_task_type";`)
}
