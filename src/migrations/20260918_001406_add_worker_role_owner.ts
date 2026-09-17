import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_workers_role" ADD VALUE 'owner';`)
}

// Postgres не має DROP VALUE для enum — відкат перебудовує тип з нуля.
// Спрацює лише якщо на момент відкату жоден worker не має role='owner'
// (інакше USING-каст впаде з помилкою — це навмисно, краще гучна
// помилка, ніж тихо загубити роль існуючого запису).
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "workers" ALTER COLUMN "role" DROP DEFAULT;
  ALTER TABLE "workers" ALTER COLUMN "role" SET DATA TYPE text;
  DROP TYPE "public"."enum_workers_role";
  CREATE TYPE "public"."enum_workers_role" AS ENUM('worker', 'foreman');
  ALTER TABLE "workers" ALTER COLUMN "role" SET DATA TYPE "public"."enum_workers_role" USING "role"::"public"."enum_workers_role";
  ALTER TABLE "workers" ALTER COLUMN "role" SET DEFAULT 'worker';`)
}
