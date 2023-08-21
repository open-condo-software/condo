const { AsyncLocalStorage } = require('node:async_hooks')

const { getLogger } = require('./logging')

const ASYNC_LOCAL_STORAGES = {}
const logger = getLogger('asyncLocalStorage')

function getExecutionContext () {
    const requestCtxLocalStorage = internalGetAsyncLocalStorage('requestCtx')
    const taskCtxLocalStorage = internalGetAsyncLocalStorage('taskCtx')
    return {
        requestCtx: requestCtxLocalStorage.getStore(),
        taskCtx: taskCtxLocalStorage.getStore(),
    }
}

/**
 *
 * This function is intended to be used in internal modules only, like prepareKeystone.js
 *
 * Use this function if you need a specific asyncLocalStorage instance in project
 *
 * @param {string} name -- name of storage
 * @returns {import('node:async_hooks').AsyncLocalStorage}
 */
function internalGetAsyncLocalStorage (name = 'default') {
    if (!name) throw new Error('getAsyncLocalStorage() without client name')
    if (typeof name !== 'string') throw new Error('getAsyncLocalStorage() name is not a string')
    if (!ASYNC_LOCAL_STORAGES[name]) {
        logger.info({ msg: 'getAsyncLocalStorage new storage to be created:', name })
        ASYNC_LOCAL_STORAGES[name] = new AsyncLocalStorage()
    }

    return ASYNC_LOCAL_STORAGES[name]
}

module.exports = {
    internalGetAsyncLocalStorage,
    getExecutionContext,
}
