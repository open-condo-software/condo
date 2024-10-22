// KMIGRATOR:0434_manual_new_meterreadingsource:IyBHZW5lcmF0ZWQgYnkgRGphbmdvIDQuMC42IG9uIDIwMjItMTItMDEgMDg6MjUKCmZyb20gZGphbmdvLmRiIGltcG9ydCBtaWdyYXRpb25zLCBtb2RlbHMKCgpjbGFzcyBNaWdyYXRpb24obWlncmF0aW9ucy5NaWdyYXRpb24pOgoKICAgIGRlcGVuZGVuY2llcyA9IFsKICAgICAgICAoJ19kamFuZ29fc2NoZW1hJywgJzAxOTRfYXNzaWduZWVzY29wZV9hc3NpZ25lZXNjb3BlaGlzdG9yeXJlY29yZF9hbmRfbW9yZScpLAogICAgXQoKICAgIG9wZXJhdGlvbnMgPSBbCiAgICAgICAgbWlncmF0aW9ucy5BbHRlckZpZWxkKAogICAgICAgICAgICBtb2RlbF9uYW1lPSdtZXRlcnJlYWRpbmdzb3VyY2UnLAogICAgICAgICAgICBuYW1lPSd0eXBlJywKICAgICAgICAgICAgZmllbGQ9bW9kZWxzLkNoYXJGaWVsZChjaG9pY2VzPVsoJ2ltcG9ydF9jb25kbycsICdpbXBvcnRfY29uZG8nKSwgKCdjYWxsJywgJ2NhbGwnKSwgKCdtb2JpbGVfYXBwJywgJ21vYmlsZV9hcHAnKSwgKCdleHRlcm5hbF9pbXBvcnQnLCAnZXh0ZXJuYWxfaW1wb3J0JyksICgnZW1haWwnLCAnZW1haWwnKSwgKCdyZW1vdGVfc3lzdGVtJywgJ3JlbW90ZV9zeXN0ZW0nKSwgKCdvdGhlcicsICdvdGhlcicpLCAoJ3Zpc2l0JywgJ3Zpc2l0JyksICgnd2ViX2FwcCcsICd3ZWJfYXBwJyksICgnb3JnYW5pemF0aW9uX3NpdGUnLCAnb3JnYW5pemF0aW9uX3NpdGUnKSwgKCdtZXNzZW5nZXInLCAnbWVzc2VuZ2VyJyksICgnc29jaWFsX25ldHdvcmsnLCAnc29jaWFsX25ldHdvcmsnKSwgKCdtb2JpbGVfYXBwX3N0YWZmJywgJ21vYmlsZV9hcHBfc3RhZmYnKV0sIG1heF9sZW5ndGg9NTApLAogICAgICAgICksCiAgICBdCg==

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
    --
    -- Alter field type on meterreadingsource
    --
    INSERT INTO "MeterReadingSource" (dv, sender, type, name, id, v, "createdAt", "updatedAt", "deletedAt", "newId", "createdBy", "updatedBy") VALUES (1, '{"dv": 1, "fingerprint": "initial"}', 'meters_billing_integration_kvp24', 'meterReadingSource.metersBillingIntegrationKvp24.name', '3450106c-2613-49e8-8d97-b3adf5edd189', 1, '2024-10-22 00:00:00.000000', '2024-10-22 00:00:00.000000', null, null, null, null);
    COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;
    --
    -- Alter field type on meterreadingsource
    --
    DELETE FROM "MeterReadingSource" where id = '3450106c-2613-49e8-8d97-b3adf5edd189';
    COMMIT;

    `)
}
