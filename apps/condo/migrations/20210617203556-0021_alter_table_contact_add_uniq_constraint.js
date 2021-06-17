exports.up = async (knex) => {
    await knex.raw(`
        BEGIN;
        ALTER TABLE "Contact" ADD CONSTRAINT "Contact_uniq" UNIQUE ("property", "unitName", "name", "phone");
        COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
        BEGIN;
        ALTER TABLE "Contact" DROP CONSTRAINT "Contact_uniq";
        COMMIT;
    `)
}
