const excel = require('xlsx')

const { ROWS_COUNT_LIMIT_EXCEEDED } = require('../constants')


class ExcelParser {

    constructor (buffer, maxRowsCount) {
        this.buffer = buffer
        this.maxRowsCount = maxRowsCount
    }
    
    static isXlsxFile (buffer) {
        const magicNumbers = [0x50, 0x4B, 0x03, 0x04]
        for (let i = 0; i < magicNumbers.length; i++) {
            if (buffer[i] !== magicNumbers[i]) {
                return false
            }
        }
        return true
    }

    static isXlsFile (buffer) {
        const magicNumbers = [0xD0, 0xCF, 0x11, 0xE0]
        for (let i = 0; i < magicNumbers.length; i++) {
            if (buffer[i] !== magicNumbers[i]) {
                return false
            }
        }
        return true
    }

    /** @param {excel.CellObject} cell
     *  @returns {string | undefined}
     */
    parseCell (cell) {
        const isDefinedDate = cell && cell.t === 'd' && cell.v instanceof Date
        if (isDefinedDate) {
            return cell.v.toISOString()
        } else if (cell) {
            return cell.v
        }
    }

    async parse () {
        const workbook = excel.read(this.buffer, { type: 'buffer', cellDates: true })
        const rows = []
        workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName]
            const range = excel.utils.decode_range(worksheet['!ref'])
            if (this.maxRowsCount && range.e.r > this.maxRowsCount) {
                throw new Error(ROWS_COUNT_LIMIT_EXCEEDED)
            }

            for (let rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
                const row = []
                for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
                    const cellAddress = excel.utils.encode_cell({ r: rowNum, c: colNum })
                    row.push(this.parseCell(worksheet[cellAddress]))
                }
                rows.push(row)
            }
        })
        return rows
    }
}

module.exports = {
    ExcelParser,
}