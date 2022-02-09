exports.up = async (knex) => {
    await knex.raw(`
        BEGIN;
            UPDATE "Ticket" AS t
            SET "propertyAddress" = p.address
            FROM "Property" AS p
            WHERE t.property = p.id;
        COMMIT;
    `)
}

exports.down = async (knex) => {
    return
}