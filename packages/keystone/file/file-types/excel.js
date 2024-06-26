const excel = require('xlsx')

class ExcelParser {

    constructor (buffer) {
        this.buffer = buffer
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

    async parse () {
        const workbook = excel.read(this.buffer, { type: 'buffer' })
        const rows = []
        workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName]
            const range = excel.utils.decode_range(worksheet['!ref'])
            for (let rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
                const row = []
                for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
                    const cellAddress = excel.utils.encode_cell({ r: rowNum, c: colNum })
                    const cellValue = worksheet[cellAddress] ? worksheet[cellAddress].v : undefined
                    row.push(cellValue)
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