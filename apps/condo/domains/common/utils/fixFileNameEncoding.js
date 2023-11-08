const iconv = require('iconv-lite')

const getFixedFileNameEncoding = (filename) => {
    return iconv.decode(Buffer.from(filename, 'binary'), 'utf-8')
}

module.exports = {
    getFixedFileNameEncoding,
}