// KMIGRATOR:0282_manual_fix_news_items_permissions

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;

    UPDATE "OrganizationEmployeeRole"
    SET ("canManageNewsItems", "canManageNewsItemTemplates") = (true, true)
    WHERE "name" in ('employee.role.Administrator.name','employee.role.Dispatcher.name','employee.role.Manager.name');

    COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;

    COMMIT;

    `)
}
