const iconv  = require('iconv-lite')

class DbfReader {

    constructor (encoding) {
        this.encoding = encoding
    }

    readFieldsInfo (dbaseFile) {
        let byteRead
        let fields = []
        let i = 0
        do {
            byteRead = DbfReader.fileHeaderSize + (i * DbfReader.fieldDescriptorSize) + 1
            let fieldNameLength = 0
            while (Buffer.from(dbaseFile.subarray(byteRead + fieldNameLength, byteRead + fieldNameLength + 1)).toString() !== '\u0000' && fieldNameLength < 11) {
                fieldNameLength += 1
            }
            let fieldName = Buffer.from(dbaseFile.subarray(byteRead, byteRead + fieldNameLength)).toString()
            byteRead = byteRead + 11
            let fieldType = Buffer.from(dbaseFile.subarray(byteRead, byteRead + 1)).toString()
            byteRead = byteRead + 1
            byteRead = byteRead + 4 //reserved
            let fieldLength = dbaseFile.readIntLE(byteRead, 1)
            byteRead = byteRead + 1
            let decimalCount = dbaseFile.readIntLE(byteRead, 1)
            byteRead = byteRead + 1
            fields.push(new DbfReader.FieldDescriptor(fieldName, fieldType, fieldLength, decimalCount))
            byteRead = byteRead + 14 // Not required to read
            i += 1
        } while (Buffer.from(dbaseFile.subarray(byteRead, byteRead + 1)).toString() !== '\r')
        return fields
    }

    getDateValue (value) {
        try {
            if (value.length === 8) {
                let year = value.substr(0, 4)
                let month = value.substr(4, 2)
                let date = value.substr(6, 2)
                return new Date(+year, +month, +date)
            }
        }
        catch (error) {
            console.log(error)
        }
        return null
    }

