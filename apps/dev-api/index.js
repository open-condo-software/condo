const { prepareKeystone } = require('@open-condo/keystone/KSv5v6/v5/prepareKeystone')

const schemas = () => [
    require('@dev-api/domains/user/schema'),
    require('@dev-api/domains/miniapp/schema'),
]

module.exports = prepareKeystone({
    schemas,
})