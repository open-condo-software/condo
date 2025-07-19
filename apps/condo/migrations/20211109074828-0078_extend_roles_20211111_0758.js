exports.up = async (knex) => {
    await knex.raw(`
BEGIN;
--
-- ADD canManageDivisions permissions to Foreman, Dispatcher, Manager 
--
UPDATE "OrganizationEmployeeRole" SET "canManageDivisions" = true WHERE "name" = ANY(ARRAY['employee.role.Foreman.name', 'employee.role.Dispatcher.name', 'employee.role.Manager.name']);

--
-- ADD canManageContacts and canManageEmployees permissions to Foreman 
--
UPDATE "OrganizationEmployeeRole" SET "canManageContacts" = true, "canManageEmployees" = true WHERE "name" = 'employee.role.Foreman.name';

COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
BEGIN;
--
-- REMOVE canManageDivisions permissions from Foreman, Dispatcher, Manager 
--
UPDATE "OrganizationEmployeeRole" SET "canManageDivisions" = false WHERE "name" = ANY(ARRAY['employee.role.Foreman.name', 'employee.role.Dispatcher.name', 'employee.role.Manager.name']);
--
-- REMOVE canManageContacts and canManageEmployees permissions from Foreman 
--
UPDATE "OrganizationEmployeeRole" SET "canManageContacts" = false, "canManageEmployees" = false WHERE "name" = 'employee.role.Foreman.name';

COMMIT;
    `)
}
