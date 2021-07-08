exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
    
    -- Dispatcher
    INSERT INTO "OrganizationEmployeeRole" (
        id, dv, v, sender, organization, "createdAt", "updatedAt",
        name,
        "canManageOrganization",
        "canManageEmployees",
        "canManageRoles",
        "canManageIntegrations",
        "canManageProperties",
        "canManageTickets",
        "canManageContacts",
        "canManageTicketComments"
    )
    SELECT
        gen_random_uuid(), 1, v, '{"dv": 1, "fingerprint": "migration", "timestamp": "20210707112100"}'::json, org.id, now(), now(),
        case when org.country = 'ru' then 'Диспетчер'
             when org.country = 'en' then 'Dispatcher'
        end,
        false,
        false,
        false,
        false,
        true,
        true,
        true,
        true
    FROM "Organization" AS org
    WHERE NOT EXISTS(SELECT FROM "OrganizationEmployeeRole" WHERE organization = org.id AND (name = 'Диспетчер' OR name = 'Dispatcher'));
    COMMIT;

    -- Manager
    INSERT INTO "OrganizationEmployeeRole" (
        id, dv, v, sender, organization, "createdAt", "updatedAt",
        name,
        "canManageOrganization",
        "canManageEmployees",
        "canManageRoles",
        "canManageIntegrations",
        "canManageProperties",
        "canManageTickets",
        "canManageContacts",
        "canManageTicketComments"
    )
    SELECT
        gen_random_uuid(), 1, v, '{"dv": 1, "fingerprint": "migration", "timestamp": "20210707112100"}'::json, org.id, now(), now(),
        case when org.country = 'ru' then 'Управляющий'
             when org.country = 'en' then 'Manager'
        end,
        false,
        false,
        false,
        false,
        true,
        true,
        true,
        true
    FROM "Organization" AS org
    WHERE NOT EXISTS(SELECT FROM "OrganizationEmployeeRole" WHERE organization = org.id AND (name = 'Управляющий' OR name = 'Manager'));
    COMMIT;
    
    -- Foreman
    INSERT INTO "OrganizationEmployeeRole" (
        id, dv, v, sender, organization, "createdAt", "updatedAt",
        name,
        "canManageOrganization",
        "canManageEmployees",
        "canManageRoles",
        "canManageIntegrations",
        "canManageProperties",
        "canManageTickets",
        "canManageContacts",
        "canManageTicketComments"
    )
    SELECT
        gen_random_uuid(), 1, v, '{"dv": 1, "fingerprint": "migration", "timestamp": "20210707112100"}'::json, org.id, now(), now(),
        case when org.country = 'ru' then 'Мастер участка'
             when org.country = 'en' then 'Foreman'
        end,
        false,
        false,
        false,
        false,
        true,
        true,
        true,
        true
    FROM "Organization" AS org
    WHERE NOT EXISTS(SELECT FROM "OrganizationEmployeeRole" WHERE organization = org.id AND (name = 'Мастер участка' OR name = 'Foreman'));
    COMMIT;
    
    -- Technician
    INSERT INTO "OrganizationEmployeeRole" (
        id, dv, v, sender, organization, "createdAt", "updatedAt",
        name,
        "canManageOrganization",
        "canManageEmployees",
        "canManageRoles",
        "canManageIntegrations",
        "canManageProperties",
        "canManageTickets",
        "canManageContacts",
        "canManageTicketComments"
    )
    SELECT
        gen_random_uuid(), 1, v, '{"dv": 1, "fingerprint": "migration", "timestamp": "20210707112100"}'::json, org.id, now(), now(),
        case when org.country = 'ru' then 'Техник'
             when org.country = 'en' then 'Technician'
        end,
        false,
        false,
        false,
        false,
        true,
        true,
        true,
        true
    FROM "Organization" AS org
    WHERE NOT EXISTS(SELECT FROM "OrganizationEmployeeRole" WHERE organization = org.id AND (name = 'Техник' OR name = 'Technician'));
    COMMIT;

    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;
    
    DELETE FROM
        "OrganizationEmployeeRole"
    WHERE
        sender::json->>'fingerprint' = 'migration' AND
        sender::json->>'timestamp' = '20210707112100';
    
COMMIT;

    `)
}
