const dayjs = require('dayjs')

const { find } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { AVAILABLE_ENVIRONMENTS } = require('@dev-portal-api/domains/miniapp/constants/publishing')
const { getEnvironmentalFieldName } = require('@dev-portal-api/domains/miniapp/schema/fields/environmental')

const { publishB2CApp } = require('./publishB2CApp')

async function recoverB2CPublishingState () {
    const allB2CApps = await find('B2CApp', {
        deletedAt: null,
    })

    for (const environment of AVAILABLE_ENVIRONMENTS) {
        const environmentFieldName = getEnvironmentalFieldName(environment, 'publishedAt')

        for (const b2cApp of allB2CApps) {
            const updatedAt = b2cApp.updatedAt
            const publishedAt = b2cApp[environmentFieldName]

            // If app was not published yet, or was updated after last published version, schedule publishing
            if (!publishedAt || (updatedAt && dayjs(updatedAt).isAfter(publishedAt))) {
                await publishB2CApp.delay(b2cApp.id, environment)
            }
        }
    }
}

module.exports = {
    recoverB2CPublishingState: createCronTask('recoverB2CPublishingState', '*/15 * * * *', recoverB2CPublishingState),
}