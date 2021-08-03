exports.up = async (knex) => {
    await knex.raw(`
    BEGIN;
        -- Открыта
        UPDATE "TicketStatus"
        SET name = 'ticket.status.NEW_OR_REOPENED.name'
        WHERE id = '6ef3abc4-022f-481b-90fb-8430345ebfc2';
        COMMIT;

        -- В работе
        UPDATE "TicketStatus"
        SET name = 'ticket.status.PROCESSING.name'
        WHERE id = 'aa5ed9c2-90ca-4042-8194-d3ed23cb7919';
        COMMIT;

        -- Выполнена
        UPDATE "TicketStatus"
        SET name = 'ticket.status.COMPLETED.name'
        WHERE id = '5b9decd7-792c-42bb-b16d-822142fd2d69';

        -- Закрыта
        UPDATE "TicketStatus"
        SET name = 'ticket.status.CLOSED.name'
        WHERE id = 'c14a58e0-6b5d-4ec2-b91c-980a90111c7d';
        COMMIT;

        -- Отложена
        UPDATE "TicketStatus"
        SET name = 'ticket.status.DEFERRED.name'
        WHERE id = 'c14a58e0-6b5d-4ec2-b91c-980a90509c7f';
        COMMIT;

        -- Отменена
        UPDATE "TicketStatus"
        SET name = 'ticket.status.CANCELED.name'
        WHERE id = 'f0fa0093-8d86-4e69-ae1a-70a2914da82f';
        COMMIT;
    END;
    `)
}

exports.down = async (knex) => {
    return
}
