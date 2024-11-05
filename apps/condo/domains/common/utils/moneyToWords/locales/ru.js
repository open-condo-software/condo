/**
 * @constant { Array } dischargesMoreThanThousand 
 * dischargesMoreThanThousand[n][0] - word root;
 * dischargesMoreThanThousand[n][1] - word root + ending for units from 5 to 9
 * dischargesMoreThanThousand[n][2] - word root + ending for 1 unit
 * dischargesMoreThanThousand[n][3] - word root + ending for units from 2 to 4
 */

const dischargesMoreThanThousand  = {
    '0': ['…n-лион', 'ов', '', 'а'],
    '1000^1': ['тысяч', '', 'а', 'и'],
    '1000^2': ['миллион', 'ов', '', 'а'],
    '1000^3': ['миллиард', 'ов', '', 'а'],
    '1000^4': ['триллион', 'ов', '', 'а'], 
}

const dischargesLessThanThousand = {
    'Zero': ['ноль'],
    'Units': ['-', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'],
    'FirstDozen': ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'],
    'Dozens': ['-', '-', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'],
    'Hundreds': ['-', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'],
    'SpecialUnits': ['-', 'одна', 'две'],
}

/**
 * @constant { Array } dischargesLessThanThousand
 * dischargesLessThanThousand[0][0] - zero units
 * dischargesLessThanThousand[1][n] - units from 1 to 9
 * dischargesLessThanThousand[2][n] - two-digit numbers from 10 to 19
 * dischargesLessThanThousand[3][n] - tens from 20 to 90
 * dischargesLessThanThousand[4][n] - hundreds from 100 to 900
 * dischargesLessThanThousand[5][n] - declensions of one and two
 */

// const dischargesLessThanThousand = {
//     'Zero': ['ноль'],
//     'Units': ['-', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'],
//     'FirstDozen': ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'],
//     'Dozens': ['-', '-', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'],
//     'Hundreds': ['-', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'],
//     'SpecialUnits': ['-', 'одна', 'две'],
// }

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