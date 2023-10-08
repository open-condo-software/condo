const { AddressPartWithTypeImplementation } = require('./Implementation')

const Json = require('../Json')

// This is a Json field but with custom editor and custom cell view
module.exports = {
    ...Json,
    implementation: AddressPartWithTypeImplementation,
    type: 'AddressPartWithType',
    views: {
        ...Json.views,
        Controller: require.resolve('./views/Controller'),
        Cell: require.resolve('./views/Cell'),
        Field: require.resolve('./views/Field'),
    },
}
