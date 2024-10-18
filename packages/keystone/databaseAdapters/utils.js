/**
 * Returns active database adapter. Might be helpful when you need to build custom query
 * @param keystone {import('@keystonejs/keystone').Keystone} keystone instance
 * @returns {import('@keystonejs/keystone').BaseKeystoneAdapter}
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
