/**
 * Sends notifications of CUSTOM_CONTENT_MESSAGE_TYPE with custom title/body to arbitrary target list
 * Each target list item can be either userId, phone or email. Script detects target type and handles it correctly.
 * All data should be entered via keyboard. Copy/paste is also supported.
 *
 * Usage:
 *      yarn workspace @app/condo node ./bin/notification/send-custom-message-batch
 */

const { MessageBatch } = require('@condo/domains/notification/utils/serverSchema')
const { CUSTOM_CONTENT_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')

const { connectKeystone } = require('../lib/keystone.helpers')

const { prompt } = require('../lib/prompt')

const LINE_ENDINGS_REGEXP = /[\r\n]+/giu
const EXTRA_SPACES_REGEXP = /\s+/giu

async function inputData () {
    let title, body, deepLink, targetItems

    while (!title) title = await prompt('Message title: ', false, null)
    while (!body) body = await prompt('Message body: ', true, null)
    deepLink = await prompt('Deep link: ', false, null)
    while (!targetItems) targetItems = await prompt('Target items (userIds, phones, emails): ', true, null)

    body = body.replace(LINE_ENDINGS_REGEXP, ' ').replace(EXTRA_SPACES_REGEXP, ' ').trim()
    targetItems = targetItems.replace(LINE_ENDINGS_REGEXP, ',').split(',').filter(Boolean).map(item => item.trim())

    return {
        title,
        body,
        deepLink,
        targetItems,
    }
}

async function main () {
    const context = await connectKeystone()
    const { title, body, deepLink, targetItems } = await inputData()

    await MessageBatch.create(context, {
        dv: 1,
        sender: { dv: 1, fingerprint: 'send-custom-message-batch' },
        messageType: CUSTOM_CONTENT_MESSAGE_TYPE,
        title,
        message: body,
        deepLink,
        targets: targetItems,
    })

    context.disconnect()
}

main()
    .then(() => {
        process.exit(0)
    })
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
