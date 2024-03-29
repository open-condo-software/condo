// auto generated by kmigrator
// KMIGRATOR:0324_auto_20231002_0650:IyBHZW5lcmF0ZWQgYnkgRGphbmdvIDMuMi41IG9uIDIwMjMtMTAtMDIgMDY6NTAKCmZyb20gZGphbmdvLmRiIGltcG9ydCBtaWdyYXRpb25zLCBtb2RlbHMKCgpjbGFzcyBNaWdyYXRpb24obWlncmF0aW9ucy5NaWdyYXRpb24pOgoKICAgIGRlcGVuZGVuY2llcyA9IFsKICAgICAgICAoJ19kamFuZ29fc2NoZW1hJywgJzAzMjNfdGlja2V0X2lzcGF5YWJsZV90aWNrZXRjaGFuZ2VfaXNwYXlhYmxlZnJvbV9hbmRfbW9yZScpLAogICAgXQoKICAgIG9wZXJhdGlvbnMgPSBbCiAgICAgICAgbWlncmF0aW9ucy5BZGRGaWVsZCgKICAgICAgICAgICAgbW9kZWxfbmFtZT0nb3JnYW5pemF0aW9uZW1wbG95ZWVyb2xlJywKICAgICAgICAgICAgbmFtZT0nY2FuSW1wb3J0QmlsbGluZ1JlY2VpcHRzJywKICAgICAgICAgICAgZmllbGQ9bW9kZWxzLkJvb2xlYW5GaWVsZChkZWZhdWx0PUZhbHNlKSwKICAgICAgICAgICAgcHJlc2VydmVfZGVmYXVsdD1GYWxzZSwKICAgICAgICApLAogICAgICAgIG1pZ3JhdGlvbnMuQWRkRmllbGQoCiAgICAgICAgICAgIG1vZGVsX25hbWU9J29yZ2FuaXphdGlvbmVtcGxveWVlcm9sZWhpc3RvcnlyZWNvcmQnLAogICAgICAgICAgICBuYW1lPSdjYW5JbXBvcnRCaWxsaW5nUmVjZWlwdHMnLAogICAgICAgICAgICBmaWVsZD1tb2RlbHMuQm9vbGVhbkZpZWxkKGJsYW5rPVRydWUsIG51bGw9VHJ1ZSksCiAgICAgICAgKSwKICAgIF0K

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
    
--
-- [CUSTOM] Set Statement Timeout to some large amount - 25 min (25 * 60 => 1500 sec)
--
SET statement_timeout = '1500s';

--
-- Add field canImportBillingReceipts to organizationemployeerole
--
ALTER TABLE "OrganizationEmployeeRole" ADD COLUMN "canImportBillingReceipts" boolean DEFAULT false NOT NULL;
ALTER TABLE "OrganizationEmployeeRole" ALTER COLUMN "canImportBillingReceipts" DROP DEFAULT;
--
-- Add field canImportBillingReceipts to organizationemployeerolehistoryrecord
--
ALTER TABLE "OrganizationEmployeeRoleHistoryRecord" ADD COLUMN "canImportBillingReceipts" boolean NULL;

--
-- [CUSTOM] Set canImportBillingReceipts = canManageIntegrations
--
UPDATE "OrganizationEmployeeRole"
SET "canImportBillingReceipts" = "canManageIntegrations";

--
-- [CUSTOM] Revert Statement Timeout to default amount - 10 secs
--
SET statement_timeout = '10s';


COMMIT;

    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- Add field canImportBillingReceipts to organizationemployeerolehistoryrecord
--
ALTER TABLE "OrganizationEmployeeRoleHistoryRecord" DROP COLUMN "canImportBillingReceipts" CASCADE;
--
-- Add field canImportBillingReceipts to organizationemployeerole
--
ALTER TABLE "OrganizationEmployeeRole" DROP COLUMN "canImportBillingReceipts" CASCADE;
COMMIT;

    `)
}
