const excel = require('xlsx')

const FIVE_OR_MORE_DIGITS_IN_STRING = /^\d{5,}$/

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

    /**
     * Excel stores date types as numbers <days from epoch>.<time data>
     * @param serial {number} date from excel parser
     * @returns {string} YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS
     */
    static parseExcelDate (serial) {
        const withTime = String(serial).includes('.')

        // milliseconds since 1899-12-31T00:00:00Z, corresponds to Excel serial 0.
        const xlSerialOffset = -2209075200000

        let elapsedDays
        // each serial up to 60 corresponds to a valid calendar date.
        // serial 60 is 1900-02-29. This date does not exist on the calendar.
        // we choose to interpret serial 60 (as well as 61) both as 1900-03-01
        // so, if the serial is 61 or over, we have to subtract 1.
        if (serial < 61) {
            elapsedDays = serial
        }
        else {
            elapsedDays = serial - 1
        }

        // javascript dates ignore leap seconds
        // each day corresponds to a fixed number of milliseconds:
        // 24 hrs * 60 mins * 60 s * 1000 ms
        const millisPerDay = 86400000

        const jsTimestamp = xlSerialOffset + elapsedDays * millisPerDay
        const date = new Date(jsTimestamp)
        const year = date.getUTCFullYear()
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
        const day = date.getUTCDate().toString().padStart(2, '0')

        let dateString = `${year}-${month}-${day}`
        let hours = '00'
        let minutes = '00'
        let seconds = '00'
        let milliseconds = '000'
        if (withTime) {
            hours = date.getUTCHours().toString().padStart(2, '0')
            minutes = date.getUTCMinutes().toString().padStart(2, '0')
            seconds = date.getUTCSeconds().toString().padStart(2, '0')
            milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0')
        }
        dateString += `T${hours}:${minutes}:${seconds}.${milliseconds}Z`
        return dateString
    }

    static isExcelDate (serial) {
        if (typeof serial !== 'number' && !serial) {
            return false
        }
        const [daysFromEpoch] = serial.toString().split('.')

        // 2020-10-31 stands for 44927 days from epoch, so must be enough to not mistake with YYYY.MM
        return daysFromEpoch && FIVE_OR_MORE_DIGITS_IN_STRING.test(daysFromEpoch)
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