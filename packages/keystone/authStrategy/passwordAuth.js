const { PasswordAuthStrategy: DefaultPasswordAuthStrategy } = require('@keystonejs/auth-password')

/**
 * This is a custom authentication strategy specific to condo applications
 *
 * Based on PasswordAuthStrategy from "@keystonejs/auth-password"
 *
 * What are the differences with the main version?
 *
 * - User type check (disabled by default)
 * - Verification check (disabled by default)
 * - Reject deleted user authorization (enabled by default)
 *
 * All custom features can be turned off, then there will be default authorization like in basic PasswordAuthStrategy
 *
 * These features are configurable via "config"
 *
 * @example config example
 * config = {
 *     // defaults props from "@keystonejs/auth-password"
 *     identityField: 'email',
 *     secretField: 'password',
 *     protectIdentities: true,
 *
 *     // custom props
 *     itemTypeField: 'type',
 *     itemTypeOptions: ['staff', 'service', 'resident'],
 *     itemTypeDefault: 'staff',
 *
 *     verificationField: 'isEmailVerified',
 *
 *     rejectSoftDeletedItems: true,
 * }
 */
class ExtendedPasswordAuthStrategy extends DefaultPasswordAuthStrategy {
    constructor (...props) {
        super(...props)

        this.config = {
            // NOTE: We do not set default values for new fields as the implementation of our applications may differ.
            // We should configure each application yourself as we need.
            //
            // itemTypeField: 'type',
            // itemTypeOptions: ['staff', 'service', 'resident'],
            // itemTypeDefault: 'staff',
            //
            // verificationField: 'isEmailVerified',

            rejectSoftDeletedItems: true,

            ...this.config,
        }
    }

    getInputFragment () {
        const itemTypeField = this.config.itemTypeField
            ? `${this.config.itemTypeField}: String`
            : ''

        return `
          ${this.config.identityField}: String
          ${this.config.secretField}: String
          ${itemTypeField}
        `
    }

    async validate (args) {
        const { itemTypeField, itemTypeOptions, itemTypeDefault } = this.config
        const itemType = args[itemTypeField] || itemTypeDefault || null

        if (Boolean(itemTypeField) && Array.isArray(itemTypeOptions) && !itemTypeOptions.includes(itemType)) {
            const message = `[passwordAuth:itemType:invalid] The ${itemTypeField} contains an invalid value. It must be one of the following: ${itemTypeOptions.join(', ')}`
            return { success: false, message }
        }

        return await super.validate(args)
    }

    async _getItem (list, args, secretFieldInstance) {
        // Match by identity
        const {
            identityField,
            itemTypeField,
            itemTypeOptions,
            itemTypeDefault,
            verificationField,
            rejectSoftDeletedItems,
        } = this.config

        const identity = args[identityField]
        const itemType = args[itemTypeField] || itemTypeDefault || null
        const results = await list.adapter.find({
            [identityField]: identity,
            ...(itemTypeField && Array.isArray(itemTypeOptions) ? { [itemTypeField]: itemType } : null),
            ...(rejectSoftDeletedItems ? { deletedAt: null } : null),
            ...(verificationField ? { [verificationField]: true } : null),
        })

        // * * * Next comes the original logic * * *
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
