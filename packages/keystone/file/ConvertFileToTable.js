const iconv = require('iconv-lite')
const jschardet = require('jschardet')

const { DBFParser, CSVParser, ExcelParser } = require('./file-types')
const { clearString } = require('./utils')

const TYPES = {
    DBF: 'DBF',
    CSV: 'CSV',
    EXCEL: 'EXCEL',
    UNSUPPORTED: 'NOT SUPPORTED FILE',
}

const FORCE_ENCODING_CHANGE = {
    'X-MAC-CYRILLIC': 'WINDOWS-1251',
    'KOI8-R': 'WINDOWS-1251', // TODO: Find why KOI8 detected on WINDOWS-1251
}


class ConvertFileToTable {

    constructor (buffer) {
        this.buffer = Buffer.from(buffer)
    }

    isDBFFile () {
        return this.buffer[0] === 0x03
    }

    isZipFile () {
        const magicNumbers = [0x50, 0x4B, 0x03, 0x04]
        for (let i = 0; i < magicNumbers.length; i++) {
            if (this.buffer[i] !== magicNumbers[i]) {
                return false
            }
        }
        const fileNameLength = this.buffer.readUInt16LE(26)
        const fileName = this.buffer.subarray(30, 30 + fileNameLength).toString('utf-8')
        if (fileName && (fileName.startsWith('xl/') || fileName.startsWith('_rels/') || fileName.endsWith('.xml'))) {
            return false
        }
        return true
    }

    async isExcelFile () {
        return ExcelParser.isXlsxFile(this.buffer) && !this.isZipFile() || ExcelParser.isXlsFile(this.buffer)
    }

    isTextFile () {
        const encoding = jschardet.detect(this.buffer).encoding
        return typeof encoding === 'string' && encoding !== 'windows-1252' && encoding !== 'ISO-8859-1' && encoding !== 'ISO-8859-2'
    }

    async detectFileType () {
        if (this.isDBFFile()) {
            return TYPES.DBF
        }
        if (await this.isExcelFile()) {
            return TYPES.EXCEL
        }
        if (this.isZipFile()) {
            return TYPES.UNSUPPORTED
        }
        if (this.isTextFile()) {
            return TYPES.CSV
        }
        return TYPES.UNSUPPORTED
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
        const { encoding: detectedEncoding } = jschardet.detect(this.buffer)
        if (detectedEncoding) {
            const encoding = detectedEncoding.toUpperCase()
            return FORCE_ENCODING_CHANGE[encoding] || encoding
        }
        return null
    }

    async convertEncoding (encoding) {
        return await this.encode(encoding)
    }

    async getData () {
        const type = await this.detectFileType()
        let worker
        switch (type) {
            case TYPES.CSV:
                worker = new CSVParser(await this.convertEncoding(this.detectEncoding()))
                break
            case TYPES.DBF:
                worker = new DBFParser(this.buffer, this.detectEncoding())
                break
            case TYPES.EXCEL:
                worker = new ExcelParser(this.buffer)
                break
            case TYPES.UNSUPPORTED:
            default:
                throw new Error(TYPES.UNSUPPORTED)
        }
        try {
            const rawResult = await worker.parse()
            return rawResult.map(row => row.map(cell => clearString(cell)))
                .filter(row => {
                    const rowString = row.join('').trim()
                    return rowString.length && rowString[0] !== '#'
                })
        } catch (error) {
            return []
        }

    }

}

module.exports = {
    ConvertFileToTable,
    TYPES,
}