// auto generated by kmigrator
// KMIGRATOR:0420_acquiringintegration_minimumpaymentamount_and_more:IyBHZW5lcmF0ZWQgYnkgRGphbmdvIDQuMi4xNSBvbiAyMDI0LTA5LTA0IDEyOjIwCgpmcm9tIGRqYW5nby5kYiBpbXBvcnQgbWlncmF0aW9ucywgbW9kZWxzCgoKY2xhc3MgTWlncmF0aW9uKG1pZ3JhdGlvbnMuTWlncmF0aW9uKToKCiAgICBkZXBlbmRlbmNpZXMgPSBbCiAgICAgICAgKCdfZGphbmdvX3NjaGVtYScsICcwNDE5X29yZ2FuaXphdGlvbmVtcGxveWVlcm9sZV9jYW5tYW5hZ2V0aWNrZXRhdXRvYXNzaWdubWVudHNfYW5kX21vcmUnKSwKICAgIF0KCiAgICBvcGVyYXRpb25zID0gWwogICAgICAgIG1pZ3JhdGlvbnMuQWRkRmllbGQoCiAgICAgICAgICAgIG1vZGVsX25hbWU9J2FjcXVpcmluZ2ludGVncmF0aW9uJywKICAgICAgICAgICAgbmFtZT0nbWluaW11bVBheW1lbnRBbW91bnQnLAogICAgICAgICAgICBmaWVsZD1tb2RlbHMuRGVjaW1hbEZpZWxkKGJsYW5rPVRydWUsIGRlY2ltYWxfcGxhY2VzPTgsIG1heF9kaWdpdHM9MTgsIG51bGw9VHJ1ZSksCiAgICAgICAgKSwKICAgICAgICBtaWdyYXRpb25zLkFkZEZpZWxkKAogICAgICAgICAgICBtb2RlbF9uYW1lPSdhY3F1aXJpbmdpbnRlZ3JhdGlvbmhpc3RvcnlyZWNvcmQnLAogICAgICAgICAgICBuYW1lPSdtaW5pbXVtUGF5bWVudEFtb3VudCcsCiAgICAgICAgICAgIGZpZWxkPW1vZGVscy5EZWNpbWFsRmllbGQoYmxhbms9VHJ1ZSwgZGVjaW1hbF9wbGFjZXM9NCwgbWF4X2RpZ2l0cz0xOCwgbnVsbD1UcnVlKSwKICAgICAgICApLAogICAgXQo=

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
    
--
-- [CUSTOM] Set Statement Timeout to some large amount - 25 min (25 * 60 => 1500 sec)
--
SET statement_timeout = '1500s';
--
-- Add field minimumPaymentAmount to acquiringintegration
--
ALTER TABLE "AcquiringIntegration" ADD COLUMN "minimumPaymentAmount" numeric(18, 8) NULL;
--
-- Add field minimumPaymentAmount to acquiringintegrationhistoryrecord
--
ALTER TABLE "AcquiringIntegrationHistoryRecord" ADD COLUMN "minimumPaymentAmount" numeric(18, 4) NULL;
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
-- Add field minimumPaymentAmount to acquiringintegrationhistoryrecord
--
ALTER TABLE "AcquiringIntegrationHistoryRecord" DROP COLUMN "minimumPaymentAmount" CASCADE;
--
-- Add field minimumPaymentAmount to acquiringintegration
--
ALTER TABLE "AcquiringIntegration" DROP COLUMN "minimumPaymentAmount" CASCADE;
COMMIT;

    `)
}