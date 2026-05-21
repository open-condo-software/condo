async function canGetVoIPCallStatus ({ authentication: { item: user } }) {
    // NOTE(YEgorLu): anyone can call query, because mobile app does not always has authorized context.
    // To actually gain access you must deliver the right key and password for entity in cache
    return true
}

module.exports = {
    canGetVoIPCallStatus,
}