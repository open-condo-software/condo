// manual by @toplenboren
// KMIGRATOR:0080_auto_20211111_1440:IyBHZW5lcmF0ZWQgYnkgRGphbmdvIDMuMi40IG9uIDIwMjEtMTEtMTEgMTQ6NDAKCmZyb20gZGphbmdvLmRiIGltcG9ydCBtaWdyYXRpb25zLCBtb2RlbHMKaW1wb3J0IGRqYW5nby5kYi5tb2RlbHMuZGVsZXRpb24KCgpjbGFzcyBNaWdyYXRpb24obWlncmF0aW9ucy5NaWdyYXRpb24pOgoKICAgIGRlcGVuZGVuY2llcyA9IFsKICAgICAgICAoJ19kamFuZ29fc2NoZW1hJywgJzAwNzlfYXV0b18yMDIxMTExMV8wNTU4JyksCiAgICBdCgogICAgb3BlcmF0aW9ucyA9IFsKICAgICAgICBtaWdyYXRpb25zLkFkZEZpZWxkKAogICAgICAgICAgICBtb2RlbF9uYW1lPSdzZXJ2aWNlY29uc3VtZXInLAogICAgICAgICAgICBuYW1lPSdvcmdhbml6YXRpb24nLAogICAgICAgICAgICBmaWVsZD1tb2RlbHMuRm9yZWlnbktleShkYl9jb2x1bW49J29yZ2FuaXphdGlvbicsIGRlZmF1bHQ9JzEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCcsIG9uX2RlbGV0ZT1kamFuZ28uZGIubW9kZWxzLmRlbGV0aW9uLkNBU0NBREUsIHJlbGF0ZWRfbmFtZT0nKycsIHRvPSdfZGphbmdvX3NjaGVtYS5vcmdhbml6YXRpb24nKSwKICAgICAgICAgICAgcHJlc2VydmVfZGVmYXVsdD1GYWxzZSwKICAgICAgICApLAogICAgICAgIG1pZ3JhdGlvbnMuQWRkRmllbGQoCiAgICAgICAgICAgIG1vZGVsX25hbWU9J3NlcnZpY2Vjb25zdW1lcmhpc3RvcnlyZWNvcmQnLAogICAgICAgICAgICBuYW1lPSdvcmdhbml6YXRpb24nLAogICAgICAgICAgICBmaWVsZD1tb2RlbHMuVVVJREZpZWxkKGJsYW5rPVRydWUsIG51bGw9VHJ1ZSksCiAgICAgICAgKSwKICAgIF0K

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- Truncate ServiceConsumer table and add field organization to serviceconsumer @toplenboren
--
TRUNCATE TABLE "ServiceConsumer";
ALTER TABLE "ServiceConsumer" ADD COLUMN "organization" uuid NOT NULL CONSTRAINT "ServiceConsumer_organization_8e460340_fk_Organization_id" REFERENCES "Organization"("id") DEFERRABLE INITIALLY DEFERRED; SET CONSTRAINTS "ServiceConsumer_organization_8e460340_fk_Organization_id" IMMEDIATE;
ALTER TABLE "ServiceConsumer" ALTER COLUMN "organization" DROP DEFAULT;
--
-- Add field organization to serviceconsumerhistoryrecord
--
ALTER TABLE "ServiceConsumerHistoryRecord" ADD COLUMN "organization" uuid NULL;
CREATE INDEX "ServiceConsumer_organization_8e460340" ON "ServiceConsumer" ("organization");
COMMIT;

    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- Add field organization to serviceconsumerhistoryrecord
--
ALTER TABLE "ServiceConsumerHistoryRecord" DROP COLUMN "organization" CASCADE;
--
-- Add field organization to serviceconsumer
--
ALTER TABLE "ServiceConsumer" DROP COLUMN "organization" CASCADE;
COMMIT;

    `)
}
