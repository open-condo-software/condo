const { prepareKeystone } = require('@open-condo/keystone/KSv5v6/v5/prepareKeystone')

const schemas = () => [
    require('@dev-api/domains/user/schema'),
]

module.exports = prepareKeystone({
    schemas,
})