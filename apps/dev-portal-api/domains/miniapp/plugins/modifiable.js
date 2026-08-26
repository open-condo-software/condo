const { composeNonResolveInputHook } = require('@open-condo/keystone/plugins/utils')
const { plugin } = require('@open-condo/keystone/plugins/utils/typing')

const { AVAILABLE_ENVIRONMENTS } = require('@dev-portal-api/domains/miniapp/constants/publishing')
const { getEnvironmentalFields, getEnvironmentalFieldsSelection, getEnvironmentalFieldName } = require('@dev-portal-api/domains/miniapp/schema/fields/environmental')

const FIELD_NAME = 'modifiedAt'
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

function _getField (environment, ignoredFields) {
    /**
     * Build a set of ignored field names including their environmental variants.
     */
    const ignoredFieldsSet = new Set([
        ...ignoredFields,
        ...getEnvironmentalFieldsSelection(ignoredFields).split(' '),
    ])

    let baseSchemaDoc =
            'Last time mini-app information relative to {environment} environment was modified. ' +
            'Used to auto-publish need detection'
    if (!environment) {
        baseSchemaDoc = baseSchemaDoc.replace('{environment}', 'specific')
    }

    /**
     * @returns {{ schemaDoc: string, type: string, kmigratorOptions: { db_index: boolean }, access: { read: boolean, create: boolean, update: boolean }, hooks: { resolveInput: Function } }}
     */
    return {
        schemaDoc: baseSchemaDoc,
        type: 'DateTimeUtc',
        kmigratorOptions: { db_index: true },
        access: {
            read: true,
            create: false,
            update: false,
        },
        hooks: {
            /**
             * Sets the modified timestamp when any non-ignored field changes.
             * Skips ignored internal fields and only updates for the target environment.
             * @param {{ resolvedData: Record<string, unknown> }} params
             * @returns {string|undefined} ISO timestamp string, or undefined if no relevant change.
             */
            resolveInput: ({ resolvedData }) => {
                for (const key of Object.keys(resolvedData)) {
                    if (ignoredFieldsSet.has(key)) {
                        continue
                    }
                    const isEnvironmental = AVAILABLE_ENVIRONMENTS.some(e => key.startsWith(e))
                    if (!isEnvironmental || !environment || key.startsWith(environment)) {
                        return new Date().toISOString()
                    }
                }

                return undefined
            },
        },
    }
}

/**
 * Keystone plugin that tracks when a miniapp or its related model was last modified.
 *
 * Adds a `modifiedAt` (or environment-specific) DateTimeUtc field that is
 * automatically updated whenever any tracked field changes. Internal fields
 * such as `createdAt`, `updatedAt`, `sender`, etc. are ignored.
 *
 * When the model uses environmental fields (multiple environments like development/production),
 * a separate `modifiedAt` field is added per environment. The plugin hooks into
 * `afterChange` to call the provided `onModify` callback when a modification is detected,
 * which can be used for auto-publishing or other side effects.
 *
 * @param {{
 *   onModify?: (args: { environment: string, existingItem: Record<string, unknown>, updatedItem: Record<string, unknown> }) => Promise<void>
 *   environmentField?: string
 *   trackDeletion?: boolean
 * }} options
 * @param {Function} [options.onModify] - Callback invoked after a change is detected. Receives `{ environment, existingItem, updatedItem }`.
 * @param {string} [options.environmentField] - Name of the field that stores the current environment.
 *   If provided, a single `modifiedAt` field is used for all environments.
 *   If omitted, separate `modifiedAt` fields are created per environment (e.g., `devModifiedAt`, `prodModifiedAt`).
 * @param {boolean} [options.trackDeletion] - Whether to track deletion events. Defaults to `true`.
 * @returns {{ plugin: Function }} A Keystone plugin builder.
 */
function modifiable ({
    onModify,
    trackDeletion = true,
    environmentField = 'environment',
}) {
    const ignoredFields = new Set(IGNORED_FIELDS)
    if (trackDeletion && ignoredFields.has('deletedAt')) {
        ignoredFields.delete('deletedAt')
    }


    return plugin(({ fields = {}, hooks = {}, ...rest }) => {
        // NOTE: if model has separate environment field, then we add just "modifiedAt" field
        // if model has no separate environment field, then we add "modifiedAt" field for each environment
        const newFields =
            !environmentField
                ? getEnvironmentalFields(FIELD_NAME, (environment) => _getField(environment, [...ignoredFields]))
                : ({
                    [FIELD_NAME]: _getField(null, [...ignoredFields]),
                })

        async function afterChange ({ existingItem, updatedItem }) {
            if (environmentField) {
                const environment = updatedItem[environmentField]
                const previousModifiedAt = existingItem?.[FIELD_NAME]?.getTime()
                const currentModifiedAt = updatedItem[FIELD_NAME].getTime()
                if (previousModifiedAt !== currentModifiedAt) {
                    await onModify?.({ environment, existingItem, updatedItem })
                }
            } else {
                for (const environment of AVAILABLE_ENVIRONMENTS) {
                    const fieldName = getEnvironmentalFieldName(environment, FIELD_NAME)
                    const previousModifiedAt = existingItem?.[fieldName]?.getTime()
                    const currentModifiedAt = updatedItem[fieldName].getTime()
                    if (previousModifiedAt !== currentModifiedAt) {
                        await onModify?.({ environment, existingItem, updatedItem })
                    }
                }
            }
        }

        return {
            fields: { ...fields, ...newFields },
            hooks: { ...hooks, afterChange: composeNonResolveInputHook(hooks?.afterChange, afterChange) },
            ...rest,
        }
    })
}

module.exports = {
    modifiable,
}