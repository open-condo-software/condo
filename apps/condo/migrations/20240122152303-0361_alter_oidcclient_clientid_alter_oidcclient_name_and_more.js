// auto generated by kmigrator
// KMIGRATOR:0361_alter_oidcclient_clientid_alter_oidcclient_name_and_more:IyBHZW5lcmF0ZWQgYnkgRGphbmdvIDQuMS41IG9uIDIwMjQtMDEtMjIgMTA6MjMKCmZyb20gZGphbmdvLmRiIGltcG9ydCBtaWdyYXRpb25zLCBtb2RlbHMKCgpjbGFzcyBNaWdyYXRpb24obWlncmF0aW9ucy5NaWdyYXRpb24pOgoKICAgIGRlcGVuZGVuY2llcyA9IFsKICAgICAgICAoJ19kamFuZ29fc2NoZW1hJywgJzAzNjBfb2lkY2NsaWVudF9pbXBvcnRpZF9vaWRjY2xpZW50X2ltcG9ydHJlbW90ZXN5c3RlbV9hbmRfbW9yZScpLAogICAgXQoKICAgIG9wZXJhdGlvbnMgPSBbCiAgICAgICAgbWlncmF0aW9ucy5BbHRlckZpZWxkKAogICAgICAgICAgICBtb2RlbF9uYW1lPSdvaWRjY2xpZW50JywKICAgICAgICAgICAgbmFtZT0nY2xpZW50SWQnLAogICAgICAgICAgICBmaWVsZD1tb2RlbHMuVGV4dEZpZWxkKCksCiAgICAgICAgKSwKICAgICAgICBtaWdyYXRpb25zLkFsdGVyRmllbGQoCiAgICAgICAgICAgIG1vZGVsX25hbWU9J29pZGNjbGllbnQnLAogICAgICAgICAgICBuYW1lPSduYW1lJywKICAgICAgICAgICAgZmllbGQ9bW9kZWxzLlRleHRGaWVsZChibGFuaz1UcnVlLCBudWxsPVRydWUpLAogICAgICAgICksCiAgICAgICAgbWlncmF0aW9ucy5BZGRDb25zdHJhaW50KAogICAgICAgICAgICBtb2RlbF9uYW1lPSdvaWRjY2xpZW50JywKICAgICAgICAgICAgY29uc3RyYWludD1tb2RlbHMuVW5pcXVlQ29uc3RyYWludChjb25kaXRpb249bW9kZWxzLlEoKCdkZWxldGVkQXRfX2lzbnVsbCcsIFRydWUpKSwgZmllbGRzPSgnY2xpZW50SWQnLCksIG5hbWU9J29pZGNfY2xpZW50X3VuaXF1ZV9jbGllbnRJZCcpLAogICAgICAgICksCiAgICBdCg==

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- Alter field clientId on oidcclient
--
ALTER TABLE "OidcClient" DROP CONSTRAINT "OidcClient_clientId_key";
DROP INDEX IF EXISTS "OidcClient_clientId_2b18253b_like";
--
-- Alter field name on oidcclient
--
ALTER TABLE "OidcClient" DROP CONSTRAINT "OidcClient_name_key";
DROP INDEX IF EXISTS "OidcClient_name_3c4cf643_like";
--
-- Create constraint oidc_client_unique_clientId on model oidcclient
--
CREATE UNIQUE INDEX "oidc_client_unique_clientId" ON "OidcClient" ("clientId") WHERE "deletedAt" IS NULL;
COMMIT;

    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- Create constraint oidc_client_unique_clientId on model oidcclient
--
DROP INDEX IF EXISTS "oidc_client_unique_clientId";
--
-- Alter field name on oidcclient
--
ALTER TABLE "OidcClient" ADD CONSTRAINT "OidcClient_name_3c4cf643_uniq" UNIQUE ("name");
CREATE INDEX "OidcClient_name_3c4cf643_like" ON "OidcClient" ("name" text_pattern_ops);
--
-- Alter field clientId on oidcclient
--
ALTER TABLE "OidcClient" ADD CONSTRAINT "OidcClient_clientId_2b18253b_uniq" UNIQUE ("clientId");
CREATE INDEX "OidcClient_clientId_2b18253b_like" ON "OidcClient" ("clientId" text_pattern_ops);
COMMIT;

    `)
}
