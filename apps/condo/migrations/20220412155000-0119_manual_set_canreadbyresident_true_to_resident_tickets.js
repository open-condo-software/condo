exports.up = async (knex) => {
    await knex.raw(`
        BEGIN;
            UPDATE "Ticket"
            SET canReadByResident = true
            JOIN "User" ON "User".id = "Ticket".createdBy
            WHERE "User".type = 'resident';
        COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
       BEGIN;
            UPDATE "Ticket"
            SET canReadByResident = false
            JOIN "User" ON "User".id = "Ticket".createdBy
            WHERE "User".type = 'resident';
        COMMIT;
    `)
}