// auto generated by kmigrator
// KMIGRATOR:0012_auto_20210504_0702:IyBHZW5lcmF0ZWQgYnkgRGphbmdvIDMuMiBvbiAyMDIxLTA1LTA0IDA3OjAyCgppbXBvcnQgZGphbmdvLmNvbnRyaWIucG9zdGdyZXMuZmllbGRzLmpzb25iCmZyb20gZGphbmdvLmRiIGltcG9ydCBtaWdyYXRpb25zLCBtb2RlbHMKCgpjbGFzcyBNaWdyYXRpb24obWlncmF0aW9ucy5NaWdyYXRpb24pOgoKICAgIGRlcGVuZGVuY2llcyA9IFsKICAgICAgICAoJ19kamFuZ29fc2NoZW1hJywgJzAwMTFfbWVzc2FnZV9tZXNzYWdlaGlzdG9yeXJlY29yZCcpLAogICAgXQoKICAgIG9wZXJhdGlvbnMgPSBbCiAgICAgICAgbWlncmF0aW9ucy5SZW5hbWVGaWVsZCgKICAgICAgICAgICAgbW9kZWxfbmFtZT0nbWVzc2FnZScsCiAgICAgICAgICAgIG9sZF9uYW1lPSdzZW50QXQnLAogICAgICAgICAgICBuZXdfbmFtZT0nZGVsaXZlcmVkQXQnLAogICAgICAgICksCiAgICAgICAgbWlncmF0aW9ucy5SZW5hbWVGaWVsZCgKICAgICAgICAgICAgbW9kZWxfbmFtZT0nbWVzc2FnZWhpc3RvcnlyZWNvcmQnLAogICAgICAgICAgICBvbGRfbmFtZT0nc2VudEF0JywKICAgICAgICAgICAgbmV3X25hbWU9J2RlbGl2ZXJlZEF0JywKICAgICAgICApLAogICAgICAgIG1pZ3JhdGlvbnMuQWRkRmllbGQoCiAgICAgICAgICAgIG1vZGVsX25hbWU9J21lc3NhZ2UnLAogICAgICAgICAgICBuYW1lPSdwcm9jZXNzaW5nTWV0YScsCiAgICAgICAgICAgIGZpZWxkPWRqYW5nby5jb250cmliLnBvc3RncmVzLmZpZWxkcy5qc29uYi5KU09ORmllbGQoYmxhbms9VHJ1ZSwgbnVsbD1UcnVlKSwKICAgICAgICApLAogICAgICAgIG1pZ3JhdGlvbnMuQWRkRmllbGQoCiAgICAgICAgICAgIG1vZGVsX25hbWU9J21lc3NhZ2VoaXN0b3J5cmVjb3JkJywKICAgICAgICAgICAgbmFtZT0ncHJvY2Vzc2luZ01ldGEnLAogICAgICAgICAgICBmaWVsZD1kamFuZ28uY29udHJpYi5wb3N0Z3Jlcy5maWVsZHMuanNvbmIuSlNPTkZpZWxkKGJsYW5rPVRydWUsIG51bGw9VHJ1ZSksCiAgICAgICAgKSwKICAgICAgICBtaWdyYXRpb25zLkFkZEZpZWxkKAogICAgICAgICAgICBtb2RlbF9uYW1lPSdwcm9wZXJ0eWhpc3RvcnlyZWNvcmQnLAogICAgICAgICAgICBuYW1lPSd0aWNrZXRzQ2xvc2VkJywKICAgICAgICAgICAgZmllbGQ9ZGphbmdvLmNvbnRyaWIucG9zdGdyZXMuZmllbGRzLmpzb25iLkpTT05GaWVsZChibGFuaz1UcnVlLCBudWxsPVRydWUpLAogICAgICAgICksCiAgICAgICAgbWlncmF0aW9ucy5BbHRlckZpZWxkKAogICAgICAgICAgICBtb2RlbF9uYW1lPSdtZXNzYWdlJywKICAgICAgICAgICAgbmFtZT0nc3RhdHVzJywKICAgICAgICAgICAgZmllbGQ9bW9kZWxzLkNoYXJGaWVsZChjaG9pY2VzPVsoJ3NlbmRpbmcnLCAnc2VuZGluZycpLCAoJ3Jlc2VuZGluZycsICdyZXNlbmRpbmcnKSwgKCdwcm9jZXNzaW5nJywgJ3Byb2Nlc3NpbmcnKSwgKCdlcnJvcicsICdlcnJvcicpLCAoJ3NlbnQnLCAnc2VudCcpLCAoJ2NhbmNlbGVkJywgJ2NhbmNlbGVkJyldLCBtYXhfbGVuZ3RoPTUwKSwKICAgICAgICApLAogICAgICAgIG1pZ3JhdGlvbnMuQWx0ZXJGaWVsZCgKICAgICAgICAgICAgbW9kZWxfbmFtZT0nb3JnYW5pemF0aW9uJywKICAgICAgICAgICAgbmFtZT0nY291bnRyeScsCiAgICAgICAgICAgIGZpZWxkPW1vZGVscy5DaGFyRmllbGQoY2hvaWNlcz1bKCdlbicsICdlbicpLCAoJ3J1JywgJ3J1JyldLCBtYXhfbGVuZ3RoPTUwKSwKICAgICAgICApLAogICAgICAgIG1pZ3JhdGlvbnMuQWx0ZXJGaWVsZCgKICAgICAgICAgICAgbW9kZWxfbmFtZT0ncHJvcGVydHknLAogICAgICAgICAgICBuYW1lPSduYW1lJywKICAgICAgICAgICAgZmllbGQ9bW9kZWxzLlRleHRGaWVsZChibGFuaz1UcnVlLCBudWxsPVRydWUpLAogICAgICAgICksCiAgICBdCg==

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- Rename field sentAt on message to deliveredAt
--
ALTER TABLE "Message" RENAME COLUMN "sentAt" TO "deliveredAt";
--
-- Rename field sentAt on messagehistoryrecord to deliveredAt
--
ALTER TABLE "MessageHistoryRecord" RENAME COLUMN "sentAt" TO "deliveredAt";
--
-- Add field processingMeta to message
--
ALTER TABLE "Message" ADD COLUMN "processingMeta" jsonb NULL;
--
-- Add field processingMeta to messagehistoryrecord
--
ALTER TABLE "MessageHistoryRecord" ADD COLUMN "processingMeta" jsonb NULL;

