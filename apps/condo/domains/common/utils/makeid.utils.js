const { sample } = require('lodash')

function makeId(length) {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < length; i++) {
        result += sample(characters)
    }
    return result
}

module.exports = {
    makeId,
}
