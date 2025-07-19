exports.up = async (knex) => {
    await knex.raw(`
        BEGIN;
            UPDATE "Ticket"
            SET "canReadByResident" = true
            FROM "User"
            WHERE "Ticket"."createdBy" = "User"."id" AND "User"."type" = 'resident';
        COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
       BEGIN;
            UPDATE "Ticket"
            SET "canReadByResident" = false
            FROM "User"
            WHERE "Ticket"."createdBy" = "User".id AND "User"."type" = 'resident';
        COMMIT;
    `)
}