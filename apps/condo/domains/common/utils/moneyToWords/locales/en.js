/**
 * @constant { Array } dischargesMoreThanThousand 
 * dischargesMoreThanThousand[n][0] - word root;
 * dischargesMoreThanThousand[n][1] - word root + ending for units from 5 to 9
 * dischargesMoreThanThousand[n][2] - word root + ending for 1 unit
 * dischargesMoreThanThousand[n][3] - word root + ending for units from 2 to 4
 */

const dischargesMoreThanThousand = [
    ['…n-lion', '', '', ''],
    ['thousand', '', '', ''],
    ['million', '', '', ''],
    ['billion', '', '', ''],
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
    ['zero'],
    ['-', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'],
    ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'],
    ['-', '-', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'],
    ['-', 'one hundred', 'two hundred', 'three hundred', 'four hundred', 'five hundred', 'six hundred', 'seven hundred', 'eight hundred', 'nine hundred'],
    ['-', 'one', 'two'],
]

/**
 * @constant { Array } currencyRUB
 * currencyRUB[n][0] - word root;
 * currencyRUB[n][1] - word root + ending for units from 5 to 9 and 0
 * currencyRUB[n][2] - word root + ending for 1 unit
 * currencyRUB[n][3] - word root + ending for units from 2 to 4
 */

const currencyUSD = [
    ['dollars', '', '', ''],
    ['cents', '', '', ''],
]

/**
 * @constant { 
*  currencyCode: string[][],
* } currency 
*/

const supportedCurrencies = {
    'USD': currencyUSD,
}

const texts = {
    minus: 'minus',
}

module.exports = {
    dischargesMoreThanThousand,
    dischargesLessThanThousand,
    supportedCurrencies,
    texts,
}