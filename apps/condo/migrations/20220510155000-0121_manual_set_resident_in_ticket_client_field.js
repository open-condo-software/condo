exports.up = async (knex) => {
    await knex.raw(`
        BEGIN;
            UPDATE "Ticket"
            SET "client" = "Resident"."user",
                "clientName" = "User"."name",
                "clientPhone" = "User"."phone",
                "clientEmail" = "User"."email"
            FROM "Contact"
            JOIN "User" ON
                "Contact"."phone" = "User"."phone"
            JOIN "Resident" ON
                "Resident"."user" = "User"."id"
            WHERE "Ticket"."client" IS NULL AND
                  "Ticket"."contact" = "Contact"."id" AND
                  "Resident"."property" = "Ticket"."property" AND
                  "Resident"."unitName" = "Ticket"."unitName" AND
                  "Resident"."unitType" = "Ticket"."unitType";
        COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
        BEGIN;
            UPDATE "Ticket"
            SET "client" = NULL
            FROM "Contact"
            JOIN "User" ON
                "Contact"."phone" = "User"."phone"
            JOIN "Resident" ON
                "Resident"."user" = "User"."id"
            WHERE "Ticket"."client" IS NOT NULL AND
                  "Ticket"."contact" = "Contact"."id" AND
                  "Resident"."property" = "Ticket"."property" AND
                  "Resident"."unitName" = "Ticket"."unitName" AND
                  "Resident"."unitType" = "Ticket"."unitType";
        COMMIT;
    `)
}