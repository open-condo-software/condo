const NOT_USED_WORDS_IN_ACCOUNT_NUMBER_REGEXP = /(л\/с|лс|№)/gi
const FIO_REGEXP = /^[А-ЯЁ][а-яё]*([-' .][А-ЯЁ][а-яё]*){0,2}\s+[IVА-ЯЁ][a-zа-яё.]*([- .'ёЁ][IVА-ЯЁ][a-zа-яё.]*)*$/
const FIO_ENDINGS = 'оглы|кызы'
const FIAS_REGEXP = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}.*$/i

const clearAccountNumber = (accountNumber = '') => String(accountNumber).replace(NOT_USED_WORDS_IN_ACCOUNT_NUMBER_REGEXP, '').trim()

const replaceSameEnglishLetters = (input) => {
    const replacements = {
        'a': 'а', 'b': 'б', 'c': 'с', 'e': 'е', 'h': 'н', 'k': 'к', 'm': 'м',
        'o': 'о', 'p': 'р', 't': 'т', 'x': 'х', 'y': 'у',
    }
    return input.replace(/[a-zA-Z]/g, (match) => {
        const replacement = replacements[match.toLowerCase()]
        if (replacement) {
            if (match === match.toUpperCase()) {
                return replacement.toUpperCase()
            }
            return replacement
        }
        return match
    })
}

const isPerson = (fullName) => {
    let [input] = fullName.split(new RegExp(`\\s(${FIO_ENDINGS})$`))
    input = replaceSameEnglishLetters(input).replace(/([А-ЯЁ])([А-ЯЁ]+)/gu,
        (match, firstChar, restOfString) => firstChar + restOfString.toLowerCase()
    )
    return FIO_REGEXP.test(input)
}

const isValidFias = (fias = '') => FIAS_REGEXP.test(fias)


module.exports = {
    clearAccountNumber,
    isPerson,
    isValidFias,
}