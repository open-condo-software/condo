/**
 * Load meters with 30/60 days reminders and sending notifications
 *
 * Usage:
 *      yarn workspace @app/condo node bin/send-verification-date-reminder
 */

const dayjs = require('dayjs')

const path = require('path')
const { GraphQLApp } = require('@keystonejs/app-graphql')
const { sendVerificationDateReminder } = require('@condo/domains/meter/tasks/sendVerificationDateReminder')


async function main () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    await sendVerificationDateReminder({
        date: dayjs(),
        searchWindowDaysShift: 30,
        daysCount: 30,
    })
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
