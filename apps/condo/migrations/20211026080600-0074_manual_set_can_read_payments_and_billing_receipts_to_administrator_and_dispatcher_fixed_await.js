exports.up = async (knex) => {
    await knex.raw(`
        BEGIN;
            UPDATE "OrganizationEmployeeRole"
            SET "canReadPayments" = true,
                "canReadBillingReceipts" = true
            WHERE name = 'employee.role.Administrator.name'
                OR name = 'employee.role.Dispatcher.name';
            COMMIT;
        END;
    `)
}

exports.down = async (knew) => {
    return
}