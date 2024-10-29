const LOCALE = require('./locales')

class ToWords {
    formatRegExp = /\$([a-z]+)/gi

    constructor (locale = 'ru') {
        this.#setWordsToConvert(locale)
    }

    #setWordsToConvert (locale) {
        const wordsToConvert = LOCALE[locale]
        this.currency = wordsToConvert.currency
        this.smallDischarges = wordsToConvert.smallDischarges
        this.bigDischarges = wordsToConvert.bigDischarges
    }

    // Написать тесты
    format (input, locale, format = '$SummString $summCurrency $pennyString $pennyCurrency') {
        if (locale) this.#setWordsToConvert(locale)

        const numberWithDecimal = input.toFixed(2)

        let [base = '0', dop = '00'] = this.#parseNumber(numberWithDecimal)

        dop = dop.slice(0, 2)
        dop = ('00' + dop).slice(-2)
    
        return format.replace(this.formatRegExp, (find, arg) => {
            switch (arg) {
                case 'summString': return this.#numbersInWords(input)
                case 'summCurrency': return this.#counterWord(this.currency[0], +base.slice(-2))
                case 'SummString': return this.#firstUpper(this.#numbersInWords(input))
                case 'SummCurrency': return this.#firstUpper(this.#counterWord(this.currency[0], +base.slice(-2)))
                case 'penny': return dop
                case 'pennyString': return this.#numbersInWords(+dop, true)
                case 'pennyCurrency': return this.#counterWord(this.currency[1], +dop)
                case 'PennyString': return this.#firstUpper(this.#numbersInWords(+dop, true))
                case 'PennyCurrency': return this.#firstUpper(this.#counterWord(this.currency[1], +dop))
                default: return find
            }
        })
    }

    #parseNumber (input) {
        return input
            .toString()
            .replace(/[\s\t]+/g, '')
            .split(/[.,]/)
    }

    #joinWord (input, index = 0) {
        return input[0] + input[index + 1]
    }


    #firstUpper = (input) => {
        return input.slice(0, 1).toUpperCase() + input.slice(1).toLocaleLowerCase()
    }

    #counterWord (input, counter) {
        const units = counter % 10

        if (counter > 10 && counter < 20)
            return this.#joinWord(input, 0)

        if (units == 1)
            return this.#joinWord(input, 1)

        if (units > 1 && units < 5)
            return this.#joinWord(input, 2)

        return this.#joinWord(input, 0)
    }

    #numbersInWords = (input, com = false) => {
        const output = []
    
        let [num] = this.#parseNumber(input)
    
        let deep = 0
    
        if (!num || num === '0')
            return this.smallDischarges[0][0]
    
        while (num.length) {
            const row = []
            const current = +num.slice(-3)
            num = num.slice(0, -3)
    
            const hundreds = current / 100 | 0
            const dozens = current / 10 % 10 | 0
            const units = current % 10
    
            if (current) {
                row.push(this.smallDischarges[4][hundreds])
    
                if (dozens === 1) {
                    row.push(this.smallDischarges[2][units])
                } else {
                    row.push(this.smallDischarges[3][dozens])
    
                    if (deep === 1 || deep == 0 && com) {
                        row.push(
                            this.smallDischarges[5][units] ?? this.smallDischarges[1][units]
                        )
                    } else {
                        row.push(this.smallDischarges[1][units])
                    }
                }
    
                if (deep) {
                    row.push(this.#counterWord(this.bigDischarges[deep] ?? this.bigDischarges[0], current))
                }
            }
    
            const rowString = row.filter(e => e && e != '-').join(' ')
    
            if (rowString)
                output.unshift(rowString)
    
            deep++
        }
    
        return output.join(' ')
    }
}


module.exports = {
    ToWords,
}