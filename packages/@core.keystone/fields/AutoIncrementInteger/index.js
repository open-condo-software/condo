const { AutoIncrementInteger, AutoIncrementIntegerKnexFieldAdapter, AutoIncrementIntegerMongooseFieldAdapter, AutoIncrementIntegerPrismaFieldAdapter } = require('./Implementation')
const { Integer } = require('@keystonejs/fields')

module.exports = {
    type: 'AutoIncrementInteger',
    implementation: AutoIncrementInteger,
    adapters: {
        knex: AutoIncrementIntegerKnexFieldAdapter,
        mongoose: AutoIncrementIntegerMongooseFieldAdapter,
        prisma: AutoIncrementIntegerPrismaFieldAdapter,
    },
    views: Integer.views,
}
