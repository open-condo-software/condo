// KMIGRATOR:0182_manual_organizationemployeerole_canreadbillingreceipts_change_to_manager

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- [CUSTOM] Set Statement Timeout to some large amount - 25 min (25 * 60 => 1500 sec)
--
SET statement_timeout = '1500s'; 
UPDATE "OrganizationEmployeeRole"
SET "canReadBillingReceipts" = true
WHERE "name" = 'employee.role.Manager.name';
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
UPDATE "OrganizationEmployeeRole"
SET "canReadBillingReceipts" = false
WHERE "name" = 'employee.role.Manager.name';
--
-- [CUSTOM] Revert Statement Timeout to default amount - 10 secs
--
SET statement_timeout = '10s';
COMMIT;

    `)
}
