const { Text } = require('@keystonejs/fields')

class HiddenRelationshipImplementation extends Text.implementation {
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
        return { [`${this.path}`]: item => String(item[this.path]) }
    }

    gqlUpdateInputFields () {
        return [`${this.path}: String`]
    }

    gqlCreateInputFields () {
        return [`${this.path}: String`]
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
    type: 'Relationship',
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
