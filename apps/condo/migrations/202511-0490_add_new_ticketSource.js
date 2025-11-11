exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;

INSERT INTO "TicketSource" (dv, sender, type, name, id, v, "createdAt", "updatedAt", "deletedAt", "newId", "createdBy", "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial"}', 'domclick', 'ДомКлик', '449e14f0-ab33-46b0-9960-13626ee47f51', 1, '2025-11-10 00:00:00.000000', '2025-11-10 00:00:00.000000', null, null, null, null);

    COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;

    UPDATE "TicketSource" 
    SET "deletedAt" = NOW()
    WHERE type = 'domclick' 
    AND id = '449e14f0-ab33-46b0-9960-13626ee47f51';

    COMMIT;
    `)
}
