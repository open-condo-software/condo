// auto generated by kmigrator
// KMIGRATOR:0473_message_message_user_type_org:IyBHZW5lcmF0ZWQgYnkgRGphbmdvIDUuMi4yIG9uIDIwMjUtMDctMDIgMTI6MTMKCmltcG9ydCBkamFuZ28uY29udHJpYi5wb3N0Z3Jlcy5pbmRleGVzCmZyb20gZGphbmdvLmRiIGltcG9ydCBtaWdyYXRpb25zCgoKY2xhc3MgTWlncmF0aW9uKG1pZ3JhdGlvbnMuTWlncmF0aW9uKToKCiAgICBkZXBlbmRlbmNpZXMgPSBbCiAgICAgICAgKCdfZGphbmdvX3NjaGVtYScsICcwNDcyX3JlbW92ZV91c2VyZXh0ZXJuYWxpZGVudGl0eV91c2VyZXh0ZXJuYWxpZGVudGl0eV91bmlxdWVfaWRlbnRpdHlpZF9hbmRfaWRlbnRpdHl0eXBlX2FuZF9tb3JlJyksCiAgICBdCgogICAgb3BlcmF0aW9ucyA9IFsKICAgICAgICBtaWdyYXRpb25zLkFkZEluZGV4KAogICAgICAgICAgICBtb2RlbF9uYW1lPSdtZXNzYWdlJywKICAgICAgICAgICAgaW5kZXg9ZGphbmdvLmNvbnRyaWIucG9zdGdyZXMuaW5kZXhlcy5CVHJlZUluZGV4KGZpZWxkcz1bJ3VzZXInLCAndHlwZScsICdvcmdhbml6YXRpb24nXSwgbmFtZT0nbWVzc2FnZV91c2VyX3R5cGVfb3JnJyksCiAgICAgICAgKSwKICAgIF0K

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- [CUSTOM] Set Statement Timeout to some large amount - 25 min (25 * 60 => 1500 sec)
--
SET statement_timeout = '1500s';
--
-- Create index message_user_type_org on field(s) user, type, organization of model message
--
CREATE INDEX IF NOT EXISTS "message_user_type_org" ON "Message" USING btree ("user", "type", "organization");
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
-- [CUSTOM] Set Statement Timeout to some large amount - 25 min (25 * 60 => 1500 sec)
--
SET statement_timeout = '1500s';
--
--
-- Create index message_user_type_org on field(s) user, type, organization of model message
--
DROP INDEX IF EXISTS "message_user_type_org";
--
-- [CUSTOM] Revert Statement Timeout to default amount - 10 secs
--
SET statement_timeout = '10s';
COMMIT;

    `)
}
