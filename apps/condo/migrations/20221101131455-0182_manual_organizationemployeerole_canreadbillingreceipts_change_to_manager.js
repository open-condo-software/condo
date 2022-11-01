exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
UPDATE "OrganizationEmployeeRole"
SET "canReadBillingReceipts" = true
WHERE "name" = 'employee.role.Manager.name';

COMMIT;

    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;
UPDATE "OrganizationEmployeeRole"
SET "canReadBillingReceipts" = false
WHERE "name" = 'employee.role.Manager.name';

COMMIT;

    `)
}
