exports.up = async (knex) => {
    await knex.raw(`
        BEGIN;
        INSERT INTO "MeterReadingSource" (dv, sender, type, name, id, v, "createdAt", "updatedAt", "deletedAt", "newId", "createdBy", "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial"}', 'import_condo', 'meterReadingSource.ImportCondo.name', 'b0caa26a-bfba-41e3-a9fe-64d7f02f0650', 1, '2020-11-24 00:00:00.000000', '2020-11-24 00:00:00.000000', null, null, null, null);
        COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
        BEGIN;
        DELETE FROM "MeterReadingSource" where id = 'b0caa26a-bfba-41e3-a9fe-64d7f02f0650';
        COMMIT;
    `)
}