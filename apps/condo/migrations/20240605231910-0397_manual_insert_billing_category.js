// KMIGRATOR:0397_manual_insert_billing_category

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
    --
    -- Add water removal category to billingreceipt
    --
    INSERT INTO public."BillingCategory" (dv, sender, name, id, v, "createdAt", "updatedAt", "deletedAt", "newId", "createdBy", "updatedBy")
    VALUES (1::integer, '{"dv": 1, "fingerprint":"sql-migration"}'::jsonb, 'billing.category.water_removal.name'::text,
            '800a4216-b27f-4466-b359-5964b347371f'::uuid, 1::integer, null::timestamp with time zone,
            null::timestamp with time zone, null::timestamp with time zone, null::uuid, null::uuid, null::uuid);

    COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;
    
    DELETE FROM "BillingCategory" where id = '800a4216-b27f-4466-b359-5964b347371f';

    COMMIT;

    `)
}
