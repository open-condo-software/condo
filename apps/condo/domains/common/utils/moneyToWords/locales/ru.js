/**
 * @constant { Array } dischargesMoreThanThousand 
 * dischargesMoreThanThousand[n][0] - word root;
 * dischargesMoreThanThousand[n][1] - word root + ending for units from 5 to 9
 * dischargesMoreThanThousand[n][2] - word root + ending for 1 unit
 * dischargesMoreThanThousand[n][3] - word root + ending for units from 2 to 4
 */

const dischargesMoreThanThousand = [
    ['…n-лион', 'ов', '', 'а'],
    ['тысяч', '', 'а', 'и'],
    ['миллион', 'ов', '', 'а'],
    ['миллиард', 'ов', '', 'а'],
    ['триллион', 'ов', '', 'а'], 
]

/**
 * @constant { Array } dischargesLessThanThousand
 * dischargesLessThanThousand[0][0] - zero units
 * dischargesLessThanThousand[1][n] - units from 1 to 9
 * dischargesLessThanThousand[2][n] - two-digit numbers from 10 to 19
 * dischargesLessThanThousand[3][n] - tens from 20 to 90
 * dischargesLessThanThousand[4][n] - hundreds from 100 to 900
 * dischargesLessThanThousand[5][n] - declensions of one and two
 */

const dischargesLessThanThousand = [
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

const supportedCurrencies = {
    'RUB': currencyRUB,
}

const texts = {
    minus: 'минус',
}

module.exports = {
    dischargesMoreThanThousand,
    dischargesLessThanThousand,
    supportedCurrencies,
    texts,
}