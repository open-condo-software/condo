// KMIGRATOR:0426_manual_modify_billingReceipt_constraint

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
    --
    -- [CUSTOM] Set Statement Timeout to some large amount - 25 min (25 * 60 => 1500 sec)
    --
    SET statement_timeout = '1500s';
    --
    -- Delete old (context, importId) constraint
    --
    ALTER TABLE "BillingReceipt" DROP CONSTRAINT "BillingReceipt_importId_9da6acbf_uniq";
    --
    -- Create new (context, importId) constraint where deletedAt is null
    --
    CREATE UNIQUE INDEX IF NOT EXISTS "BillingReceipt_context_importId" ON "BillingReceipt" ("context", "importId") WHERE "deletedAt" IS NULL;
    --
    -- [CUSTOM] Revert Statement Timeout to default amount - 10 secs
    --
    SET statement_timeout = '10s';
    COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;
    --
    -- [CUSTOM] Set Statement Timeout to some large amount - 25 min (25 * 60 => 1500 sec)
    --
    SET statement_timeout = '1500s';
    --
    -- Delete old (context, importId) constraint
    --
    ALTER TABLE "BillingReceipt" ADD CONSTRAINT "BillingReceipt_importId_9da6acbf_uniq" UNIQUE ("context", "importId");
    --
    -- Create new (context, importId) constraint where deletedAt is null
    --
    DROP INDEX IF EXISTS "BillingReceipt_context_importId";
    --
    -- [CUSTOM] Revert Statement Timeout to default amount - 10 secs
    --
    SET statement_timeout = '10s';
    COMMIT;

    `)
}
