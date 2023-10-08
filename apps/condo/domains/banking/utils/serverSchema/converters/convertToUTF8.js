const iconv = require('iconv-lite')
const jschardet = require('jschardet')

class ConvertToUTF8 {
    constructor (buffer) {
        this.buffer = buffer
    }

    result (encoding) {
        if (!encoding) return null
        if (encoding === 'UTF-8') {
            return this.buffer.toString()
        }

        return iconv.decode(this.buffer, encoding).toString()
    }

    translate (encoding) {
        if (encoding === 'X-MAC-CYRILLIC') {
            return 'windows-1251'
        }

        return encoding
    }

    detectEncoding () {
        const { encoding } = jschardet.detect(this.buffer)
        return encoding ? this.translate(encoding.toUpperCase()) : null
    }

    convert () {
        const encoding = this.detectEncoding()
        return { encoding, result: this.result(encoding) }
    }
}

module.exports = {
    ConvertToUTF8,
}
