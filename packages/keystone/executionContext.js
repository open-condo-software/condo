/**
 * This module implements features needed for global execution context tracking.
 *
 * If you want to solve your task using Async Local Storage, this module should be extended.
 */

const { AsyncLocalStorage: ExecutionContext } = require('node:async_hooks')

const { v4 } = require('uuid')

const ASYNC_LOCAL_STORAGES = {}

_internalGetExecutionContextAsyncLocalStorage().enterWith( { execId: v4(), execProcessArgv: process.argv })

/**
 * Return current execution context
 *
 * @returns {object}
 */
function getExecutionContext () {
    return _internalGetExecutionContextAsyncLocalStorage().getStore()
}

/**
 * This function is intended to be used in internal modules only, like prepareKeystone.js
 * Use this function if you need asyncLocalStorage dedicated to executionContext instance
 *
 * @returns {import('node:async_hooks').AsyncLocalStorage}
 * @deprecated for any external usage!
 */
function _internalGetExecutionContextAsyncLocalStorage () {
    return _internalGetAsyncLocalStorage('executionCtx')
}

/**
 * This function is intended to be used in internal modules only, like prepareKeystone.js
 * Use this function if you need a specific asyncLocalStorage instance in project
 *
 * @param {string} name -- name of storage
 * @returns {import('node:async_hooks').AsyncLocalStorage}
 * @deprecated for any external usage!
 */
function _internalGetAsyncLocalStorage (name = 'default') {
    if (!name) throw new Error('getAsyncLocalStorage() without client name')
    if (typeof name !== 'string') throw new Error('getAsyncLocalStorage() name is not a string')
    if (!ASYNC_LOCAL_STORAGES[name]) {
        ASYNC_LOCAL_STORAGES[name] = new ExecutionContext()
    }

    return ASYNC_LOCAL_STORAGES[name]
}


module.exports = {
    _internalGetExecutionContextAsyncLocalStorage,
    _internalGetAsyncLocalStorage,
    getExecutionContext,
}
