// KMIGRATOR:0169_manual_update_contact_phone

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
--
-- [CUSTOM] Set Statement Timeout to some large amount - 25 min (25 * 60 => 1500 sec)
--
SET statement_timeout = '1500s';  
--
-- [CUSTOM] Set phone to null to contacts with specific numbers
--
UPDATE "Contact"
SET "phone" = '+79999999999'
WHERE "phone" IN (
                 '+79000000000',
                 '+79000000001',
                 '+79221234567',
                 '+79139131313',
                 '+79172404036',
                 '+77777777777',
                 '+79130000000'
                 );
--
-- [CUSTOM] Revert Statement Timeout to default amount - 10 secs
--
SET statement_timeout = '10s';
--
COMMIT;
    `)
}

exports.down = async (knex) => {
    await knex.raw(`
    
    `)
}
