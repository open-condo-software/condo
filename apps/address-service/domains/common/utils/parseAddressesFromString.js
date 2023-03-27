const KEYWORDS = {
    parking: ['автоместо', 'парковка', 'паркинг', 'машиноместо', 'гараж', 'м/м', 'мм', 'место', 'м/место', 'а/м', 'бокс', 'парк'],
    apartment: ['аппарт', 'апарт', 'ап'],
    commercial: ['офис', 'оф'],
    warehouse: ['помещение', 'подвал', 'помещ', 'пом', 'кл'],
    flat: ['квартира', 'кв', 'комн'],
}

const HOUSE_IDENTIFIERS = 'д.|дом'
const SPLIT_SYMBOL = '%'

class AddressFromStringParser {

    splitRegexp

    constructor () {
        const keywordsRegex = this.keywordsToRegexp(Object.values(KEYWORDS).flat())
        this.splitRegexp = new RegExp(`(.*?[${HOUSE_IDENTIFIERS}].*?)\\s(${keywordsRegex}[.\\s].*?)`, 'i')
    }

    keywordsToRegexp (keyword = []) {
        return keyword.map(keyword => keyword.replace('/', '\\/'))
            .sort((a, b) => b.length - a.length) // sort by length desc
            .join('|') // to use in regexp
    }

    // remove trailing and starting spaces, comas, dots
    trim (input = '') {
        if (!input) {
            return input
        }
        return input.replace(/^[.,\s]*|[.,\s]*$/g, '')
    }

    parse (rawString = '') {
        const { housePart: address, unitPart } = this.splitToUnitAndAddress(rawString)
        const { unit, unitType } = this.parseUnit(unitPart)
        return {
            address,
            unit,
            unitType,
        }
    }

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
            unit: unitInput,
            unitType: detectedType || 'flat',
        }
    }

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

    splitByComma (input = '') {
        const addressParts = input.split(',').map(part => part.trim())
        const unit = addressParts.pop()
        return {
            housePart: addressParts.join(', '),
            unitPart: unit,
        }
    }

    splitToUnitAndAddress (input) {
        const { housePart, unitPart } = this.splitByKeyword(input)
        if (!unitPart) {
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
