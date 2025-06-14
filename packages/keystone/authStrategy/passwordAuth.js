const { PasswordAuthStrategy: DefaultPasswordAuthStrategy } = require('@open-keystone/auth-password')

/**
 * @typedef AuthStrategyConfig
 * @property {string} identityField
 * @property {string} secretField
 * @property {boolean} protectIdentities
 * @property {findIdentityItems} findIdentityItems - Find identity items to authorize
 */

/**
 * Find identity items to authorize
 *
 * You can override this behavior if you need additional checks
 *
 * @example Default use
 * async (config, list, args) => {
 *     const { identityField } = config
 *     const identity = args[identityField]
 *     return await list.adapter.find({ [identityField]: identity })
 * }
 *
 * @async
 * @function findIdentityItems
 * @param {AuthStrategyConfig} config - auth strategy config
 * @param list - list with identity items
 * @param args - arguments passed in the request
 * @return {Promise<any[]>}
 */

/**
 *
 * @param keystone
 * @param {string} listKey
 * @param {AuthStrategyConfig} config
 * @param restProps
 *
 * @description
 * This is a custom authentication strategy specific to condo applications
 *
 * Based on PasswordAuthStrategy from "@open-keystone/auth-password"
 *
 * What are the differences with the main version?
 *
 * - Custom function for finding of identity items
 *
 * @example config example
 * config = {
 *     // default props from "@open-keystone/auth-password"
 *     identityField: 'email',
 *     secretField: 'password',
 *     protectIdentities: true,
 *
 *     // custom props
 *     findIdentityItems: async function (config, list, args) {
 *         const { identityField } = config
 *         const identity = args[identityField]
 *         return await list.adapter.find({
 *             [identityField]: identity,
 *             deletedAt: null,
 *         })
 *     },
 * }
 */
class ExtendedPasswordAuthStrategy extends DefaultPasswordAuthStrategy {
    async _getItem (list, args, secretFieldInstance) {
        // Match by identity
        const { identityField, findIdentityItems } = this.config
        const identity = args[identityField]

        const results = findIdentityItems
            ? await findIdentityItems(this.config, list, args)
            : await list.adapter.find({ [identityField]: identity })



        // > > > Next comes the original logic from @open-keystone/auth-password < < <
        //
        //
        //
        // If we failed to match an identity and we're protecting existing identities then combat timing
        // attacks by creating an arbitrary hash (should take about as long has comparing an existing one)
        if (results.length !== 1 && this.config.protectIdentities) {
            // TODO: This should call `secretFieldInstance.compare()` to ensure it's
            // always consistent.
            // This may still leak if the workfactor for the password field has changed
            const hash = await secretFieldInstance.generateHash(
                'simulated-password-to-counter-timing-attack'
            )
            await secretFieldInstance.compare('', hash)
            return { success: false, message: '[passwordAuth:failure] Authentication failed' }
        }

        // Identity failures with helpful errors
        if (results.length === 0) {
            const key = '[passwordAuth:identity:notFound]'
            const message = `${key} The ${identityField} provided didn't identify any ${list.plural}`
            return { success: false, message }
        }
        if (results.length > 1) {
            const key = '[passwordAuth:identity:multipleFound]'
            const message = `${key} The ${identityField} provided identified ${results.length} ${list.plural}`
            return { success: false, message }
        }
        const item = results[0]
        return { success: true, item }
    }
}


module.exports = { ExtendedPasswordAuthStrategy }
