exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
        UPDATE "OrganizationEmployeeRole"
        SET "canManageDivisions" = true
        WHERE name = 'employee.role.Administrator.name';
        COMMIT;
    END;
    `)
}

exports.down = async (knex) => {
    return
}
