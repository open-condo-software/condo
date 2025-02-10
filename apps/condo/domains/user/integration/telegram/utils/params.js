const crypto = require('crypto')

const getUniqueKey = () => {
    const randomPart = crypto.randomBytes(32).toString('hex')
    return crypto.createHmac('sha256', 'secret').update(randomPart).digest('hex')
}

module.exports = {
    getUniqueKey,
}