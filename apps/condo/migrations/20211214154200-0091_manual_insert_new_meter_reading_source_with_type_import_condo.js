// KMIGRATOR:0090_alter_meterreadingsource_type:IyBHZW5lcmF0ZWQgYnkgRGphbmdvIDQuMCBvbiAyMDIxLTEyLTE1IDIxOjEwCgpmcm9tIGRqYW5nby5kYiBpbXBvcnQgbWlncmF0aW9ucywgbW9kZWxzCgoKY2xhc3MgTWlncmF0aW9uKG1pZ3JhdGlvbnMuTWlncmF0aW9uKToKCiAgICBkZXBlbmRlbmNpZXMgPSBbCiAgICAgICAgKCdfZGphbmdvX3NjaGVtYScsICcwMDg5X2F1dG9fMjAyMTEyMTNfMTMwNicpLAogICAgXQoKICAgIG9wZXJhdGlvbnMgPSBbCiAgICAgICAgbWlncmF0aW9ucy5BbHRlckZpZWxkKAogICAgICAgICAgICBtb2RlbF9uYW1lPSdtZXRlcnJlYWRpbmdzb3VyY2UnLAogICAgICAgICAgICBuYW1lPSd0eXBlJywKICAgICAgICAgICAgZmllbGQ9bW9kZWxzLkNoYXJGaWVsZChjaG9pY2VzPVsoJ2NhbGwnLCAnY2FsbCcpLCAoJ21vYmlsZV9hcHAnLCAnbW9iaWxlX2FwcCcpLCAoJ2ltcG9ydF9jb25kbycsICdpbXBvcnRfY29uZG8nKV0sIG1heF9sZW5ndGg9NTApLAogICAgICAgICksCiAgICBdCg==
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