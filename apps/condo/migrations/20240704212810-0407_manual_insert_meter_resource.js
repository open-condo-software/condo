// KMIGRATOR:0407_manual_insert_meter_resource

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
    --
    -- Add meter resource
    --
    INSERT INTO public."MeterResource" (dv, sender, name, measure, id, v, "createdAt", "updatedAt", "deletedAt", "newId", "createdBy", "updatedBy")
    VALUES (1::integer, '{"dv": 1, "fingerprint":"sql-migration"}'::jsonb, 'meterResource.ColdAir.name'::text,
            'meterResource.ColdAir.measure'::text, '4cb94217-14cb-4897-8b8f-891b781a1896'::uuid, 1::integer, null::timestamp with time zone,
            null::timestamp with time zone, null::timestamp with time zone, null::uuid, null::uuid, null::uuid);

    COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;
    
    DELETE FROM "MeterResource" where id = '4cb94217-14cb-4897-8b8f-891b781a1896';

    COMMIT;

    `)
}
