const isEmpty = require('lodash/isEmpty')
const isNil = require('lodash/isNil')

const brotli = require('./brotli')

/** @typedef Compressor
 * @type {{compress(data:string):Buffer<string>,decompress(data:Buffer<string>):Buffer<string>}}
*/

const noop = {
    compress (data) { return Buffer.from(data) },
    decompress (data) { return data },
}

const compressors = {
    'noop': noop,
    'brotli': brotli,
}

function registerCompressor (name, compressor) {
    if (typeof name !== 'string') {
        throw new Error('param "name" of type "string" required')
    }
    if (isEmpty(name)) {
        throw new Error('param "name" should be non-empty')
    }
    if (compressors[name]) {
        throw new Error(`Duplicate name ${name}`)
    }
    if (isNil(compressor)) {
        throw new Error('Empty "compressor" provided')
    }
    if (isNil(compressor.compress) || typeof compressor.compress !== 'function') {
        throw new Error('"compressor" should have method "compress"')
    }
    if (isNil(compressor.decompress) || typeof compressor.decompress !== 'function') {
        throw new Error('"compressor" should have method "decompress"')
    }
    compressors[name] = compressor
}

module.exports = {
    compressors,
    registerCompressor,
}