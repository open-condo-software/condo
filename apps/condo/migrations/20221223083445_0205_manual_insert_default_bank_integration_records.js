// KMIGRATOR:20221223083445_0205_manual_insert_default_bank_integration_records

exports.up = async (knex) => {
    await knex.raw(`
        BEGIN;
        INSERT INTO "BankIntegration" (dv, sender, name, id, v, "createdAt", "updatedAt", "deletedAt", "newId", "createdBy", "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial"}', 'SBBOL', 'd94743b0-e5d5-4d06-a244-ea4b2edb8633', 1, '2022-12-22 00:00:00.000000', '2022-12-22 00:00:00.000000', null, null, null, null);
        INSERT INTO "BankIntegration" (dv, sender, name, id, v, "createdAt", "updatedAt", "deletedAt", "newId", "createdBy", "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial"}', '1CClientBankExchange', '61e3d767-bd62-40e3-a503-f885b242d262', 1, '2022-12-22 00:00:00.000000', '2022-12-22 00:00:00.000000', null, null, null, null);
        COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
        BEGIN;
        DELETE FROM "BankIntegration" WHERE id = 'd94743b0-e5d5-4d06-a244-ea4b2edb8633';
        DELETE FROM "BankIntegration" WHERE id = '61e3d767-bd62-40e3-a503-f885b242d262';
        COMMIT;
    `)
}
