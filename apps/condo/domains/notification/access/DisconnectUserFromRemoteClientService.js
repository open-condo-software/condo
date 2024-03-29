/**
 * Generated by `createservice notification.DisconnectUserFromRemoteClientService --type mutations`
 */

/**
 * Manages DisconnectUserFromRemoteClientService access rights.
 * Service can be accessed by both unauthorized and authorized users.
 * Only deviceId and pushTransport fields are required to disconnect any user from known device successfully.
 * @param data
 * @returns {Promise<boolean>}
 */
async function canDisconnectUserFromRemoteClient ({ authentication: { item: user } }) {
    if (user && user.deletedAt) return false

    return true
}

/*
  Rules are logical functions that used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items.
*/
module.exports = {
    canDisconnectUserFromRemoteClient,
}