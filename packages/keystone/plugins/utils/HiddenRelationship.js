const { Implementation, Text } = require('@open-keystone/fields')

class HiddenRelationshipImplementation extends Implementation {
    gqlQueryInputFields () {
        return [
            ...this.equalityInputFields('String'),
            ...this.inInputFields('String'),
        ]
    }

    gqlOutputFields () {
        return [`${this.path}: String`]
    }

    gqlOutputFieldResolvers () {
        return { [`${this.path}`]: item => (item[this.path]) ? String(item[this.path]) : item[this.path] }
    }

    gqlUpdateInputFields () {
        return [`${this.path}: String`]
    }

    gqlCreateInputFields () {
        return [`${this.path}: String`]
    }

    async resolveInput ({ resolvedData }) {
        let value = resolvedData[this.path]
        if (typeof value === 'number') value = String(value)
        return value
    }
}

class HiddenKnexRelationshipInterface extends Text.adapters.knex {
    constructor () {
        super(...arguments)
        const [refListKey, refFieldPath] = this.config.ref.split('.')
        this.refListKey = refListKey
        this.refFieldPath = refFieldPath
    }

    addToTableSchema (table, rels) {
        const refList = this.getListByKey(this.refListKey)
        const refId = refList.getPrimaryKey()
        const foreignKeyConfig = {
            path: this.path,
            isUnique: this.isUnique,
            isIndexed: this.isIndexed,
            isNotNullable: this.isNotNullable,
        }
        refId.adapter.addToForeignTableSchema(table, foreignKeyConfig)
    }
}

// TODO(pahaz): test it
class HiddenMongoRelationshipInterface extends Text.adapters.mongoose {}

// TODO(pahaz): test it
class HiddenPrismaRelationshipInterface extends Text.adapters.prisma {}

const HiddenRelationship = {
    type: 'HiddenRelationship',
    implementation: HiddenRelationshipImplementation,
    views: Text.views,
    adapters: {
        knex: HiddenKnexRelationshipInterface,
        mongoose: HiddenMongoRelationshipInterface,
        prisma: HiddenPrismaRelationshipInterface,
    },
}

module.exports = {
    HiddenRelationship,
}
