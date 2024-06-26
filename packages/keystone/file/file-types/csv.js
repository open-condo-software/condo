const { parse } = require('csv-parse')

class CSVParser {

    constructor (content) {
        this.content = content
        this.options = {
            delimiter: ';',
            headers: false,
            relax: true,
            quote: '',
            ltrim: true, //parsing breaks on quotes
            rtrim: true,
            relax_quotes: true,
            relax_column_count: true,
            raw: false,
        }
    }

    parse () {
        return new Promise((resolve, reject) => {
            parse(this.content, this.options, (err, result) => {
                if (err) {
                    return reject(err)
                }
                return resolve(result)
            })
        })
    }
}

module.exports = {
    CSVParser,
}