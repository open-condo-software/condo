const KEYWORDS = {
    parking: ['автоместо', 'парковка', 'паркинг', 'машиноместо', 'гараж', 'м/м', 'мм', 'место', 'м/место', 'а/м', 'бокс', 'парк'],
    apartment: ['аппарт', 'апарт', 'ап', 'к/п'],
    commercial: ['офис', 'оф'],
    warehouse: ['помещение', 'подвал', 'помещ', 'пом', 'кладовка', 'кладовая', 'клад', 'кл', 'нп'],
    flat: ['квартира', 'кв', 'комн'],
}

const EXPLICIT_KEYWORDS = {
    ...KEYWORDS,
    flat: [...KEYWORDS.flat, 'ком', 'комната'],
    warehouse: [...KEYWORDS.warehouse, 'н/п'],
}
const HOUSE_IDENTIFIERS = 'д|уч|дом|участок|двлд'
const SPLIT_SYMBOL = '%'
const UUID_REGEXP = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const KEYWORD_TOKEN_PREFIX = String.raw`(?<![\p{L}\p{N}])`
const KEYWORD_TOKEN_SUFFIX_DETECT = String.raw`(?=(?:\.|[^\p{L}\p{N}]|$|\d))`
const KEYWORD_TOKEN_SUFFIX_REMOVE = String.raw`(?:(?:\.)|(?=[^\p{L}\p{N}]|$))`

class AddressFromStringParser {

    constructor () {
        const keywordsRegex = this.keywordsToRegexp(Object.values(KEYWORDS).flat())
        this.splitRegexp = new RegExp(String.raw`[\s,](${HOUSE_IDENTIFIERS})([\s.].*?)[\s,]+(${keywordsRegex})([.\s])`, 'i')
    }

    /**
     * @param {string[]} keyword
     * @returns {string}
     */
    keywordsToRegexp (keyword = []) {
        return keyword
            .map((keyword) => this.escapeRegExp(keyword))
            .sort((a, b) => b.length - a.length) // sort by length desc
            .join('|') // to use in regexp
    }

