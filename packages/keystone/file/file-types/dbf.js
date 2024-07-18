const { DbfReader } = require('./dbfReader')

class DBFParser {

    constructor (buffer, encoding) {
        this.buffer = buffer
        //const encodingByte = buffer.readUInt8(29)
        //console.log(encodingByte)
        // we can detect encoding, but in fact all dbf files has a standard for encoding and it is ibm866
        this.reader = new DbfReader('ibm866')
    }

    async parse () {
        const { rows = [] } = this.reader.read(this.buffer)
        return rows.map(obj => Object.values(obj))
    }
}

module.exports = {
    DBFParser,
}