const zlib = require('node:zlib')

function compress (data) {
    return zlib.brotliCompressSync(Buffer.from(data))
}

function decompress (data) {
    return zlib.brotliDecompressSync(data)
}

module.exports = {
    compress,
    decompress,
}