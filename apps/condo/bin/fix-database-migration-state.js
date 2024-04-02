/**
 * We don't remove any tables/columns from the database for backward compatibility!
 * But we need to save backward-incompatible changes to apply it someday! 
 * Backward compatibility is required but we also need a way to remove legacy compatibility tables and columns.
 * This script solves this problem!
 * This script simply removes legacy backward compatibility tables and columns!
 *
 * Usage:
 *      yarn workspace @app/condo node bin/fix-database-migration-state.js
 */

const index = require('@app/condo')

const { prepareKeystoneExpressApp } = require('@open-condo/keystone/prepareKeystoneApp')


function exit (code, error) {
    console.error(error)
    process.exit(code)
}

function printResult (obj) {
    const data = JSON.stringify(obj, null, 2)
    console.log(`

* RESULT *
----------
${data}
----------

`)
    return data
}

async function init () {
    const { keystone } = await prepareKeystoneExpressApp(index, { excludeApps: ['NextApp'] })
    if (!keystone) exit(3, 'ERROR: Wrong prepare Keystone result')
    const adapter = keystone.adapter
    if (!adapter || !adapter._createTables || !adapter.knex) exit(4, 'ERROR: No KNEX adapter! Check the DATABASE_URL or The Keystone configuration')
    const knex = adapter.knex
    return { keystone, knex }
}

