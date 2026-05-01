exports.up = async (knex) => {
    await knex.raw(`
BEGIN;

ALTER TABLE "BillingPolicy" ALTER COLUMN "partialMonthRule" SET DEFAULT 'full';

ALTER TABLE "RentCharge" ADD COLUMN IF NOT EXISTS "periodStart" date NULL;
ALTER TABLE "RentCharge" ADD COLUMN IF NOT EXISTS "periodEnd" date NULL;
ALTER TABLE "RentCharge" ADD COLUMN IF NOT EXISTS "dueDate" date NULL;
ALTER TABLE "RentCharge" ADD COLUMN IF NOT EXISTS "currencyCode" text NULL;

UPDATE "RentCharge"
SET
    "periodStart" = COALESCE("periodStart", "billingMonth"),
    "periodEnd" = COALESCE("periodEnd", ("billingMonth" + INTERVAL '1 month - 1 day')::date),
    "dueDate" = COALESCE("dueDate", "billingMonth"),
    "currencyCode" = COALESCE("currencyCode", 'RUB')
WHERE "billingMonth" IS NOT NULL;

ALTER TABLE "RentCharge" ALTER COLUMN "periodStart" SET NOT NULL;
ALTER TABLE "RentCharge" ALTER COLUMN "periodEnd" SET NOT NULL;
ALTER TABLE "RentCharge" ALTER COLUMN "dueDate" SET NOT NULL;
ALTER TABLE "RentCharge" ALTER COLUMN "currencyCode" SET DEFAULT 'RUB';
ALTER TABLE "RentCharge" ALTER COLUMN "currencyCode" SET NOT NULL;

ALTER TABLE "RentChargeHistoryRecord" ADD COLUMN IF NOT EXISTS "periodStart" date NULL;
ALTER TABLE "RentChargeHistoryRecord" ADD COLUMN IF NOT EXISTS "periodEnd" date NULL;
ALTER TABLE "RentChargeHistoryRecord" ADD COLUMN IF NOT EXISTS "dueDate" date NULL;
ALTER TABLE "RentChargeHistoryRecord" ADD COLUMN IF NOT EXISTS "currencyCode" text NULL;

CREATE OR REPLACE VIEW "analytics"."RentCharge" AS (
    SELECT
        "amount", "billingMonth", "billingReceipt", "createdAt", "createdBy",
        "currencyCode", "deletedAt", "dueDate", "dv", "id", "invoice",
        "newId", "occupancy", "organization", "periodEnd", "periodStart",
        "property", "rentalUnit", "sender", "status", "updatedAt",
        "updatedBy", "v"
    FROM "public"."RentCharge"
);

COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
BEGIN;

CREATE OR REPLACE VIEW "analytics"."RentCharge" AS (
    SELECT
        "amount", "billingMonth", "billingReceipt", "createdAt", "createdBy",
        "deletedAt", "dv", "id", "invoice", "newId", "occupancy",
        "organization", "property", "rentalUnit", "sender", "status",
        "updatedAt", "updatedBy", "v"
    FROM "public"."RentCharge"
);

ALTER TABLE "RentChargeHistoryRecord" DROP COLUMN IF EXISTS "currencyCode";
ALTER TABLE "RentChargeHistoryRecord" DROP COLUMN IF EXISTS "dueDate";
ALTER TABLE "RentChargeHistoryRecord" DROP COLUMN IF EXISTS "periodEnd";
ALTER TABLE "RentChargeHistoryRecord" DROP COLUMN IF EXISTS "periodStart";

ALTER TABLE "RentCharge" DROP COLUMN IF EXISTS "currencyCode";
ALTER TABLE "RentCharge" DROP COLUMN IF EXISTS "dueDate";
ALTER TABLE "RentCharge" DROP COLUMN IF EXISTS "periodEnd";
ALTER TABLE "RentCharge" DROP COLUMN IF EXISTS "periodStart";

ALTER TABLE "BillingPolicy" ALTER COLUMN "partialMonthRule" SET DEFAULT 'prorate_by_days';

COMMIT;
    `)
}
