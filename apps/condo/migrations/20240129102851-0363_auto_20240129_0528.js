// auto generated by kmigrator
// KMIGRATOR:0363_auto_20240129_0528:IyBHZW5lcmF0ZWQgYnkgRGphbmdvIDMuMi41IG9uIDIwMjQtMDEtMjkgMDU6MjgKCmZyb20gZGphbmdvLmRiIGltcG9ydCBtaWdyYXRpb25zCgoKY2xhc3MgTWlncmF0aW9uKG1pZ3JhdGlvbnMuTWlncmF0aW9uKToKCiAgICBkZXBlbmRlbmNpZXMgPSBbCiAgICAgICAgKCdfZGphbmdvX3NjaGVtYScsICcwMzYyX25ld3NpdGVtaGlzdG9yeXJlY29yZF9jb21wYWN0c2NvcGVzJyksCiAgICBdCgogICAgb3BlcmF0aW9ucyA9IFsKIyAgICAgICAgbWlncmF0aW9ucy5SZW1vdmVGaWVsZCgKIyAgICAgICAgICAgIG1vZGVsX25hbWU9J2Fzc2lnbmVlc2NvcGUnLAojICAgICAgICAgICAgbmFtZT0nY3JlYXRlZEJ5JywKIyAgICAgICAgKSwKIyAgICAgICAgbWlncmF0aW9ucy5SZW1vdmVGaWVsZCgKIyAgICAgICAgICAgIG1vZGVsX25hbWU9J2Fzc2lnbmVlc2NvcGUnLAojICAgICAgICAgICAgbmFtZT0ndGlja2V0JywKIyAgICAgICAgKSwKIyAgICAgICAgbWlncmF0aW9ucy5SZW1vdmVGaWVsZCgKIyAgICAgICAgICAgIG1vZGVsX25hbWU9J2Fzc2lnbmVlc2NvcGUnLAojICAgICAgICAgICAgbmFtZT0ndXBkYXRlZEJ5JywKIyAgICAgICAgKSwKIyAgICAgICAgbWlncmF0aW9ucy5SZW1vdmVGaWVsZCgKIyAgICAgICAgICAgIG1vZGVsX25hbWU9J2Fzc2lnbmVlc2NvcGUnLAojICAgICAgICAgICAgbmFtZT0ndXNlcicsCiMgICAgICAgICksCiAgICAgICAgbWlncmF0aW9ucy5EZWxldGVNb2RlbCgKICAgICAgICAgICAgbmFtZT0nYXNzaWduZWVzY29wZScsCiAgICAgICAgKSwKICAgICAgICBtaWdyYXRpb25zLkRlbGV0ZU1vZGVsKAogICAgICAgICAgICBuYW1lPSdhc3NpZ25lZXNjb3BlaGlzdG9yeXJlY29yZCcsCiAgICAgICAgKSwKICAgIF0K

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- Delete model assigneescope
--
-- DROP TABLE "AssigneeScope" CASCADE;
--
-- Delete model assigneescopehistoryrecord
--
-- DROP TABLE "AssigneeScopeHistoryRecord" CASCADE;
COMMIT;

    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- Delete model assigneescopehistoryrecord
--
-- CREATE TABLE "AssigneeScopeHistoryRecord" ("user" uuid NULL, "ticket" uuid NULL, "id" uuid NOT NULL PRIMARY KEY, "v" integer NULL, "createdAt" timestamp with time zone NULL, "updatedAt" timestamp with time zone NULL, "createdBy" uuid NULL, "updatedBy" uuid NULL, "deletedAt" timestamp with time zone NULL, "newId" jsonb NULL, "dv" integer NULL, "sender" jsonb NULL, "history_date" timestamp with time zone NOT NULL, "history_action" varchar(50) NOT NULL, "history_id" uuid NOT NULL);
--
-- Delete model assigneescope
--
-- CREATE TABLE "AssigneeScope" ("id" uuid NOT NULL PRIMARY KEY, "v" integer NOT NULL, "createdAt" timestamp with time zone NULL, "updatedAt" timestamp with time zone NULL, "deletedAt" timestamp with time zone NULL, "newId" uuid NULL, "dv" integer NOT NULL, "sender" jsonb NOT NULL, "createdBy" uuid NULL, "ticket" uuid NOT NULL, "updatedBy" uuid NULL, "user" uuid NOT NULL);
-- CREATE INDEX "AssigneeScopeHistoryRecord_history_id_f722994a" ON "AssigneeScopeHistoryRecord" ("history_id");
-- ALTER TABLE "AssigneeScope" ADD CONSTRAINT "AssigneeScope_createdBy_4605faa4_fk_User_id" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") DEFERRABLE INITIALLY DEFERRED;
-- ALTER TABLE "AssigneeScope" ADD CONSTRAINT "AssigneeScope_ticket_e8a38c15_fk_Ticket_id" FOREIGN KEY ("ticket") REFERENCES "Ticket" ("id") DEFERRABLE INITIALLY DEFERRED;
-- ALTER TABLE "AssigneeScope" ADD CONSTRAINT "AssigneeScope_updatedBy_3e164999_fk_User_id" FOREIGN KEY ("updatedBy") REFERENCES "User" ("id") DEFERRABLE INITIALLY DEFERRED;
-- ALTER TABLE "AssigneeScope" ADD CONSTRAINT "AssigneeScope_user_30b38706_fk_User_id" FOREIGN KEY ("user") REFERENCES "User" ("id") DEFERRABLE INITIALLY DEFERRED;
-- CREATE UNIQUE INDEX "assignee_scope_unique_user_and_ticket" ON "AssigneeScope" ("user", "ticket") WHERE "deletedAt" IS NULL;
-- CREATE INDEX "AssigneeScope_createdAt_f0087a85" ON "AssigneeScope" ("createdAt");
-- CREATE INDEX "AssigneeScope_updatedAt_fd0fda5f" ON "AssigneeScope" ("updatedAt");
-- CREATE INDEX "AssigneeScope_deletedAt_521af26a" ON "AssigneeScope" ("deletedAt");
-- CREATE INDEX "AssigneeScope_createdBy_4605faa4" ON "AssigneeScope" ("createdBy");
-- CREATE INDEX "AssigneeScope_ticket_e8a38c15" ON "AssigneeScope" ("ticket");
-- CREATE INDEX "AssigneeScope_updatedBy_3e164999" ON "AssigneeScope" ("updatedBy");
-- CREATE INDEX "AssigneeScope_user_30b38706" ON "AssigneeScope" ("user");
COMMIT;

    `)
}
