const bigDischarges = [
    ['…n-лион', '', '', ''],
    ['thousand', '', '', ''],
    ['million', '', '', ''],
    ['billion', '', '', ''],
]

const smallDischarges = [
    ['zero'],
    ['-', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'],
    ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'],
    ['-', '-', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'],
    ['-', 'one hundred', 'two hundred', 'three hundred', 'four hundred', 'five hundred', 'six hundred', 'seven hundred', 'eight hundred', 'nine hundred'],
    ['-', 'one', 'two'],
]

const currencyUSD = [
    ['dollars', '', '', ''],
    ['cent', 's', '', 's'],
]

const currency = {
    'USD': currencyUSD,
}

module.exports = {
    bigDischarges,
    smallDischarges,
    currency,
}