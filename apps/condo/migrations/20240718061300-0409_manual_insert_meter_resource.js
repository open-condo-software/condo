// KMIGRATOR:0409_manual_insert_meter_resource

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
    --
    -- Add meter resource
    --
    INSERT INTO public."MeterResource" (dv, sender, name, measure, id, v, "createdAt", "updatedAt", "deletedAt", "newId", "createdBy", "updatedBy")
    VALUES (1::integer, '{"dv": 1, "fingerprint":"sql-migration"}'::jsonb, 'meterResource.Drainage.name'::text,
            'meterResource.Drainage.measure'::text, 'ffc3f0c3-5044-4093-93ce-d7e92176dfe2'::uuid, 1::integer, NOW(),
            NOW(), null::timestamp with time zone, null::uuid, null::uuid, null::uuid);

    COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;
    
    DELETE FROM "MeterResource" where id = 'ffc3f0c3-5044-4093-93ce-d7e92176dfe2';

    COMMIT;

    `)
}
