// auto generated by kmigrator
// KMIGRATOR:0375_b2cappaccessright_importid_and_more:IyBHZW5lcmF0ZWQgYnkgRGphbmdvIDQuMS41IG9uIDIwMjQtMDMtMTcgMjE6MDEKCmZyb20gZGphbmdvLmRiIGltcG9ydCBtaWdyYXRpb25zLCBtb2RlbHMKCgpjbGFzcyBNaWdyYXRpb24obWlncmF0aW9ucy5NaWdyYXRpb24pOgoKICAgIGRlcGVuZGVuY2llcyA9IFsKICAgICAgICAoJ19kamFuZ29fc2NoZW1hJywgJzAzNzRfdXNlcnJpZ2h0c3NldF9jYW5yZWFkdXNlcmVtYWlsZmllbGRfYW5kX21vcmUnKSwKICAgIF0KCiAgICBvcGVyYXRpb25zID0gWwogICAgICAgIG1pZ3JhdGlvbnMuQWRkRmllbGQoCiAgICAgICAgICAgIG1vZGVsX25hbWU9J2IyY2FwcGFjY2Vzc3JpZ2h0JywKICAgICAgICAgICAgbmFtZT0naW1wb3J0SWQnLAogICAgICAgICAgICBmaWVsZD1tb2RlbHMuVGV4dEZpZWxkKGJsYW5rPVRydWUsIG51bGw9VHJ1ZSksCiAgICAgICAgKSwKICAgICAgICBtaWdyYXRpb25zLkFkZEZpZWxkKAogICAgICAgICAgICBtb2RlbF9uYW1lPSdiMmNhcHBhY2Nlc3NyaWdodCcsCiAgICAgICAgICAgIG5hbWU9J2ltcG9ydFJlbW90ZVN5c3RlbScsCiAgICAgICAgICAgIGZpZWxkPW1vZGVscy5UZXh0RmllbGQoYmxhbms9VHJ1ZSwgbnVsbD1UcnVlKSwKICAgICAgICApLAogICAgICAgIG1pZ3JhdGlvbnMuQWRkRmllbGQoCiAgICAgICAgICAgIG1vZGVsX25hbWU9J2IyY2FwcGFjY2Vzc3JpZ2h0aGlzdG9yeXJlY29yZCcsCiAgICAgICAgICAgIG5hbWU9J2ltcG9ydElkJywKICAgICAgICAgICAgZmllbGQ9bW9kZWxzLlRleHRGaWVsZChibGFuaz1UcnVlLCBudWxsPVRydWUpLAogICAgICAgICksCiAgICAgICAgbWlncmF0aW9ucy5BZGRGaWVsZCgKICAgICAgICAgICAgbW9kZWxfbmFtZT0nYjJjYXBwYWNjZXNzcmlnaHRoaXN0b3J5cmVjb3JkJywKICAgICAgICAgICAgbmFtZT0naW1wb3J0UmVtb3RlU3lzdGVtJywKICAgICAgICAgICAgZmllbGQ9bW9kZWxzLlRleHRGaWVsZChibGFuaz1UcnVlLCBudWxsPVRydWUpLAogICAgICAgICksCiAgICBdCg==

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- Add field importId to b2cappaccessright
--
ALTER TABLE "B2CAppAccessRight" ADD COLUMN "importId" text NULL;
--
-- Add field importRemoteSystem to b2cappaccessright
--
ALTER TABLE "B2CAppAccessRight" ADD COLUMN "importRemoteSystem" text NULL;
--
-- Add field importId to b2cappaccessrighthistoryrecord
--
ALTER TABLE "B2CAppAccessRightHistoryRecord" ADD COLUMN "importId" text NULL;
--
-- Add field importRemoteSystem to b2cappaccessrighthistoryrecord
--
ALTER TABLE "B2CAppAccessRightHistoryRecord" ADD COLUMN "importRemoteSystem" text NULL;
COMMIT;

    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- Add field importRemoteSystem to b2cappaccessrighthistoryrecord
--
ALTER TABLE "B2CAppAccessRightHistoryRecord" DROP COLUMN "importRemoteSystem" CASCADE;
--
-- Add field importId to b2cappaccessrighthistoryrecord
--
ALTER TABLE "B2CAppAccessRightHistoryRecord" DROP COLUMN "importId" CASCADE;
--
-- Add field importRemoteSystem to b2cappaccessright
--
ALTER TABLE "B2CAppAccessRight" DROP COLUMN "importRemoteSystem" CASCADE;
--
-- Add field importId to b2cappaccessright
--
ALTER TABLE "B2CAppAccessRight" DROP COLUMN "importId" CASCADE;
COMMIT;

    `)
}
