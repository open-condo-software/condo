// auto generated by kmigrator
// KMIGRATOR:0262_banktransaction_bank_transaction_unique_number_date_organization_and_more:IyBHZW5lcmF0ZWQgYnkgRGphbmdvIDQuMS43IG9uIDIwMjMtMDQtMjAgMTU6MzcKCmZyb20gZGphbmdvLmRiIGltcG9ydCBtaWdyYXRpb25zLCBtb2RlbHMKCgpjbGFzcyBNaWdyYXRpb24obWlncmF0aW9ucy5NaWdyYXRpb24pOgoKICAgIGRlcGVuZGVuY2llcyA9IFsKICAgICAgICAoJ19kamFuZ29fc2NoZW1hJywgJzAyNjFfYmFua3N5bmN0YXNrX29wdGlvbnNfYW5kX21vcmUnKSwKICAgIF0KCiAgICBvcGVyYXRpb25zID0gWwogICAgICAgIG1pZ3JhdGlvbnMuQWRkQ29uc3RyYWludCgKICAgICAgICAgICAgbW9kZWxfbmFtZT0nYmFua3RyYW5zYWN0aW9uJywKICAgICAgICAgICAgY29uc3RyYWludD1tb2RlbHMuVW5pcXVlQ29uc3RyYWludChjb25kaXRpb249bW9kZWxzLlEoKCdkZWxldGVkQXRfX2lzbnVsbCcsIFRydWUpKSwgZmllbGRzPSgnbnVtYmVyJywgJ2RhdGUnLCAnb3JnYW5pemF0aW9uJyksIG5hbWU9J0JhbmtfdHJhbnNhY3Rpb25fdW5pcXVlX251bWJlcl9kYXRlX29yZ2FuaXphdGlvbicpLAogICAgICAgICksCiAgICAgICAgbWlncmF0aW9ucy5BZGRDb25zdHJhaW50KAogICAgICAgICAgICBtb2RlbF9uYW1lPSdiYW5rdHJhbnNhY3Rpb24nLAogICAgICAgICAgICBjb25zdHJhaW50PW1vZGVscy5VbmlxdWVDb25zdHJhaW50KGNvbmRpdGlvbj1tb2RlbHMuUSgoJ2RlbGV0ZWRBdF9faXNudWxsJywgVHJ1ZSkpLCBmaWVsZHM9KCdpbXBvcnRJZCcsICdpbXBvcnRSZW1vdGVTeXN0ZW0nLCAnb3JnYW5pemF0aW9uJyksIG5hbWU9J0JhbmtfdHJhbnNhY3Rpb25fdW5pcXVlX2ltcG9ydElkX2ltcG9ydFJlbW90ZVN5c3RlbV9vcmdhbml6YXRpb24nKSwKICAgICAgICApLAogICAgXQo=

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
    
    -- Before applying unique constraint "Bank_transaction_unique_number_date_organization" all duplicated records should be deleted 
    DELETE FROM "BankTransaction" t1
    USING "BankTransaction" t2
    WHERE
        t1.id != t2.id AND
        t1.organization = t2.organization AND
        t1.number = t2.number AND
        t1.date = t2.date;
        
    -- Before applying unique constraint "Bank_transaction_unique_importId_importRemoteSystem_organization" all duplicated records should be deleted 
    DELETE FROM "BankTransaction" t1
    USING "BankTransaction" t2
    WHERE
        t1.id != t2.id AND
        t1.organization = t2.organization AND
        t1."importId" = t2."importId" AND
        t1."importRemoteSystem" = t2."importRemoteSystem";
--
-- Create constraint Bank_transaction_unique_number_date_organization on model banktransaction
--
CREATE UNIQUE INDEX "Bank_transaction_unique_number_date_organization" ON "BankTransaction" ("number", "date", "organization") WHERE "deletedAt" IS NULL;
--
-- Create constraint Bank_transaction_unique_importId_importRemoteSystem_organization on model banktransaction
--
CREATE UNIQUE INDEX "Bank_transaction_unique_importId_importRemoteSystem_organization" ON "BankTransaction" ("importId", "importRemoteSystem", "organization") WHERE "deletedAt" IS NULL;
COMMIT;

    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- Create constraint Bank_transaction_unique_importId_importRemoteSystem_organization on model banktransaction
--
DROP INDEX IF EXISTS "Bank_transaction_unique_importId_importRemoteSystem_organization";
--
-- Create constraint Bank_transaction_unique_number_date_organization on model banktransaction
--
DROP INDEX IF EXISTS "Bank_transaction_unique_number_date_organization";
COMMIT;

    `)
}
