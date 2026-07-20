const get = require('lodash/get')

const { getByCondition } = require('@open-condo/keystone/schema')

const { B2B_APP_ACCESS_RIGHT_SET_APPROVED_STATUS } = require('@dev-portal-api/domains/miniapp/constants/b2bAppAccessRightSet')

const PERMISSION_TEST_REGEXP = /^can(?:Read|Manage|Execute)/

function getAppAccessRightSetDiffField (listKey) {
    return {
        schemaDoc: 'Difference between currently accepted request and this item. Used primarily for moderation process',
        type: 'Virtual',
        extendGraphQLTypes: ['type AppAccessRightSetDiff { added: [String!]!, removed: [String!]! }'],
        graphQLReturnType: 'AppAccessRightSetDiff',
        graphQLReturnFragment: '{ added removed }',
        resolver: async (item, _args, _context) => {
            let approvedItem
            if (item.status !== B2B_APP_ACCESS_RIGHT_SET_APPROVED_STATUS) {
                approvedItem = await getByCondition(listKey, {
                    deletedAt: null,
                    status: B2B_APP_ACCESS_RIGHT_SET_APPROVED_STATUS,
                    app: { id: item.app },
                    environment: item.environment,
                })
            } else {
                approvedItem = item
            }
            const added = []
            const removed = []
            const diffFields = Object.keys(item).filter(fieldName => PERMISSION_TEST_REGEXP.test(fieldName))

            for (const fieldName of diffFields) {
                const approvedValue = get(approvedItem, fieldName, false)
                const currentValue = item[fieldName]
                if (approvedValue === currentValue) continue
                if (currentValue) {
                    added.push(fieldName)
                } else {
                    removed.push(fieldName)
                }
            }

            return { added, removed }
        },
    }
}

module.exports = {
    getAppAccessRightSetDiffField,
}