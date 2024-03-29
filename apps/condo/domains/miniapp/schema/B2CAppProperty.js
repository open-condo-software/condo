/**
 * Generated by `createschema miniapp.B2CAppProperty 'app:Relationship:B2CApp:PROTECT; address:Text;' --force`
 */

const get = require('lodash/get')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { historical, versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')
const { addressService } = require('@open-condo/keystone/plugins/addressService')
const { GQLListSchema, getById } = require('@open-condo/keystone/schema')

const { WRONG_VALUE } = require('@condo/domains/common/constants/errors')
const access = require('@condo/domains/miniapp/access/B2CAppProperty')
const {
    INCORRECT_ADDRESS_ERROR,
    INCORRECT_HOUSE_TYPE_ERROR,
} = require('@condo/domains/miniapp/constants')
const { VALID_HOUSE_TYPES } = require('@condo/domains/property/constants/common')

const ERRORS = {
    INCORRECT_ADDRESS: {
        code: BAD_USER_INPUT,
        type: WRONG_VALUE,
        variable: ['data', 'address'],
        message: INCORRECT_ADDRESS_ERROR,
    },
    INCORRECT_HOUSE_TYPE: {
        code: BAD_USER_INPUT,
        type: WRONG_VALUE,
        variable: ['data', 'address'],
        message: `${INCORRECT_HOUSE_TYPE_ERROR}. Valid values are: [${VALID_HOUSE_TYPES.join(', ')}]`,
    },
}

const B2CAppProperty = new GQLListSchema('B2CAppProperty', {
    schemaDoc: 'Link between specific home address and B2C App. used to filter B2C applications that can be run on a specific address',
    labelResolver: async (item) => {
        const app = await getById('B2CApp', item.app)
        const appName = get(app, 'name', 'deleted')
        const appDeveloper = get(app, 'developer', 'deleted')
        return `${appDeveloper}-${appName}-${item.address}`
    },
    fields: {
        app: {
            schemaDoc: 'Link to B2C App',
            type: 'Relationship',
            ref: 'B2CApp',
            isRequired: true,
            knexOptions: { isNotNullable: true }, // Required relationship only!
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
            access: {
                update: false,
            },
        },
    },
    plugins: [
        uuided(),
        addressService({
            fieldsHooks: {
                address: {
                    validateInput: ({ resolvedData, fieldPath, context }) => {
                        const inputAddress = resolvedData[fieldPath]
                        if (!inputAddress) {
                            throw new GQLError(ERRORS.INCORRECT_ADDRESS, context)
                        }

                        const suggestionAddress = get(resolvedData, ['addressMeta', 'value'], '')
                        const suggestionHouseType = get(resolvedData, ['addressMeta', 'data', 'house_type_full'])

                        if (!VALID_HOUSE_TYPES.includes(suggestionHouseType)) {
                            throw new GQLError(ERRORS.INCORRECT_HOUSE_TYPE, context)
                        }
                        if (suggestionAddress.toLowerCase() !== inputAddress.toLowerCase()) {
                            throw new GQLError(ERRORS.INCORRECT_ADDRESS, context)
                        }
                    },
                },
            },
        }),
        versioned(),
        tracked(),
        softDeleted(),
        dvAndSender(),
        historical(),
    ],
    access: {
        read: access.canReadB2CAppProperties,
        create: access.canManageB2CAppProperties,
        update: access.canManageB2CAppProperties,
        delete: false,
        auth: true,
    },
    kmigratorOptions: {
        constraints: [
            {
                type: 'models.UniqueConstraint',
                fields: ['addressKey', 'app'],
                condition: 'Q(deletedAt__isnull=True)',
                name: 'b2c_app_property_unique_addressKey',
            },
        ],
    },
})

module.exports = {
    B2CAppProperty,
}
