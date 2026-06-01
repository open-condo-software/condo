async function canSendDTMFToB2CApp () {
    // Mobile app does not always has authorization for request in context of push messages, so it is better to make access as wide as possible
    // It should be okay to allow access for everyone, as mutation requires data in redis, which is stored only for a few minutes
    return true
}

module.exports = {
    canSendDTMFToB2CApp,
}