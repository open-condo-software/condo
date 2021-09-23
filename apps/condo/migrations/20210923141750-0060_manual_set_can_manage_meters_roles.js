exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
        UPDATE "OrganizationEmployeeRole"
        SET "canManageMeters" = true
        WHERE name = 'employee.role.Administrator.name'
            OR name = 'employee.role.Dispatcher.name'
            OR name = 'employee.role.Foreman.name'
            OR name = 'employee.role.Manager.name';
    END;
    `)
}

exports.down = async (knex) => {
    return
}
