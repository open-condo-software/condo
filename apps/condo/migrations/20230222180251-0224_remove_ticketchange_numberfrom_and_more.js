// auto generated by kmigrator
// KMIGRATOR:0224_remove_ticketchange_numberfrom_and_more:IyBHZW5lcmF0ZWQgYnkgRGphbmdvIDQuMC41IG9uIDIwMjMtMDItMjIgMTM6MDIKCmZyb20gZGphbmdvLmRiIGltcG9ydCBtaWdyYXRpb25zCgoKY2xhc3MgTWlncmF0aW9uKG1pZ3JhdGlvbnMuTWlncmF0aW9uKToKCiAgICBkZXBlbmRlbmNpZXMgPSBbCiAgICAgICAgKCdfZGphbmdvX3NjaGVtYScsICcwMjIzX2JpbGxpbmdyZWNlaXB0aGlzdG9yeXJlY29yZF9pbnZhbGlkc2VydmljZXNlcnJvcicpLAogICAgXQoKICAgIG9wZXJhdGlvbnMgPSBbCiAgICAgICAgbWlncmF0aW9ucy5SZW1vdmVGaWVsZCgKICAgICAgICAgICAgbW9kZWxfbmFtZT0ndGlja2V0Y2hhbmdlJywKICAgICAgICAgICAgbmFtZT0nbnVtYmVyRnJvbScsCiAgICAgICAgKSwKICAgICAgICBtaWdyYXRpb25zLlJlbW92ZUZpZWxkKAogICAgICAgICAgICBtb2RlbF9uYW1lPSd0aWNrZXRjaGFuZ2UnLAogICAgICAgICAgICBuYW1lPSdudW1iZXJUbycsCiAgICAgICAgKSwKICAgICAgICBtaWdyYXRpb25zLlJlbW92ZUZpZWxkKAogICAgICAgICAgICBtb2RlbF9uYW1lPSd0aWNrZXRjaGFuZ2UnLAogICAgICAgICAgICBuYW1lPSdvcmRlckZyb20nLAogICAgICAgICksCiAgICAgICAgbWlncmF0aW9ucy5SZW1vdmVGaWVsZCgKICAgICAgICAgICAgbW9kZWxfbmFtZT0ndGlja2V0Y2hhbmdlJywKICAgICAgICAgICAgbmFtZT0nb3JkZXJUbycsCiAgICAgICAgKSwKICAgIF0K

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- [CUSTOM] Removing columns has been commented out
--
-- Remove field numberFrom from ticketchange
--
-- ALTER TABLE "TicketChange" DROP COLUMN "numberFrom" CASCADE;
--
-- Remove field numberTo from ticketchange
--
-- ALTER TABLE "TicketChange" DROP COLUMN "numberTo" CASCADE;
--
-- Remove field orderFrom from ticketchange
--
-- ALTER TABLE "TicketChange" DROP COLUMN "orderFrom" CASCADE;
--
-- Remove field orderTo from ticketchange
--
-- ALTER TABLE "TicketChange" DROP COLUMN "orderTo" CASCADE;

COMMIT;

    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- [CUSTOM] Adding columns back has been commented out
--
-- Remove field orderTo from ticketchange
--
-- ALTER TABLE "TicketChange" ADD COLUMN "orderTo" integer NULL;
--
-- Remove field orderFrom from ticketchange
--
-- ALTER TABLE "TicketChange" ADD COLUMN "orderFrom" integer NULL;
--
-- Remove field numberTo from ticketchange
--
-- ALTER TABLE "TicketChange" ADD COLUMN "numberTo" integer NULL;
--
-- Remove field numberFrom from ticketchange
--
-- ALTER TABLE "TicketChange" ADD COLUMN "numberFrom" integer NULL;

COMMIT;

    `)
}
