const express = require('express')
const { keystone, apps } = require('./index.js')

const URL_PREFIX = '/ex01'

async function prepareBackServer (server) {

}

async function prepareBackApp () {
    const app = express()

    return new Promise((resolve) => {
        keystone
            .prepare({
                apps: apps,
                dev: process.env.NODE_ENV !== 'production',
            })
            .then(async ({ middlewares }) => {
                await keystone.connect()
                app.use(middlewares)
                resolve(app)
            })
    })
}

module.exports = {
    URL_PREFIX,
    prepareBackApp,
    prepareBackServer,
}
