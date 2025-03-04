const jschardet = require('jschardet')

const { DBFParser, CSVParser, ExcelParser } = require('./file-types')
const { clearString, encode, detectEncoding, convertEncoding, ROWS_COUNT_LIMIT_EXCEEDED } = require('./utils')

const TYPES = {
    DBF: 'DBF',
    CSV: 'CSV',
    EXCEL: 'EXCEL',
    UNSUPPORTED: 'NOT SUPPORTED FILE',
}


class ConvertFileToTable {

    constructor (buffer, maxRowsCount) {
        this.buffer = Buffer.from(buffer)
        this.maxRowsCount = maxRowsCount
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
        return await encode(encoding)
    }

    detectEncoding () {
        return detectEncoding(this.buffer)
    }

    async convertEncoding (encoding) {
        return convertEncoding(this.buffer, encoding)
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
                worker = new ExcelParser(this.buffer, this.maxRowsCount)
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
            if (error.message === ROWS_COUNT_LIMIT_EXCEEDED) {
                throw new Error(ROWS_COUNT_LIMIT_EXCEEDED)
            }

            return []
        }

    }

}

module.exports = {
    ConvertFileToTable,
    TYPES,
}