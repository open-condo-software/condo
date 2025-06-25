/**
 * Returns active database adapter. Might be helpful when you need to build custom query
 * @param keystone {import('@open-keystone/keystone').Keystone} keystone instance
 * @returns {import('@open-keystone/keystone').BaseKeystoneAdapter}
 */
function getDatabaseAdapter (keystone) {
    return keystone.adapter
}

function getListAdapters (keystone) {
    return keystone.adapter.listAdapters
}

module.exports = {
    getDatabaseAdapter,
    getListAdapters,
}
