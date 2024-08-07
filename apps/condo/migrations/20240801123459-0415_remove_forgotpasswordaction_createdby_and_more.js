// auto generated by kmigrator
// KMIGRATOR:0415_remove_forgotpasswordaction_createdby_and_more:IyBHZW5lcmF0ZWQgYnkgRGphbmdvIDQuMC41IG9uIDIwMjQtMDgtMDEgMDc6MzUKCmZyb20gZGphbmdvLmRiIGltcG9ydCBtaWdyYXRpb25zCgoKY2xhc3MgTWlncmF0aW9uKG1pZ3JhdGlvbnMuTWlncmF0aW9uKToKCiAgICBkZXBlbmRlbmNpZXMgPSBbCiAgICAgICAgKCdfZGphbmdvX3NjaGVtYScsICcwNDE0X2IyY2FwcG1lc3NhZ2VzZXR0aW5naGlzdG9yeXJlY29yZF9hbmRfbW9yZScpLAogICAgXQoKICAgIG9wZXJhdGlvbnMgPSBbCiMgICAgICAgIG1pZ3JhdGlvbnMuUmVtb3ZlRmllbGQoCiMgICAgICAgICAgICBtb2RlbF9uYW1lPSdmb3Jnb3RwYXNzd29yZGFjdGlvbicsCiMgICAgICAgICAgICBuYW1lPSdjcmVhdGVkQnknLAojICAgICAgICApLAojICAgICAgICBtaWdyYXRpb25zLlJlbW92ZUZpZWxkKAojICAgICAgICAgICAgbW9kZWxfbmFtZT0nZm9yZ290cGFzc3dvcmRhY3Rpb24nLAojICAgICAgICAgICAgbmFtZT0ndXBkYXRlZEJ5JywKIyAgICAgICAgKSwKIyAgICAgICAgbWlncmF0aW9ucy5SZW1vdmVGaWVsZCgKIyAgICAgICAgICAgIG1vZGVsX25hbWU9J2ZvcmdvdHBhc3N3b3JkYWN0aW9uJywKIyAgICAgICAgICAgIG5hbWU9J3VzZXInLAojICAgICAgICApLAogICAgICAgIG1pZ3JhdGlvbnMuRGVsZXRlTW9kZWwoCiAgICAgICAgICAgIG5hbWU9J2ZvcmdvdHBhc3N3b3JkYWN0aW9uJywKICAgICAgICApLAogICAgICAgIG1pZ3JhdGlvbnMuRGVsZXRlTW9kZWwoCiAgICAgICAgICAgIG5hbWU9J2ZvcmdvdHBhc3N3b3JkYWN0aW9uaGlzdG9yeXJlY29yZCcsCiAgICAgICAgKSwKICAgIF0K

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- Delete model forgotpasswordaction
--
-- DROP TABLE "ForgotPasswordAction" CASCADE;
--
-- Delete model forgotpasswordactionhistoryrecord
--
-- DROP TABLE "ForgotPasswordActionHistoryRecord" CASCADE;
COMMIT;

    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- Delete model forgotpasswordactionhistoryrecord
--
-- CREATE TABLE "ForgotPasswordActionHistoryRecord" ("user" uuid NULL, "token" text NULL, "requestedAt" timestamp with time zone NULL, "expiresAt" timestamp with time zone NULL, "usedAt" timestamp with time zone NULL, "id" uuid NOT NULL PRIMARY KEY, "v" integer NULL, "createdAt" timestamp with time zone NULL, "updatedAt" timestamp with time zone NULL, "createdBy" uuid NULL, "updatedBy" uuid NULL, "deletedAt" timestamp with time zone NULL, "newId" jsonb NULL, "history_date" timestamp with time zone NOT NULL, "history_action" varchar(50) NOT NULL, "history_id" uuid NOT NULL, "dv" integer NULL, "sender" jsonb NULL);
--
-- Delete model forgotpasswordaction
--
-- CREATE TABLE "ForgotPasswordAction" ("token" text NOT NULL UNIQUE, "requestedAt" timestamp with time zone NOT NULL, "expiresAt" timestamp with time zone NOT NULL, "usedAt" timestamp with time zone NULL, "id" uuid NOT NULL PRIMARY KEY, "v" integer NOT NULL, "createdAt" timestamp with time zone NULL, "updatedAt" timestamp with time zone NULL, "deletedAt" timestamp with time zone NULL, "newId" uuid NULL, "createdBy" uuid NULL, "updatedBy" uuid NULL, "user" uuid NOT NULL, "dv" integer NOT NULL, "sender" jsonb NOT NULL);
-- CREATE INDEX "ForgotPasswordActionHistoryRecord_history_id_b518a810" ON "ForgotPasswordActionHistoryRecord" ("history_id");
-- ALTER TABLE "ForgotPasswordAction" ADD CONSTRAINT "ForgotPasswordAction_createdBy_c0278297_fk_User_id" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") DEFERRABLE INITIALLY DEFERRED;
-- ALTER TABLE "ForgotPasswordAction" ADD CONSTRAINT "ForgotPasswordAction_updatedBy_60e6cb54_fk_User_id" FOREIGN KEY ("updatedBy") REFERENCES "User" ("id") DEFERRABLE INITIALLY DEFERRED;
-- ALTER TABLE "ForgotPasswordAction" ADD CONSTRAINT "ForgotPasswordAction_user_3c52ec86_fk_User_id" FOREIGN KEY ("user") REFERENCES "User" ("id") DEFERRABLE INITIALLY DEFERRED;
-- CREATE INDEX "ForgotPasswordAction_token_9a0cc9b4_like" ON "ForgotPasswordAction" ("token" text_pattern_ops);
-- CREATE INDEX "ForgotPasswordAction_createdAt_d39ccb66" ON "ForgotPasswordAction" ("createdAt");
-- CREATE INDEX "ForgotPasswordAction_updatedAt_76d8afe1" ON "ForgotPasswordAction" ("updatedAt");
-- CREATE INDEX "ForgotPasswordAction_deletedAt_ef16c33c" ON "ForgotPasswordAction" ("deletedAt");
-- CREATE INDEX "ForgotPasswordAction_createdBy_c0278297" ON "ForgotPasswordAction" ("createdBy");
-- CREATE INDEX "ForgotPasswordAction_updatedBy_60e6cb54" ON "ForgotPasswordAction" ("updatedBy");
-- CREATE INDEX "ForgotPasswordAction_user_3c52ec86" ON "ForgotPasswordAction" ("user");
COMMIT;

    `)
}
