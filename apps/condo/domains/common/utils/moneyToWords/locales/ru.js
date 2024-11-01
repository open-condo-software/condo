/**
 * @constant { Array } bigDischarges 
 * bigDischarges[n][0] - word root;
 * bigDischarges[n][1] - word root + ending for units from 5 to 9
 * bigDischarges[n][2] - word root + ending for 1 unit
 * bigDischarges[n][3] - word root + ending for units from 2 to 4
 */

const bigDischarges = [
    ['…n-лион', 'ов', '', 'а'],
    ['тысяч', '', 'а', 'и'],
    ['миллион', 'ов', '', 'а'],
    ['миллиард', 'ов', '', 'а'],
]

/**
 * @constant { Array } smallDischarges
 * smallDischarges[0][0] - zero units
 * smallDischarges[1][n] - units from 1 to 9
 * smallDischarges[2][n] - two-digit numbers from 10 to 19
 * smallDischarges[3][n] - tens from 20 to 90
 * smallDischarges[4][n] - hundreds from 100 to 900
 * smallDischarges[5][n] - declensions of one and two
 */

const smallDischarges = [
    ['ноль'],
    ['-', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'],
    ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'],
    ['-', '-', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'],
    ['-', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'],
    ['-', 'одна', 'две'],
]

/**
 * @constant { Array } currencyRUB
 * currencyRUB[n][0] - word root;
 * currencyRUB[n][1] - word root + ending for units from 5 to 9 and 0
 * currencyRUB[n][2] - word root + ending for 1 unit
 * currencyRUB[n][3] - word root + ending for units from 2 to 4
 */

const currencyRUB = [
    ['рубл', 'ей', 'ь', 'я'],
    ['копе', 'ек', 'йка', 'йки'],
]

/**
 * @constant { 
*  currencyCode: string[][],
* } currency 
*/

const currency = {
    'RUB': currencyRUB,
}

module.exports = {
    bigDischarges,
    smallDischarges,
    currency,
}