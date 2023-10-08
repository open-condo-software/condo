// KMIGRATOR:0197_manual_fix_duplicate_contacts_without_unit

exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
    
    --
    -- [CUSTOM] Set Statement Timeout to some large amount - 25 min (25 * 60 => 1500 sec)
    --
    SET statement_timeout = '1500s';  
    
CREATE OR REPLACE FUNCTION getContactsWithTickets(contactIds uuid[])
    RETURNS uuid[]
AS
$getContactsWithTickets$
DECLARE
    contactId           uuid;
    contactsWithTickets uuid[];
BEGIN
    FOREACH contactId IN ARRAY contactIds
        LOOP
            IF EXISTS(
                    SELECT count(id)
                    FROM "Ticket"
                    WHERE contact = contactId
                      AND "deletedAt" IS NULL
                    LIMIT 1
                )
            THEN
                contactsWithTickets := array_append(contactsWithTickets, contactId);
            END IF;
        END LOOP;

    RETURN contactsWithTickets;
END;
$getContactsWithTickets$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION getLastCreatedContactId(contactIds uuid[])
    RETURNS uuid
AS
$getLastCreatedContact$
BEGIN
    RETURN (
        SELECT id
        FROM "Contact"
        WHERE id = ANY (contactIds)
          AND "deletedAt" IS NULL
        ORDER BY "createdAt" DESC
        LIMIT 1
    );
END
$getLastCreatedContact$ LANGUAGE plpgsql;


--
-- [CUSTOM] Deletes contacts duplicates and updates contact from tickets and meter readings with the remain contact
--
CREATE OR REPLACE FUNCTION deleteContactDuplicates()
    RETURNS void
AS
$deleteContactDuplicates$
DECLARE
    duplicateData        RECORD;
    contactIds           uuid[];
    contactsWithTickets  uuid[];
    lastCreatedContactId uuid;
    contactIdsToDelete   uuid[];
BEGIN
    FOR duplicateData IN
        SELECT "phone", "property"
        FROM "Contact"
        WHERE "deletedAt" IS NULL
          AND "unitName" IS NULL
          AND "unitType" IS NULL
        GROUP BY "property", "phone"
        HAVING count(*) > 1
        LOOP
            contactIds := array(
                    SELECT id
                    FROM "Contact"
                    WHERE "phone" = duplicateData.phone
                      AND "property" = duplicateData.property
                      AND "unitName" IS NULL
                      AND "unitType" IS NULL
                      AND "deletedAt" IS NULL
                );

            contactsWithTickets := getContactsWithTickets(contactIds);

            -- Find the last created contact among those that have tickets,
            -- If there are no tickets, then just the last created contact.
            -- The remaining contacts are deleted.
            IF contactsWithTickets IS NULL
            THEN
                lastCreatedContactId := getLastCreatedContactId(contactIds);
                contactIdsToDelete := array_remove(contactIds, lastCreatedContactId);
            ELSE
                BEGIN
                    lastCreatedContactId := getLastCreatedContactId(contactsWithTickets);
                    contactIdsToDelete := array_remove(contactIds, lastCreatedContactId);
                END;
            END IF;

            UPDATE "Ticket"
            SET "contact" = lastCreatedContactId
            WHERE "contact" = ANY (contactIdsToDelete);

            UPDATE "MeterReading"
            SET "contact" = lastCreatedContactId
            WHERE "contact" = ANY (contactIdsToDelete);

            UPDATE "Contact"
            SET "deletedAt" = now()
            WHERE id = ANY (contactIdsToDelete);
        END LOOP;
END
$deleteContactDuplicates$ LANGUAGE plpgsql;

DO
$$
    BEGIN
        PERFORM deleteContactDuplicates();
    END
$$;

DROP FUNCTION deleteContactDuplicates;
DROP FUNCTION getLastCreatedContactId;
DROP FUNCTION getContactsWithTickets;

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
    COMMIT;
    `)
}