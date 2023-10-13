const { prepareKeystone } = require('@open-condo/keystone/KSv5v6/v5/prepareKeystone')

const { makeFileAdapterMiddleware } = require('@dev-api/domains/common/utils/files')

const schemas = () => [
    require('@dev-api/domains/user/schema'),
    require('@dev-api/domains/miniapp/schema'),
]

const apps = () => [
    makeFileAdapterMiddleware(),
]

module.exports = prepareKeystone({
    schemas,
    apps,
})