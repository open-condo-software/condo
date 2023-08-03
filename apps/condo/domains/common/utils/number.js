import isInteger from 'lodash/isInteger'

const MAX_32BIT_INTEGER = 2147483647
const MIN_32BIT_INTEGER = -2147483648

const is32BitInteger = (data) => {
    const num = Number(data)

    return Boolean(isInteger(num) && num >= MIN_32BIT_INTEGER && num <= MAX_32BIT_INTEGER)
}

module.exports = {
    is32BitInteger,
    MAX_32BIT_INTEGER,
    MIN_32BIT_INTEGER,
}