-- MISSED MIGRATIONS!!

--
-- Add field ticketsClosed to propertyhistoryrecord
--
ALTER TABLE "PropertyHistoryRecord" ADD COLUMN "ticketsClosed" jsonb NULL;
--
-- Alter field status on message
--
--
-- Alter field country on organization
--
--
-- Alter field name on property
--
ALTER TABLE "Property" ALTER COLUMN "name" DROP NOT NULL;
COMMIT;

    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- Alter field name on property
--
ALTER TABLE "Property" ALTER COLUMN "name" SET NOT NULL;
--
-- Alter field country on organization
--
--
-- Alter field status on message
--
--
-- Add field ticketsClosed to propertyhistoryrecord
--
ALTER TABLE "PropertyHistoryRecord" DROP COLUMN "ticketsClosed" CASCADE;
--
-- Add field processingMeta to messagehistoryrecord
--
ALTER TABLE "MessageHistoryRecord" DROP COLUMN "processingMeta" CASCADE;
--
-- Add field processingMeta to message
--
ALTER TABLE "Message" DROP COLUMN "processingMeta" CASCADE;
--
-- Rename field sentAt on messagehistoryrecord to deliveredAt
--
ALTER TABLE "MessageHistoryRecord" RENAME COLUMN "deliveredAt" TO "sentAt";
--
-- Rename field sentAt on message to deliveredAt
--
ALTER TABLE "Message" RENAME COLUMN "deliveredAt" TO "sentAt";
COMMIT;

    `)
}
