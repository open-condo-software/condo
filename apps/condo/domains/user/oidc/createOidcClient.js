const { AdapterFactory } = require('./adapter')

async function createOidcClient (oidcClient) {
    const clients = new AdapterFactory('Client')
    await clients.upsert(oidcClient.client_id, oidcClient)
}

module.exports = {
    createOidcClient,
}
