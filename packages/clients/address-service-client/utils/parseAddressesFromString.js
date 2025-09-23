const KEYWORDS = {
    parking: ['автоместо', 'парковка', 'паркинг', 'машиноместо', 'гараж', 'м/м', 'мм', 'место', 'м/место', 'а/м', 'бокс', 'парк'],
    apartment: ['аппарт', 'апарт', 'ап', 'к/п'],
    commercial: ['офис', 'оф'],
    warehouse: ['помещение', 'подвал', 'помещ', 'пом', 'кл', 'кладовка', 'кладовая', 'нп'],
    flat: ['квартира', 'кв', 'комн'],
}

const HOUSE_IDENTIFIERS = 'д|уч|дом|участок|двлд'
const SPLIT_SYMBOL = '%'
const UUID_REGEXP = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i

class AddressFromStringParser {

    constructor () {
        const keywordsRegex = this.keywordsToRegexp(Object.values(KEYWORDS).flat())
        this.splitRegexp = new RegExp(`[\\s,](${HOUSE_IDENTIFIERS})([\\s.].*?)[\\s,]+(${keywordsRegex})[.\\s]`, 'i')
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
        return input.replace(/^[.,\s]*|[.,\s]*$/g, '') // NOSONAR
    }

    /**
     * @param {string} rawString
     * @returns {{address: string, unitType: string, unitName: string}}
     */
    parse (rawString = '') {
        if (UUID_REGEXP.test(rawString)) {
            rawString = `${rawString},`
        }
        
        const { housePart: address, unitPart } = this.splitToUnitAndAddress(rawString)
        const { unitName, unitType } = this.parseUnit(unitPart)
        return {
            address,
            unitType,
            unitName,
        }
    }

    /**
     * @param {string} unitInput
     * @returns {{unitType: string, unitName: string}}
     */
    parseUnit (unitInput = '') {
        let detectedType = null
        for (const unitType in KEYWORDS) {
            const unitTypeRegex = new RegExp(this.keywordsToRegexp(KEYWORDS[unitType]) + '[.]*', 'ig')
            if (!detectedType && unitTypeRegex.test(unitInput)) {
                detectedType = unitType
            }
            unitInput = this.trim(unitInput.replace(unitTypeRegex, '').replace(/\s+/g, ' '))
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
            .replace(this.splitRegexp, ` $1$2${SPLIT_SYMBOL}$3`)
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
            unitPart: unit || '1',
        }
    }

    /**
     * @param {string} input
     * @returns {{housePart: string, unitPart: string}}
     */
    splitToUnitAndAddress (input) {
        const { housePart, unitPart } = this.splitByKeyword(input)
        if (!unitPart) {
            const houseInTheEndRegexp = new RegExp(`[.\\s](${HOUSE_IDENTIFIERS})([.\\s]+)([0-9А-Я/\\\\]+)$`, 'i')
            input = input.replace(houseInTheEndRegexp, ' $1$2$3, кв. 1')
            return this.splitByComma(input)
        }
        return { housePart, unitPart }
    }
}

const parseAddressesFromString = (addresses = []) => {
    const parser = new AddressFromStringParser()
    return addresses.map(source => ({ source, result: parser.parse(source) }))
}

module.exports = {
    AddressFromStringParser,
    parseAddressesFromString,
}
