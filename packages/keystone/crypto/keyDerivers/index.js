const isEmpty = require('lodash/isEmpty')
const isNil = require('lodash/isNil')

const pbkdf2 = require('./pbkdf2')

/** @typedef KeyDeriver
 * @type {{saltLength: number, derive(secretKey: string, keyLen: number): Buffer<string>}}
 */

/** @type {KeyDeriver} */
const noop = {
    saltLength: 0,
    derive (secretKey) { 
        return {
            masterKey: secretKey,
            iterations: 0,
            salt: Buffer.alloc(0),
        } 
    },
}

/** @type {Record<string, KeyDeriver>}  */
const keyDerivers = {
    'noop': noop,
    'pbkdf2-sha512': pbkdf2,
}

/**
 * @param {string} name
 * @param {KeyDeriver} deriver
 */
function registerKeyDeriver (name, deriver) {
    if (typeof name !== 'string') {
        throw new Error('param "name" of type "string" required')
    }
    if (isEmpty(name)) {
        throw new Error('param "name" should be non-empty')
    }
    if (keyDerivers[name]) {
        throw new Error(`Duplicate name ${name}`)
    }
    if (isNil(deriver)) {
        throw new Error('Empty "deriver" provided')
    }
    if (isNil(deriver.saltLength) || typeof deriver.saltLength !== 'number') {
        throw new Error('"deriver" should have property "saltLength" of type number')
    }
    if (isNil(deriver.derive) || typeof deriver.derive !== 'function') {
        throw new Error('"deriver" should have method "derive"')
    }
    keyDerivers[name] = deriver
}

module.exports = {
    keyDerivers,
    registerKeyDeriver,
}