exports.up = async (knex) => {
    await knex.raw(`
        BEGIN;
            UPDATE "Ticket"
            SET "client" = "Resident"."user",
                "clientName" = "User"."name",
                "clientPhone" = "User"."phone",
                "clientEmail" = "User"."email"
            FROM "Resident"
            JOIN "User" ON "Resident"."user" = "User"."id"
            JOIN "Contact" ON "Contact"."phone" = "User"."phone" AND
                "Ticket"."contact" = "Contact"."id"
            WHERE "Ticket"."client" IS NULL AND
                "Resident"."property" = "Ticket"."property" AND
                "Resident"."unitName" = "Ticket"."unitName" AND
                "Resident"."unitType" = "Ticket"."unitType"
        COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
        BEGIN;
            UPDATE "Ticket"
            SET "client" = NULL
            FROM "Resident"
            JOIN "User" ON "Resident"."user" = "User"."id"
            JOIN "Contact" ON "Contact"."phone" = "User"."phone" AND
                "Ticket"."contact" = "Contact"."id"
            WHERE "Ticket"."client" IS NULL AND
                "Resident"."property" = "Ticket"."property" AND
                "Resident"."unitName" = "Ticket"."unitName" AND
                "Resident"."unitType" = "Ticket"."unitType"
        COMMIT;
    `)
}