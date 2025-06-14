const { Integer } = require('@open-keystone/fields')

const { AutoIncrementInteger, AutoIncrementIntegerKnexFieldAdapter, AutoIncrementIntegerMongooseFieldAdapter, AutoIncrementIntegerPrismaFieldAdapter } = require('./Implementation')

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
