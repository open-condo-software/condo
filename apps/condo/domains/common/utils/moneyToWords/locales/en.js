/**
 * @constant { Array } bigDischarges 
 * bigDischarges[n][0] - word root;
 * bigDischarges[n][1] - word root + ending for units from 5 to 9
 * bigDischarges[n][2] - word root + ending for 1 unit
 * bigDischarges[n][3] - word root + ending for units from 2 to 4
 */

const bigDischarges = [
    ['…n-lion', '', '', ''],
    ['thousand', '', '', ''],
    ['million', '', '', ''],
    ['billion', '', '', ''],
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

// TODO: add case processing with one dollar

const currencyUSD = [
    ['dollars', '', '', ''],
    ['cents', '', '', ''],
]

/**
 * @constant { 
*  currencyCode: string[][],
* } currency 
*/

const currency = {
    'USD': currencyUSD,
}


module.exports = {
    bigDischarges,
    smallDischarges,
    currency,
}