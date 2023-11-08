const iconv = require('iconv-lite')

const convertFileNameToUTF8 = (filename) => {
    return iconv.decode(Buffer.from(filename, 'binary'), 'utf-8')
}

module.exports = {
    convertFileNameToUTF8,
}