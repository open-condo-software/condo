const SPECIAL_CHARS_REGEXP = /\W|_/g //It also includes characters of the Russian alphabet
const RUSSIAN_ALPHABET_REGEXP = /[а-яё]/i
const DIGIT_REGEXP = /\d/

const isLetter = (char: string) => (!char.match(DIGIT_REGEXP) &&
    (!char.match(SPECIAL_CHARS_REGEXP) || char.match(RUSSIAN_ALPHABET_REGEXP)))

export const isValidName = (name?: string): boolean => {
    if (!name)
        return false
    const normalizedName = name.trim()
    return Array.from(normalizedName).some(isLetter)
}