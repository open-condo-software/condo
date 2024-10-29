const bigDischarges = [
    ['…n-лион', '', '', ''],
    ['Thousand', '', '', ''],
    ['Million', '', '', ''],
    ['Billion', '', '', ''],
]

const smallDischarges = [
    ['zero'],
    ['-', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'],
    ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'],
    ['-', '-', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'],
    ['-', 'One Hundred', 'Two Hundred', 'Three Hundred', 'Four Hundred', 'Five Hundred', 'Six Hundred', 'Seven Hundred', 'Eight Hundred', 'Nine Hundred'],
    ['-', 'One', 'Two'],
]

const currency = [
    ['dollar', 's', '', 's'],
    ['cent', 's', '', 's'],
]

module.exports = {
    bigDischarges,
    smallDischarges,
    currency,
}