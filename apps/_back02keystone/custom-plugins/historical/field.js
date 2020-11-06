const {
    Text, Select, DateTimeUtc, Uuid,
    Relationship,
} = require('@keystonejs/fields')
const { v4: uuid } = require('uuid')

const GQL_TYPE_SUFFIX = '_history'

class HistoryType extends Relationship.implementation {
    constructor (path, { fields, historyField, ignoreFieldTypes, ...fieldConfig }, listConfig) {
        // To maintain consistency with other types, we grab the sanitised name
        // directly from the list.
        const { itemQueryName } = listConfig.getListByKey(listConfig.listKey).gqlNames
        const type = `${itemQueryName}${GQL_TYPE_SUFFIX}`

        // Ensure the list is only instantiated once per server instance.
        let auxList = listConfig.getListByKey(type)
        const ignoreTypes = ignoreFieldTypes || []
        const historyFields = Object.fromEntries(Object.entries(fields).filter(
            ([k, v]) => !ignoreTypes.includes(v.type.type) && (v.type.type !== 'Relationship' || !v.many),
        ))
        historyFields['id'] = {
            type: Uuid,
            defaultValue: () => uuid(),
        }

        if (!auxList) {
            auxList = listConfig.createAuxList(type, {
                fields: {
                    ...historyFields,
                    history_date: { type: DateTimeUtc, isRequired: true },
                    history_action: { type: Select, options: 'c, u, d', isRequired: true },
                    history_id: {
                        type: Relationship,
                        many: false,
                        ref: `${listConfig.listKey}`,
                        isRequired: true,
                        kmigratorOptions: { 'db_constraint': false, null: false },
                    },
                },
            })
        }

        // Link up the back reference to keep things in sync
        const config = { ...fieldConfig, many: false, ref: `${type}` }
        super(path, config, listConfig)

        this.auxList = auxList
        // this.listConfig = listConfig
    }

    get _supportsUnique () {
        return false
    }

    // getGqlAuxTypes({ schemaName }) {
    //     return [...super.getGqlAuxTypes({ schemaName }), ...this.auxList.getGqlTypes({ schemaName })];
    // }
    //
    // gqlAuxFieldResolvers({ schemaName }) {
    //     return this.auxList.gqlFieldResolvers({ schemaName });
    // }
}

class MongoHistoryInterface extends Relationship.adapters.mongoose {}

class KnexHistoryInterface extends Relationship.adapters.knex {}

class PrismaHistoryInterface extends Relationship.adapters.prisma {}

const History = {
    type: 'History',
    implementation: HistoryType,
    views: Relationship.views,
    adapters: {
        mongoose: MongoHistoryInterface,
        knex: KnexHistoryInterface,
        prisma: PrismaHistoryInterface,
    },
}

module.exports = {
    History,
}
