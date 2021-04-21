async function canSendMessage ({ authentication: { item: user } }) {
    if (!user) return false
    if (user.isAdmin) return true
    return false
}

module.exports = {
    canSendMessage,
}
