// auto generated by kmigrator
// KMIGRATOR:0167_ticket_lastresidentcommentat_and_more:IyBHZW5lcmF0ZWQgYnkgRGphbmdvIDQuMSBvbiAyMDIyLTA4LTI5IDExOjEyCgpmcm9tIGRqYW5nby5kYiBpbXBvcnQgbWlncmF0aW9ucywgbW9kZWxzCgoKY2xhc3MgTWlncmF0aW9uKG1pZ3JhdGlvbnMuTWlncmF0aW9uKToKCiAgICBkZXBlbmRlbmNpZXMgPSBbCiAgICAgICAgKCdfZGphbmdvX3NjaGVtYScsICcwMTY2X2V4dGVybmFscmVwb3J0aGlzdG9yeXJlY29yZF9leHRlcm5hbHJlcG9ydCcpLAogICAgXQoKICAgIG9wZXJhdGlvbnMgPSBbCiAgICAgICAgbWlncmF0aW9ucy5BZGRGaWVsZCgKICAgICAgICAgICAgbW9kZWxfbmFtZT0ndGlja2V0JywKICAgICAgICAgICAgbmFtZT0nbGFzdFJlc2lkZW50Q29tbWVudEF0JywKICAgICAgICAgICAgZmllbGQ9bW9kZWxzLkRhdGVUaW1lRmllbGQoYmxhbms9VHJ1ZSwgbnVsbD1UcnVlKSwKICAgICAgICApLAogICAgICAgIG1pZ3JhdGlvbnMuQWRkRmllbGQoCiAgICAgICAgICAgIG1vZGVsX25hbWU9J3RpY2tldGhpc3RvcnlyZWNvcmQnLAogICAgICAgICAgICBuYW1lPSdsYXN0UmVzaWRlbnRDb21tZW50QXQnLAogICAgICAgICAgICBmaWVsZD1tb2RlbHMuRGF0ZVRpbWVGaWVsZChibGFuaz1UcnVlLCBudWxsPVRydWUpLAogICAgICAgICksCiAgICBdCg==

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- [CUSTOM] Set Statement Timeout to some large amount - 25 min (25 * 60 => 1500 sec)
--
SET statement_timeout = '1500s';  
--
-- Add field lastResidentCommentAt to ticket
--
ALTER TABLE "Ticket" ADD COLUMN "lastResidentCommentAt" timestamp with time zone NULL;
--
-- Add field lastResidentCommentAt to tickethistoryrecord
--
ALTER TABLE "TicketHistoryRecord" ADD COLUMN "lastResidentCommentAt" timestamp with time zone NULL;
-- 
-- [CUSTOM] Update lastResidentCommentAt field of existed tickets
--
UPDATE "Ticket"
SET "lastResidentCommentAt" = (
    SELECT "TicketComment"."createdAt" FROM "TicketComment"
    JOIN "User" ON "TicketComment"."user" = "User"."id"
    WHERE "TicketComment"."ticket" = "Ticket".id AND "User"."type" = 'resident'
    ORDER BY "TicketComment"."createdAt" DESC LIMIT 1
    );
    
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
-- Add field lastResidentCommentAt to tickethistoryrecord
--
ALTER TABLE "TicketHistoryRecord" DROP COLUMN "lastResidentCommentAt" CASCADE;
--
-- Add field lastResidentCommentAt to ticket
--
ALTER TABLE "Ticket" DROP COLUMN "lastResidentCommentAt" CASCADE;
COMMIT;

    `)
}
