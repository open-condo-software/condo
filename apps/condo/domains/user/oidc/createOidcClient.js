const { createAdapterClass } = require('./adapter')

async function createOidcClient (oidcClient, context) {
    const AdapterFactoryClass = createAdapterClass(context)
    const clients = new AdapterFactoryClass('Client')
    return await clients.upsert(oidcClient.client_id, oidcClient)
}

module.exports = {
    createOidcClient,
}
