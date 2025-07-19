exports.up = async (knex) => {
    await knex.raw(`
        BEGIN;
            UPDATE "Ticket" AS t
            SET "propertyAddress" = p.address,
                "propertyAddressMeta" = p."addressMeta"
            FROM "Property" AS p
            WHERE t.property = p.id;
            COMMIT;
        END;
    `)
}

exports.down = async (knew) => {
    return
}