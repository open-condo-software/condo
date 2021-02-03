const { HiddenRelationship } = require('./HiddenRelationship')

const composeHook = (originalHook, newHook) => async params => {
    let { resolvedData } = params
    if (originalHook) {
        resolvedData = await originalHook(params)
    }
    return newHook({ ...params, resolvedData })
}

function isValidDate (date) {
    return date && Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date)
}

module.exports = {
    HiddenRelationship,
    composeHook,
    isValidDate,
}
