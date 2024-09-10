const iconv = require('iconv-lite')
const jschardet = require('jschardet')


const FORCE_ENCODING_CHANGE = {
    'X-MAC-CYRILLIC': 'WINDOWS-1251',
    'KOI8-R': 'WINDOWS-1251', // TODO: Find why KOI8 detected on WINDOWS-1251
}

class EncodingDetector {
    constructor (buffer) {
        this.buffer = Buffer.from(buffer)
        this.encoding = null
    }

    async encode (encoding) {
        if (!encoding) {
            return null
        }
        if (encoding === 'UTF-8') {
            return this.buffer.toString()
        }
        return iconv.decode(this.buffer, encoding).toString()
    }

    detectEncoding () {
        if (this.encoding) return this.encoding

        const { encoding: detectedEncoding } = jschardet.detect(this.buffer)

        if (detectedEncoding) {
            const encoding = detectedEncoding.toUpperCase()
            const supportedEncoding = FORCE_ENCODING_CHANGE[encoding] || encoding

            this.encoding = supportedEncoding

            return supportedEncoding
        }
        return this.encoding
    }

    async convertEncoding (encoding) {
        return await this.encode(encoding)
    }

}

module.exports = {
    EncodingDetector,
}