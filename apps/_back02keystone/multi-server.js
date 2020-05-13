const { prepareKeystoneExpressApp } = require('@core/keystone/test.utils')

const URL_PREFIX = '/'
const NAME = 'BACK02KEYSTONE'

async function prepareBackServer (server) {}

async function prepareBackApp () {
    const { app } = await prepareKeystoneExpressApp(require.resolve('./index'))
    return app
}

module.exports = {
    NAME,
    URL_PREFIX,
    prepareBackApp,
    prepareBackServer,
}
