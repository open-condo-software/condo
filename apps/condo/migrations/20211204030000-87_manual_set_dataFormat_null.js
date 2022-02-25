exports.up = async (knex) => {
    await knex.raw(`
        BEGIN;
        UPDATE "BillingIntegration" SET "dataFormat" = null WHERE true;
        COMMIT;
    `)
}

exports.down = async (knew) => {
    return
}