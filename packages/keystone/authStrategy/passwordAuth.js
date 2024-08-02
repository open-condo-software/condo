const { PasswordAuthStrategy: DefaultPasswordAuthStrategy } = require('@keystonejs/auth-password')

/**
 * This is a custom authentication strategy specific to condo applications
 *
 * Based on PasswordAuthStrategy from "@keystonejs/auth-password"
 *
 * What are the differences with the main version?
 *
 * - Identity type check (disabled by default)
 * - Verification check (disabled by default)
 * - Reject deleted identity authorization (disabled by default)
 *
 * All custom features can be turned off, then there will be default authorization like in basic PasswordAuthStrategy
 *
 * These features are configurable via "config"
 *
 * @example config example
 * config = {
 *     // default props from "@keystonejs/auth-password"
 *     identityField: 'email',
 *     secretField: 'password',
 *     protectIdentities: true,
 *
 *     // custom props
 *     identityTypeField: 'type',
 *     allowedIdentityTypes: ['staff', 'service', 'resident'],
 *
 *     verificationField: 'isEmailVerified',
 *
 *     softDeleteField: 'deletedAt',
 * }
 */
class ExtendedPasswordAuthStrategy extends DefaultPasswordAuthStrategy {
    constructor (...props) {
        super(...props)

        this.config = {
            // NOTE: We do not set default values for new fields as the implementation of our applications may differ.
            // Each application is configured on its own
            //
            // verificationField: 'isEmailVerified',
            // identityTypeField: 'type',
            // allowedIdentityTypes: ['staff', 'service', 'resident'],
            // softDeleteField: 'deletedAt',

            ...this.config,
        }
    }

    async _getItem (list, args, secretFieldInstance) {
        // Match by identity
        const {
            identityField,
            identityTypeField,
            allowedIdentityTypes,
            verificationField,
            softDeleteField,
        } = this.config

        const identity = args[identityField]
        const results = await list.adapter.find({
            [identityField]: identity,
            ...(identityTypeField && Array.isArray(allowedIdentityTypes) ? { [`${identityTypeField}_in`]: allowedIdentityTypes } : null),
            ...(softDeleteField ? { [softDeleteField]: null } : null),
            ...(verificationField ? { [verificationField]: true } : null),
        })

        // > > > Next comes the original logic from @keystonejs/auth-password < < <
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
