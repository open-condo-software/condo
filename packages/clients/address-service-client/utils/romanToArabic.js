const ROMAN_NUMERALS = {
    'M': 1000,
    'CM': 900,
    'D': 500,
    'CD': 400,
    'C': 100,
    'XC': 90,
    'L': 50,
    'XL': 40,
    'X': 10,
    'IX': 9,
    'V': 5,
    'IV': 4,
    'I': 1,
}

// intellij throws warning that "\p{P}" regexp is not supported, but it works
const SEPARATE_ROMANIAN_SYMBOLS_REGEXP = /(?<![^\s\p{P}\p{N}])([IVXLCDM]+)(?![^\s\p{P}\p{N}])/gi

function convertRomanToArabic (romanString) {
    romanString = romanString.toUpperCase()
    let arabic = 0
    let i = 0

    while (i < romanString.length) {
        const currentSymbol = romanString[i]
        const nextSymbol = romanString[i + 1]

        if (ROMAN_NUMERALS[currentSymbol + nextSymbol]) {
            arabic += ROMAN_NUMERALS[currentSymbol + nextSymbol]
            i += 2
        } else {
            arabic += ROMAN_NUMERALS[currentSymbol]
            i += 1
        }
    }

    return arabic
}

function detectRomanNumerals (str) {
    const pattern = SEPARATE_ROMANIAN_SYMBOLS_REGEXP.source
    const flags = [...new Set(SEPARATE_ROMANIAN_SYMBOLS_REGEXP.flags)].join('')
    const regexp = new RegExp(pattern, flags)

    let result = []
    let match = regexp.exec(str)
    while (match !== null) {
        const roman = match[1]
        const { index } = match
        result.push({
            index,
            value: roman,
        })
        match = regexp.exec(str)
    }

    return result
}

function replaceRomanWithArabicNumbers (str, excludedSymbols) {
    let regexp = SEPARATE_ROMANIAN_SYMBOLS_REGEXP
    if (excludedSymbols) {
        const toExclude = new Set(excludedSymbols)
        const source = regexp.source
            .split('')
            .filter(symb => !toExclude.has(symb.toLowerCase()) && !toExclude.has(symb.toUpperCase()))
            .join('')
        regexp = new RegExp(source, regexp.flags)
    }
    return str.replace(regexp, (match) => convertRomanToArabic(match))
}



module.exports = {
    convertRomanToArabic,
    replaceRomanWithArabicNumbers,
    detectRomanNumerals,
}