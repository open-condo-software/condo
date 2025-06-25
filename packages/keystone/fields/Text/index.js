const { Text } = require('@open-keystone/fields')

class RegexplessKnexFieldAdapter extends Text.adapters.knex {

    equalityConditionsInsensitive (dbPath) {
        return {
            [`${this.path}_i`]: (value) => (b) => b.whereRaw(`lower("${dbPath.split('.').join('"."')}") = lower(?)`, [value]),
            [`${this.path}_not_i`]: (value) => (b) =>
                value === null
                    ? b.whereNotNull(dbPath)
                    : b.whereRaw(`lower("${dbPath.split('.').join('"."')}") != lower(?)`, [value]).orWhereNull(dbPath),
        }
    }
}

module.exports = {
    type: 'Text',
    implementation: Text.implementation,
    views: Text.views,
    adapters: {
        mongoose: Text.adapters.mongoose,
        knex: RegexplessKnexFieldAdapter,
        prisma: Text.adapters.prisma,
    },
}
