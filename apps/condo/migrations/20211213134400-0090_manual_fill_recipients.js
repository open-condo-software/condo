exports.up = async (knex) => {
    await knex.raw(`
        BEGIN;
            UPDATE "Payment" AS p
            SET "recipientBic" = b."recipient"->>'bic',
                "recipientBankAccount" = b."recipient"->>'bankAccount'
            FROM "BillingReceipt" as b
            WHERE p."receipt" = b."id";
            COMMIT;
        END;
    `)
}

exports.down = async (knew) => {
    return
}