async function main () {
    console.info('[INFO] Init keystone ...')

    console.time('init')
    const { knex } = await init()
    console.timeEnd('init')

    return printResult(await knex.raw(`
BEGIN;
--
-- We don't remove any tables/columns from the database for backward compatibility! But we same such tables/columns here to apply it after some day!
--

--
-- 20210817111732-0043_auto_20210817_1117.js: change id from Number to UUID: remove backward compatibility
--

ALTER TABLE "OrganizationEmployee" DROP COLUMN if exists "old_id";
ALTER TABLE "OrganizationEmployee" DROP COLUMN if exists "old_newId";
ALTER TABLE "OrganizationEmployeeHistoryRecord" DROP COLUMN if exists "old_history_id";
ALTER TABLE "OrganizationEmployee" DROP COLUMN if exists "_old_id";
ALTER TABLE "OrganizationEmployee" DROP COLUMN if exists "_old_newId";
ALTER TABLE "OrganizationEmployeeHistoryRecord" DROP COLUMN if exists "_old_history_id";

--
-- 20221013121613-0177_assigneescope_assigneescopehistoryrecord_and_more.js: Drop Division_properties_many,
-- Division_executors_many, Division, DivisionHistoryRecord, OrganizationEmployee_specializations_many tables
--

DROP TABLE IF EXISTS "Division_properties_many" CASCADE;
DROP TABLE IF EXISTS "Division_executors_many" CASCADE;
DROP TABLE IF EXISTS "Division" CASCADE;
DROP TABLE IF EXISTS "DivisionHistoryRecord" CASCADE;
DROP TABLE IF EXISTS "OrganizationEmployee_specializations_many" CASCADE;


--
-- 20221102170215-0184_auto_20221102_1402.js: remove old TokenSet table: we use redis at the moment
--

DROP TABLE "TokenSet" CASCADE;
DROP TABLE "TokenSetHistoryRecord" CASCADE;

--
-- 20221208114036-0198_remove_ticket_operator_and_more.js: remove unused Ticket.operator column
--

SET CONSTRAINTS "Ticket_operator_22582fe1_fk_User_id" IMMEDIATE; 
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_operator_22582fe1_fk_User_id";
ALTER TABLE "Ticket" DROP COLUMN if exists "operator" CASCADE;
ALTER TABLE "TicketChange" DROP COLUMN if exists "operatorDisplayNameFrom" CASCADE;
ALTER TABLE "TicketChange" DROP COLUMN if exists "operatorDisplayNameTo" CASCADE;
ALTER TABLE "TicketChange" DROP COLUMN if exists "operatorIdFrom" CASCADE;
ALTER TABLE "TicketChange" DROP COLUMN if exists "operatorIdTo" CASCADE;
ALTER TABLE "TicketHistoryRecord" DROP COLUMN if exists "operator" CASCADE;

ALTER TABLE "ServiceSubscription" DROP COLUMN "sbbolOfferAccept" CASCADE;
ALTER TABLE "ServiceSubscriptionHistoryRecord" DROP COLUMN "sbbolOfferAccept" CASCADE;

DROP TABLE IF EXISTS "ServiceSubscriptionPayment";
DROP TABLE IF EXISTS "ServiceSubscriptionPaymentHistoryRecord";

COMMIT;

--
-- 20230111120855-0209_remove_user_importid_remove_user_importremotesystem_and_more.js: remove unused User.importId and importRemoteSystem columns
--

ALTER TABLE "User" DROP CONSTRAINT "unique_user_importid_and_importremotesystem";
ALTER TABLE "User" DROP COLUMN "importId" CASCADE;
ALTER TABLE "User" DROP COLUMN "importRemoteSystem" CASCADE;
ALTER TABLE "UserHistoryRecord" DROP COLUMN "importId" CASCADE;
ALTER TABLE "UserHistoryRecord" DROP COLUMN "importRemoteSystem" CASCADE;

--
-- 20230220213813-0223_remove_ticketchange_numberfrom_and_more.js: Remove fields numberFrom, numberTo, orderFrom, orderTo from TicketChange
--

ALTER TABLE "TicketChange" DROP COLUMN "numberFrom" CASCADE;
ALTER TABLE "TicketChange" DROP COLUMN "numberTo" CASCADE;
ALTER TABLE "TicketChange" DROP COLUMN "orderFrom" CASCADE;
ALTER TABLE "TicketChange" DROP COLUMN "orderTo" CASCADE;

COMMIT;

--
-- 20230518132922-0272_remove_acquiringintegration_appurl_and_more.js Remove old billing and acquiring UI fields
--

ALTER TABLE "AcquiringIntegration" DROP COLUMN "appUrl" CASCADE;
ALTER TABLE "AcquiringIntegration" DROP COLUMN "detailedDescription" CASCADE;
ALTER TABLE "AcquiringIntegration" DROP COLUMN "developer" CASCADE;
ALTER TABLE "AcquiringIntegration" DROP COLUMN "displayPriority" CASCADE;
ALTER TABLE "AcquiringIntegration" DROP COLUMN "gallery" CASCADE;
ALTER TABLE "AcquiringIntegration" DROP COLUMN "label" CASCADE;
ALTER TABLE "AcquiringIntegration" DROP COLUMN "logo" CASCADE;
ALTER TABLE "AcquiringIntegration" DROP COLUMN "partnerUrl" CASCADE;
ALTER TABLE "AcquiringIntegration" DROP COLUMN "price" CASCADE;
ALTER TABLE "AcquiringIntegration" DROP COLUMN "shortDescription" CASCADE;
ALTER TABLE "AcquiringIntegrationHistoryRecord" DROP COLUMN "appUrl" CASCADE;
ALTER TABLE "AcquiringIntegrationHistoryRecord" DROP COLUMN "detailedDescription" CASCADE;
ALTER TABLE "AcquiringIntegrationHistoryRecord" DROP COLUMN "developer" CASCADE;
ALTER TABLE "AcquiringIntegrationHistoryRecord" DROP COLUMN "displayPriority" CASCADE;
ALTER TABLE "AcquiringIntegrationHistoryRecord" DROP COLUMN "gallery" CASCADE;
ALTER TABLE "AcquiringIntegrationHistoryRecord" DROP COLUMN "label" CASCADE;
ALTER TABLE "AcquiringIntegrationHistoryRecord" DROP COLUMN "logo" CASCADE;
ALTER TABLE "AcquiringIntegrationHistoryRecord" DROP COLUMN "partnerUrl" CASCADE;
ALTER TABLE "AcquiringIntegrationHistoryRecord" DROP COLUMN "price" CASCADE;
ALTER TABLE "AcquiringIntegrationHistoryRecord" DROP COLUMN "shortDescription" CASCADE;
ALTER TABLE "BillingIntegration" DROP COLUMN "developer" CASCADE;
ALTER TABLE "BillingIntegration" DROP COLUMN "displayPriority" CASCADE;
ALTER TABLE "BillingIntegration" DROP COLUMN "gallery" CASCADE;
ALTER TABLE "BillingIntegration" DROP COLUMN "label" CASCADE;
ALTER TABLE "BillingIntegration" DROP COLUMN "partnerUrl" CASCADE;
ALTER TABLE "BillingIntegration" DROP COLUMN "price" CASCADE;
ALTER TABLE "BillingIntegrationHistoryRecord" DROP COLUMN "developer" CASCADE;
ALTER TABLE "BillingIntegrationHistoryRecord" DROP COLUMN "displayPriority" CASCADE;
ALTER TABLE "BillingIntegrationHistoryRecord" DROP COLUMN "gallery" CASCADE;
ALTER TABLE "BillingIntegrationHistoryRecord" DROP COLUMN "label" CASCADE;
ALTER TABLE "BillingIntegrationHistoryRecord" DROP COLUMN "partnerUrl" CASCADE;
ALTER TABLE "BillingIntegrationHistoryRecord" DROP COLUMN "price" CASCADE;

COMMIT;

--
-- 20240129102851-0363_auto_20240129_0528.js Remove redundant AssigneeScope schema
--
DROP TABLE IF EXISTS "AssigneeScope" CASCADE;
DROP TABLE IF EXISTS "AssigneeScopeHistoryRecord" CASCADE;

--
-- 20240212204212-0365_remove_serviceconsumer_billingaccount_and_more.js Remove ServiceConsumer.billingAccount field
--
SET CONSTRAINTS "ServiceConsumer_billingAccount_71105b51_fk_BillingAccount_id" IMMEDIATE; ALTER TABLE "ServiceConsumer" DROP CONSTRAINT "ServiceConsumer_billingAccount_71105b51_fk_BillingAccount_id";
ALTER TABLE "ServiceConsumer" DROP COLUMN "billingAccount" CASCADE;
ALTER TABLE "ServiceConsumerHistoryRecord" DROP COLUMN "billingAccount" CASCADE;

COMMIT;

--
-- 20240401134334-0378_remove_billingrecipient_isapproved_and_more Remove field isApproved from billingrecipient
--
ALTER TABLE "BillingRecipient" DROP COLUMN "isApproved" CASCADE;
COMMIT;

    `))
}

main().then(
    () => process.exit(),
    (error) => {
        console.error(error)
        process.exit(1)
    },
)