    getFieldValue (valueBuffer, type, decimalCount, fieldlength) {
        let value = valueBuffer.toString().trim()
        let byteRead = 0
        let valueLength = 0
        try {
            switch (type.trim().toLowerCase()) {
                case 'q':
                    break
                case 'v':
                    while (Buffer.from(valueBuffer.subarray(byteRead + valueLength, byteRead + valueLength + 1)).toString() !== '\u0000' && valueLength < fieldlength) {
                        valueLength += 1
                    }
                    value = Buffer.from(valueBuffer.subarray(byteRead, byteRead + valueLength)).toString().trim()
                    break
                case 'c':
                    value = this.decode(valueBuffer)
                    break
                case 'd':
                    value = this.getDateValue(value)
                    break
                case 'f':
                case 'n':
                    value = Number(value)
                    break
                case 'l':
                    value = value.toLowerCase() === 'y' || value.toLowerCase() === 't'
                    break
                case 'g':
                case 'i':
                    value = valueBuffer.readIntLE(0, valueBuffer.byteLength)
                    break
                case 'y':
                    // eslint-disable-next-line no-case-declarations
                    let currency = valueBuffer.readIntLE(0, valueBuffer.byteLength).toString()
                    currency = currency.substr(0, currency.length - decimalCount) + '.' + currency.substr(currency.length - decimalCount, currency.length - 4)
                    value = Number(currency)
                    break
                case 'b':
                    value = valueBuffer.readDoubleLE(0)
                    break
                case 't':
                    // eslint-disable-next-line no-case-declarations
                    let dateWord = valueBuffer.readInt32LE(0)
                    // eslint-disable-next-line no-case-declarations
                    let duration = valueBuffer.readInt32LE(4)
                    // eslint-disable-next-line no-case-declarations
                    let seconds = Math.floor((duration / 1000) % 60)
                    // eslint-disable-next-line no-case-declarations
                    let minutes = Math.floor((duration / (1000 * 60)) % 60)
                    // eslint-disable-next-line no-case-declarations
                    let hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
                    // eslint-disable-next-line no-case-declarations
                    let date = DbfReader.julianIntToDate(dateWord)
                    value = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, seconds)
            }
        }
        catch (error) {
            console.log(error)
        }
        return value
    }

    static julianIntToDate (jd) {
        let year, month, day, l, n, i, j, k
        l = jd + 68569
        n = Math.floor(Math.floor(4 * l) / 146097)
        l = l - Math.floor((146097 * n + 3) / 4)
        i = Math.floor(4000 * (l + 1) / 1461001)
        l = l - Math.floor(1461 * i / 4) + 31
        j = Math.floor(80 * l / 2447)
        k = l - Math.floor(2447 * j / 80)
        l = Math.floor(j / 11)
        j = j + 2 - 12 * l
        i = 100 * (n - 49) + i + l
        year = i
        month = j
        day = k
        let date = new Date(year, month, day)
        date.setMonth(date.getMonth() - 1)
        return date
    }

    static getTypeName (type) {
        let typeName = 'string'
        try {
            switch (type.trim().toLowerCase()) {
                case 'v':
                case 'c':
                    typeName = 'string'
                    break
                case 'd':
                    typeName = 'date'
                    break
                case 'y':
                case 'i':
                case 'g':
                case 'b':
                case 'f':
                case 'n':
                    typeName = 'numeric'
                    break
                case 'l':
                    typeName = 'boolean'
                    break
                case 't':
                    typeName = 'datetime'
                    break
                // case 'q': typeName = 'binary'
                //     break
                default: typeName = 'notsupported'
            }
        }
        catch (error) {
            console.log(error)
        }
        return typeName
    }

    decode (str) {
        return iconv.decode(str, this.encoding).toString()
    }

    read (dbaseFile) {
        let dt = { columns: [], rows: [] }
        let byteRead = 0
        byteRead = byteRead + 1
        byteRead = byteRead + 1
        byteRead = byteRead + 1
        byteRead = byteRead + 1
        let recordCount = dbaseFile.readInt32LE(byteRead)
        byteRead = byteRead + 4
        let recordDataStartOffset = dbaseFile.readInt16LE(byteRead)
        byteRead = byteRead + 8
        byteRead = byteRead + 8
        let fields = this.readFieldsInfo(dbaseFile)
        byteRead = recordDataStartOffset + 1
        fields.forEach((f) => {
            let dataColumn = {}
            dataColumn.name = f.fieldName
            dataColumn.type = DbfReader.getTypeName(f.fieldType)
            if (dataColumn.type !== 'notsupported') {
                dt.columns.push(dataColumn)
            }
        })
        byteRead = recordDataStartOffset
        for (let i = 0; i < recordCount; i++) {
            let row = {}
            if (Buffer.from(dbaseFile.subarray(byteRead, byteRead + 1)).toString() === ' ') {
                byteRead = byteRead + 1
                fields.forEach(col => {
                    let type = DbfReader.getTypeName(col.fieldType)
                    if (col.fieldLength < 0) {
                        col.fieldLength = 256 + col.fieldLength
                    }
                    if (col.fieldLength > 0) {
                        let value = this.getFieldValue(Buffer.from(dbaseFile.subarray(byteRead, byteRead + col.fieldLength)), col.fieldType, col.fieldDecimalCount, col.fieldLength)
                        if (type !== 'notsupported') {
                            row[col.fieldName] = value
                        }
                        byteRead = byteRead + col.fieldLength
                    }
                    else {
                        throw new SyntaxError('Unsupported Dbase (.dbf) file')
                    }
                })
                dt.rows.push(row)
            }
            else {
                byteRead = byteRead + 1
                fields.forEach(col => {
                    byteRead = byteRead + col.fieldLength
                })
            }
        }
        return dt
    }
}

DbfReader.fileHeaderSize = 31

DbfReader.fieldDescriptorSize = 32

DbfReader.FieldDescriptor = class {
    constructor (fieldName, fieldType, fieldLength, fieldDecimalCount) {
        this.fieldName = fieldName
        this.fieldType = fieldType
        this.fieldLength = fieldLength
        this.fieldDecimalCount = fieldDecimalCount
    }
}

module.exports = {
    DbfReader,
}
