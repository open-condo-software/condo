// auto generated by kmigrator
// KMIGRATOR:0404_alter_messagebatch_messagetype:IyBHZW5lcmF0ZWQgYnkgRGphbmdvIDQuMi4xMyBvbiAyMDI0LTA2LTI3IDEyOjM1Cgpmcm9tIGRqYW5nby5kYiBpbXBvcnQgbWlncmF0aW9ucywgbW9kZWxzCgoKY2xhc3MgTWlncmF0aW9uKG1pZ3JhdGlvbnMuTWlncmF0aW9uKToKCiAgICBkZXBlbmRlbmNpZXMgPSBbCiAgICAgICAgKCdfZGphbmdvX3NjaGVtYScsICcwNDAzX2IyYmFwcG5ld3NzaGFyaW5nY29uZmlnX2N1c3RvbWZvcm11cmxfYW5kX21vcmUnKSwKICAgIF0KCiAgICBvcGVyYXRpb25zID0gWwogICAgICAgIG1pZ3JhdGlvbnMuQWx0ZXJGaWVsZCgKICAgICAgICAgICAgbW9kZWxfbmFtZT0nbWVzc2FnZWJhdGNoJywKICAgICAgICAgICAgbmFtZT0nbWVzc2FnZVR5cGUnLAogICAgICAgICAgICBmaWVsZD1tb2RlbHMuQ2hhckZpZWxkKGNob2ljZXM9WygnQ1VTVE9NX0NPTlRFTlRfTUVTU0FHRScsICdDVVNUT01fQ09OVEVOVF9NRVNTQUdFJyksICgnTU9CSUxFX0FQUF9VUERBVEVfQVZBSUxBQkxFX01FU1NBR0VfUFVTSCcsICdNT0JJTEVfQVBQX1VQREFURV9BVkFJTEFCTEVfTUVTU0FHRV9QVVNIJyksICgnQ1VTVE9NX0NPTlRFTlRfTUVTU0FHRV9QVVNIJywgJ0NVU1RPTV9DT05URU5UX01FU1NBR0VfUFVTSCcpLCAoJ0NVU1RPTV9DT05URU5UX01FU1NBR0VfRU1BSUwnLCAnQ1VTVE9NX0NPTlRFTlRfTUVTU0FHRV9FTUFJTCcpLCAoJ0NVU1RPTV9DT05URU5UX01FU1NBR0VfU01TJywgJ0NVU1RPTV9DT05URU5UX01FU1NBR0VfU01TJyldLCBtYXhfbGVuZ3RoPTUwKSwKICAgICAgICApLAogICAgXQo=

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- Alter field messageType on messagebatch
--
-- (no-op)
COMMIT;

    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- Alter field messageType on messagebatch
--
-- (no-op)
COMMIT;

    `)
}