    escapeRegExp (input = '') {
        return String(input).replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    buildKeywordDetectRegexp (keywordPattern = '') {
        const safeKeywordPattern = typeof keywordPattern === 'string' ? keywordPattern : ''
        // keywordPattern is derived only from static KEYWORDS and escaped via escapeRegExp().
        // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
        return new RegExp(String.raw`${KEYWORD_TOKEN_PREFIX}(?:${safeKeywordPattern})${KEYWORD_TOKEN_SUFFIX_DETECT}`, 'iu')
    }

    buildKeywordRemoveRegexp (keywordPattern = '') {
        const safeKeywordPattern = typeof keywordPattern === 'string' ? keywordPattern : ''
        // keywordPattern is derived only from static KEYWORDS and escaped via escapeRegExp().
        // nosemgrep: javascript.lang.security.audit.detect-non-literal-regexp.detect-non-literal-regexp
        return new RegExp(String.raw`${KEYWORD_TOKEN_PREFIX}(?:${safeKeywordPattern})${KEYWORD_TOKEN_SUFFIX_REMOVE}`, 'giu')
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
        let normalized = String(input).trim()
        while (normalized.startsWith('.') || normalized.startsWith(',')) {
            normalized = normalized.slice(1).trimStart()
        }
        while (normalized.endsWith('.') || normalized.endsWith(',')) {
            normalized = normalized.slice(0, -1).trimEnd()
        }
        return normalized
    }

    /**
     * @param {string} rawString
     * @returns {{address: string, unitType: string, unitName: string}}
     */
    parse (rawString = '') {
        if (isAddressUUID(rawString)) {
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
            const keywordPattern = this.keywordsToRegexp(KEYWORDS[unitType])
            // Detect by token and also by glued keyword+number cases (e.g. НП10).
            // Remove only full keyword tokens to avoid aggressive substring cleanup.
            const unitTypeDetectRegexp = this.buildKeywordDetectRegexp(keywordPattern)
            if (!detectedType && unitTypeDetectRegexp.test(unitInput)) {
                detectedType = unitType
            }
            const unitTypeRemoveRegexp = this.buildKeywordRemoveRegexp(keywordPattern)
            unitInput = unitInput.replaceAll(unitTypeRemoveRegexp, '')
            unitInput = this.normalizeUnitName(unitInput)
        }
        return {
            unitName: unitInput,
            unitType: detectedType || 'flat',
        }
    }

    normalizeUnitName (input = '') {
        let normalized = String(input)
        normalized = normalized
            .split('(')
            .map((part, index) => (index === 0 ? part : part.trimStart()))
            .join('(')
            .split(')')
            .map((part, index, arr) => (index === arr.length - 1 ? part : part.trimEnd()))
            .join(')')
            .replaceAll(/\s+/g, ' ')
        return this.trim(normalized)
    }

    /**
     * @param {string} input
     * @returns {{housePart: string, unitPart: string}}
     */
    splitByKeyword (input = '') {
        const [housePart, unitPart = ''] = input
            .replaceAll(SPLIT_SYMBOL, '')
            .replace(this.splitRegexp, ` $1$2${SPLIT_SYMBOL}$3$4`)
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

    parseExplicit (input) {
        // Only split on a classified unit marker. The legacy parser also treats the last comma
        // segment as a unit and can synthesize flat 1, which is unsuitable for normalization.
        const parts = input.split(',').map(part => part.trim()).filter(Boolean)
        const keywords = Object.values(EXPLICIT_KEYWORDS).flat()
        const unitMarker = new RegExp(String.raw`^(?:${this.keywordsToRegexp(keywords)})(?:\.\s*|\s+|(?=\d|$))`, 'iu')
        const inlineUnit = new RegExp(String.raw`\s+(?:${this.keywordsToRegexp(keywords)})(?:\.\s*|\s+|(?=\d|$))`, 'iu')
        const building = new RegExp(String.raw`(?:^|\s)(?:${HOUSE_IDENTIFIERS})(?:\.\s*|\s+|(?=\d))\d`, 'iu')
        const houseParts = []
        const unitParts = []
        let hasUnit = false
        let hasBuilding = false

        for (const part of parts) {
            const buildingMatch = part.match(building)
            const afterBuilding = buildingMatch ? buildingMatch.index + buildingMatch[0].length : 0
            const inlineMatch = buildingMatch ? part.slice(afterBuilding).search(inlineUnit) : -1
            const inlineIndex = inlineMatch >= 0 ? afterBuilding + inlineMatch : -1
            if (inlineIndex >= 0) {
                houseParts.push(part.slice(0, inlineIndex))
                unitParts.push(part.slice(inlineIndex).trim())
                hasUnit = true
            } else if (unitMarker.test(part) || ((hasBuilding || hasUnit) && /^(?:№\s*)?\d+[а-яёa-z]*(?:[/-][\dа-яёa-z]+)*\)?$/iu.test(part))
                || (hasUnit && /^(?:(?:этаж|подъезд|секция)(?:\.|\s|№)|мансарда|подвал)/iu.test(part))) {
                unitParts.push(part)
                hasUnit = true
            } else {
                houseParts.push(part)
            }
            hasBuilding ||= Boolean(buildingMatch)
        }

        const unit = unitParts.join(', ')
        const { unitType, unitName } = this.parseUnitDescription(unit)
        return { address: houseParts.join(', '), unitType, unitName, hasUnit }
    }

    parseUnitDescription (unit) {
        const matches = Object.entries(EXPLICIT_KEYWORDS).map(([type, keywords]) => {
            const pattern = this.keywordsToRegexp(keywords)
            const marker = new RegExp(String.raw`^(?:${pattern})(?:\.\s*|\s+|(?=\d|$))`, 'iu')
            return { type, match: unit.match(marker)?.[0] || '' }
        })
        const { type, match } = matches.reduce((longest, item) => item.match.length > longest.match.length ? item : longest)
        return {
            unitName: this.normalizeUnitName(unit.slice(match.length).replace(/^№\s*/, '')) || null,
            unitType: match ? type : null,
        }
    }

    /**
     * @param {string} input
     * @returns {{housePart: string, unitPart: string}}
     */
    splitToUnitAndAddress (input) {
        const { housePart, unitPart } = this.splitByKeyword(input)
        if (!unitPart) {
            const houseInTheEndRegexp = new RegExp(String.raw`[.\s](${HOUSE_IDENTIFIERS})([.\s]+)([0-9А-Я/\\]+)$`, 'i')
            input = input.replace(houseInTheEndRegexp, ' $1$2$3, кв. 1')
            return this.splitByComma(input)
        }
        return { housePart, unitPart }
    }
}

const isAddressUUID = value => UUID_REGEXP.test(value)

const parseAddressesFromString = (addresses = []) => {
    const parser = new AddressFromStringParser()
    return addresses.map(source => ({ source, result: parser.parse(source) }))
}

module.exports = {
    AddressFromStringParser,
    isAddressUUID,
    parseAddressesFromString,
}
