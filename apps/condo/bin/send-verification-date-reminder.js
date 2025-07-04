/**
 * Load meters with 30/60 days reminders and sending notifications
 *
 * Usage:
 *      yarn workspace @app/condo node bin/send-verification-date-reminder
 */


const path = require('path')

const { GraphQLApp } = require('@open-keystone/app-graphql')
const dayjs = require('dayjs')

const { sendVerificationDateReminder } = require('@condo/domains/meter/tasks/sendVerificationDateReminder')


async function main () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    const now = dayjs()
    await sendVerificationDateReminder({
        date: now,
        searchWindowDaysShift: 0,
        daysCount: 30,
    })

    await sendVerificationDateReminder({
        date: now,
        searchWindowDaysShift: 30,
        daysCount: 30,
    })

    process.exit(0)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})