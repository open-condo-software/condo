/**
 * @typedef {Object} MessageHooksAttrs
 * @property {number} dv
 * @property {{dv: number, fingerprint: string}} sender
 * @property {string} status
 * @property {string} type
 * @property {Object} meta
 * @property {string} lang
 * @property {string} [emailFrom]
 * @property {string} [uniqKey]
 * @property {OrganizationRelateToOneInput} [organization]
 * @property {string} [email]
 * @property {string} [phone]
 * @property {UserRelateToOneInput} [user]
 */

/**
 * @abstract
 * @class
 */
class AbstractMessageTypesHooks {
    /**
     * @constructor
     * @param {MessageHooksAttrs} messageAttrs
     */
    constructor (messageAttrs) {
        /** @type {MessageHooksAttrs} */
        this.messageAttrs = messageAttrs
    }

    /**
     * Called before creating the Message model, defines should the message be created or not
     * @returns {boolean | Promise<boolean>}
     */
    shouldSend () {
        return true
    }
}

module.exports = { AbstractHooks: AbstractMessageTypesHooks }
