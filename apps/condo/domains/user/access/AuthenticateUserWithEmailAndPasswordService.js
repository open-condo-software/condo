/**
 * Generated by `createservice user.AuthenticateUserWithEmailAndPasswordService --type mutations`
 */

/**
 * Authorization are available to any user
 */
async function canAuthenticateUserWithEmailAndPassword () {
    return true
}

/*
  Rules are logical functions that used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items.
*/
module.exports = {
    canAuthenticateUserWithEmailAndPassword,
}