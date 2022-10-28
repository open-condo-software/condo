const { WebHookModelValidator } = require('./validator')

// NOTE: Used as global var to store app validator
let CURRENT_VALIDATOR = null

function getModelValidator () {
    return CURRENT_VALIDATOR
}

function setModelValidator (validator) {
    CURRENT_VALIDATOR = validator
}

module.exports = {
    WebHookModelValidator,
    getModelValidator,
    setModelValidator,
}