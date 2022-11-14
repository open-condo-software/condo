const Json = require('../Json')

// This is a Json field but with custom editor and custom cell view
module.exports = {
    ...Json,
    type: 'AddressPartWithType',
    views: {
        ...Json.views,
        Cell: require.resolve('./views/Cell'),
        Field: require.resolve('./views/Field'),
    },
}
