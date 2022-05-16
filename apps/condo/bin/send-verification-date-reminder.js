/**
 * Load meters with 30/60 days reminders and sending notifications
 *
 * Usage:
 *      yarn workspace @app/condo node bin/send-verification-date-reminder
 */

const dayjs = require('dayjs')

const path = require('path')
const { METER_VERIFICATION_DATE_REMINDER_TYPE } = require('@condo/domains/notification/constants/constants')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { sendVerificationDateReminder } = require('@condo/domains/meter/integrations/sendVerificationDateReminder')


async function main () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    await sendVerificationDateReminder(dayjs(), METER_VERIFICATION_DATE_REMINDER_TYPE, 30, 30)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
