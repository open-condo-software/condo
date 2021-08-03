exports.up = async (knex) => {
    // maybe read deafults.json and iterate over it here
    // to dynamically replace localzied names?

    // is there need to change fingerprint and down this mutation?
    await knex.raw(`
    BEGIN;
        -- Administrator
        UPDATE "OrganizationEmployeeRole"
        SET name = 'employee.role.Administrator.name'
        WHERE (name = 'Administrator' OR name = 'Администратор') AND "createdAt" = "updatedAt" AND "createdBy" = "updatedBy";
        COMMIT;

        -- Dispatcher
        UPDATE "OrganizationEmployeeRole"
        SET name = 'employee.role.Dispatcher.name'
        WHERE (name = 'Dispatcher' OR name = 'Диспетчер') AND "createdAt" = "updatedAt" AND "createdBy" = "updatedBy";
        COMMIT;

        -- Manager
        UPDATE "OrganizationEmployeeRole"
        SET name = 'employee.role.Manager.name'
        WHERE (name = 'Manager' OR name = 'Управляющий') AND "createdAt" = "updatedAt" AND "createdBy" = "updatedBy";
        COMMIT;

        -- Foreman
        UPDATE "OrganizationEmployeeRole"
        SET name = 'employee.role.Foreman.name'
        WHERE (name = 'Foreman' OR name = 'Мастер участка') AND "createdAt" = "updatedAt" AND "createdBy" = "updatedBy";
        COMMIT;

        -- Technician
        UPDATE "OrganizationEmployeeRole"
        SET name = 'employee.role.Foreman.name'
        WHERE (name = 'Technician' OR name = 'Техник') AND "createdAt" = "updatedAt" AND "createdBy" = "updatedBy";
        COMMIT;
    END;
    `)
}

exports.down = async (knex) => {
    return
}
