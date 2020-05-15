const { prepareNextExpressApp } = require('@core/keystone/test.utils')

const URL_PREFIX = '/'
const NAME = 'FRONT05NEXT'

async function prepareBackServer (server) {}

async function prepareBackApp () {
    const { app } = await prepareNextExpressApp(__dirname)
    return app
}

module.exports = {
    NAME,
    URL_PREFIX,
    prepareBackApp,
    prepareBackServer,
}
