const KEYWORDS = {
    parking: ['автоместо', 'парковка', 'паркинг', 'машиноместо', 'гараж', 'м/м', 'мм', 'место', 'м/место', 'а/м', 'бокс', 'парк'],
    apartment: ['аппарт', 'апарт', 'ап', 'апп'],
    commercial: ['офис', 'оф'],
    warehouse: ['помещение', 'подвал', 'помещ', 'пом', 'кл', 'кладовка'],
    flat: ['квартира', 'кв', 'комн', 'кварт'],
}

const HOUSE_IDENTIFIERS = 'д.|дом'
const SPLIT_SYMBOL = '%'

class AddressTransform {

    regExps = {}
    replaces = {}

    /**
     * Prepare address transformer to work with provided rule set
     * @param config
     * @returns {{errorMessage: (string|undefined), error: (string|null)}}
     */
    init (config) {
        try {
            for (const [search, replace] of Object.entries(config)) {
                if (search.startsWith('r')) {
                    this.regExps[search.slice(1)] = replace
                } else {
                    this.replaces[search] = replace
                }
            }

            return { error: null }
        } catch (error) {
            return { error: 'ADDRESS_TRANSFORM_CONFIG_MALFORMED_VALUE', errorMessage: `Malformed config ${error.message}` }
        }
    }

    apply (input) {
        if (typeof input !== 'string') {
            return input.trim()
        }
        for (const regFrom of Object.keys(this.regExps)) {
            if (this.regExps.hasOwnProperty(regFrom)) {
                const regTo = this.regExps[regFrom]
                input = input.trim().replace(new RegExp(regFrom, 'g'), regTo)
            }
        }

        for (const from of Object.keys(this.replaces)) {
            if (this.replaces.hasOwnProperty(from)) {
                input = input.trim().split(from).join(this.replaces[from])
            }
        }

        // since regExp or replaces can be written without carrying of space sequences
        // let's fold those space sequences
        return input
            .replaceAll(/\s\s\s/g, ' ')
            .replaceAll(/\s+/g, ' ')
            .trim()
    }

}

class AddressParser {

    constructor () {
        const keywordsRegex = this.keywordsToRegexp(Object.values(KEYWORDS).flat())
        this.splitRegexp = new RegExp(`(.*?[${HOUSE_IDENTIFIERS}].*?)\\s(${keywordsRegex}[.\\s].*?)`, 'i')
    }

    /**
     * @param {string[]} keyword
     * @returns {string}
     */
    keywordsToRegexp (keyword = []) {
        return keyword
            .map(keyword => keyword.replace('/', '\\/'))
            .sort((a, b) => b.length - a.length) // sort by length desc
            .join('|') // to use in regexp
    }

    /**
     * Remove trailing and starting spaces, comas, dots
     * @param {string} input
     * @returns {string}
     */
    trim (input = '') {
        if (!input) {
            return input
        }
        return input.replace(/(^[.,\s]*)|([.,\s]*$)/g, '')
    }

    /**
     * @param {string} rawString
     * @returns {{address: string, unitType: string, unitName: string}}
     */
    parse (rawString = '') {
        const { housePart: address, unitPart, fromFias = false } = this.splitToUnitAndAddress(rawString)
        const { unitName, unitType } = this.parseUnit(unitPart, fromFias)
        return {
            address,
            unitType,
            unitName,
        }
    }

    /**
     * @param {string} unitInput
     * @param {boolean} fromFias
     * @returns {{unitType: string, unitName: string}}
     */
    parseUnit (unitInput = '', fromFias = false) {
        let detectedType = null
        for (const unitType in KEYWORDS) {
            const unitTypeRegex = new RegExp(this.keywordsToRegexp(KEYWORDS[unitType]) + '[.]*', 'ig')
            if (!detectedType && unitTypeRegex.test(unitInput)) {
                detectedType = unitType
            }

            unitInput = this.trim(unitInput.replace(unitTypeRegex, '').replace(/\s+/g, ' '))
        }
        if (fromFias) {
            unitInput = this.trim(unitInput.replace(/\s+/g, ' '))
        }

        return {
            unitName: unitInput,
            unitType: detectedType || 'flat',
        }
    }

    /**
     * @param {string} input
     * @returns {{housePart: string, unitPart: string}}
     */
    splitByKeyword (input = '') {
        const [housePart, unitPart = ''] = input
            .replace(new RegExp(`[${SPLIT_SYMBOL}]`, 'g'), '')
            .replace(this.splitRegexp, `$1${SPLIT_SYMBOL}$2`)
            .split(SPLIT_SYMBOL)
        return {
            housePart: this.trim(housePart),
            unitPart: this.trim(unitPart),
        }
    }

    /**
     * @param {string} input
     * @returns {{housePart: string, unitPart: string}}
     */
    splitByComma (input = '') {
        const addressParts = input.split(',').map(part => part.trim())
        const unit = addressParts.pop()
        return {
            housePart: addressParts.join(', '),
            unitPart: unit,
        }
    }

    /**
     * @param {string} input
     * @returns {{housePart: string, unitPart: string}}
     */
    splitToUnitAndAddress (input) {
        if (input.indexOf('fiasId:') === 0) {
            const [housePart, ...unitParts] = input.split(',')
            return { housePart, unitPart: unitParts.join(','), fromFias: true }
        }
        let { housePart, unitPart } = this.splitByKeyword(input)
        if (!unitPart) {
            return this.splitByComma(input)
        }
        return { housePart, unitPart }
    }
}

module.exports = {
    AddressTransform,
    AddressParser,
}