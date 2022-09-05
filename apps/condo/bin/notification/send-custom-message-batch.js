/**
 * Sends notifications of CUSTOM_CONTENT_MESSAGE_TYPE with custom title/body to arbitrary target list
 * Each target list item can be either userId, phone or email. Script detects target type and handles it correctly.
 * All data should be entered via keyboard. Copy/paste is also supported.
 *
 * Usage:
 *      yarn workspace @app/condo node ./bin/notification/send-receipt-added-notifications
 */
const path = require('path')
const dayjs = require('dayjs')

const { GraphQLApp } = require('@keystonejs/app-graphql')
const { getLogger } = require('@condo/keystone/logging')

const { DATE_FORMAT } = require('@condo/domains/common/utils/date')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { CUSTOM_CONTENT_MESSAGE_TYPE, PUSH_TRANSPORT, SMS_TRANSPORT, EMAIL_TRANSPORT } = require('@condo/domains/notification/constants/constants')

const { prompt } = require('../lib/prompt')

const TODAY = dayjs().format(DATE_FORMAT)
const LINE_ENDINGS_REGEXP = /[\r\n]+/giu
const EXTRA_SPACES_REGEXP = /\s+/giu
const IS_EMAIL_REGEXP = /^.+@.+\..+$/gi
const IS_PHONE_REGEXP = /^\+7\d{10}$/
const IS_UUID_REGEXP = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const REPORT_COUNT = 20
const EMAIL_FROM = 'noreply@doma.ai'

async function connectKeystone () {
    const resolved = path.resolve('./index.js')
    const { distDir, keystone, apps } = require(resolved)
    const graphqlIndex = apps.findIndex(app => app instanceof GraphQLApp)
    // we need only apollo
    await keystone.prepare({ apps: [apps[graphqlIndex]], distDir, dev: true })
    await keystone.connect()

    return keystone
}

const logger = getLogger('sendRemoteClientsUpgradeAppNotifications')
const makeMessageKey = (date, title, entityId) => `${date}:${title}:${entityId}`

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

const detectTransportType = (target) => {
    if (IS_EMAIL_REGEXP.test(target)) return EMAIL_TRANSPORT
    if (IS_PHONE_REGEXP.test(target)) return SMS_TRANSPORT
    if (IS_UUID_REGEXP.test(target)) return PUSH_TRANSPORT

    console.error(`ERROR: [${target}] is neither email, phone or uuid value`)
}

const selectTarget = (target) => {
    const transportType = detectTransportType(target)

    if (transportType === SMS_TRANSPORT) return { to: { phone: target } }
    if (transportType === EMAIL_TRANSPORT) return { to: { email: target }, emailFrom: EMAIL_FROM }
    if (transportType === PUSH_TRANSPORT) return { to: { user: { id: target } } }

    console.error(`ERROR: ${transportType} transport type is not supported`)
}

const prepareAndSendMessage = async (context, target, data) => {
    const notificationKey = makeMessageKey(TODAY, data.title, target)
    const to = selectTarget(target)

    if (!to) return 0

    const messageData = {
        ...to,
        type: CUSTOM_CONTENT_MESSAGE_TYPE,
        meta: {
            dv: 1,
            title: data.title,
            body: data.body,
            data: {
                target: target,
                url: data.deepLink,
            },
        },
        sender: { dv: 1, fingerprint: 'send-custom-message-batch-notification' },
        uniqKey: notificationKey,
    }

    try {
        const result = await sendMessage(context, messageData)

        return 1 - result.isDuplicateMessage
    } catch (error) {
        logger.info({ msg: 'sendMessage error', error, data: messageData })

        return error
    }
}

async function main () {
    const context = await connectKeystone()
    const { title, body, deepLink, targetItems } = await inputData()
    const data = { title, body, deepLink }

    let successCnt = 0, count = 0, failCnt = 0, failedTargets = []

    for (const target of targetItems) {
        count += 1
        const success = await prepareAndSendMessage(context, target, data)

        failCnt += 1 - success
        successCnt += success

        if (count % REPORT_COUNT === 0) logger.info(`Processed ${count}, succeeded ${successCnt}, failed: ${failCnt}, total: ${targetItems.length}`)
        if (!success) failedTargets.push(target)
    }

    logger.info(`Processed ${count}, succeeded ${successCnt}, failed: ${failCnt}, total: ${targetItems.length}`)
    logger.info({ msg: 'Failed targets: ', failedTargets })

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
