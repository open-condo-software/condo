const { AVAILABLE_ENVIRONMENTS } = require('@dev-portal-api/domains/miniapp/constants/publishing')

const { getEnvironmentalFields, getEnvironmentalFieldsSelection } = require('./environmental')

const IGNORED_FIELDS = [
    'id',
    'newId',
    'exportId',

    'v',
    'dv',
    'sender',

    'createdBy',
    'updatedBy',

    'createdAt',
    'updatedAt',
    'deletedAt',
    'publishedAt',
    'modifiedAt',
]

function getModifiedAtFields () {
    const ignoredFields = new Set([
        ...IGNORED_FIELDS,
        ...getEnvironmentalFieldsSelection(IGNORED_FIELDS).split(' '),
    ])

    return getEnvironmentalFields('modifiedAt', (environment) => ({
        schemaDoc:
            'Last time mini-app information relative to {environment} environment was modified. ' +
            'Used to auto-publish need detection',
        type: 'DateTimeUtc',
        kmigratorOptions: { db_index: true },
        access: {
            read: true,
            create: false,
            update: false,
        },
        hooks: {
            resolveInput: ({ resolvedData, fieldPath }) => {
                for (const key of Object.keys(resolvedData)) {
                    if (ignoredFields.has(key)) {
                        continue
                    }
                    const isEnvironmental = AVAILABLE_ENVIRONMENTS.some(e => key.startsWith(e))
                    if (!isEnvironmental || key.startsWith(environment)) {
                        return new Date().toISOString()
                    }
                }

                return undefined
            },
        },
    }))
}

module.exports = {
    getModifiedAtFields,
}