const { IDP_TYPES } = require('@condo/domains/user/constants/common')

class AbstractIdentityIntegration {
    /**
     * Get identity integration type code
     * @return {string} Type of Identity integration. One of {@link IDP_TYPES}
     */
    getType () {
        throw new Error('Method still not implemented.')
    }

    /**
     * Get identity integration login form link. Usually it is going to be a link to OAuth code flow auth form
     * @param checks - contains state and nonce parameters
     * @return {object} An object that describes login form parameters
     * Structure: {link, scope, state, nonce, responseType, redirectUri, clientId}
     */
    async generateLoginFormParams (checks) {
        throw new Error('Method still not implemented.')
    }

    /**
     * Get identity integration token set for authed user
     * @param callbackParams - contains all parameters from authed user.
     *      Usually it is going to be query params from OAuth redirect
     * @return {object} An object that contains token set
     */
    async issueExternalIdentityToken (callbackParams) {
        throw new Error('Method still not implemented.')
    }

    /**
     * Get authed user info
     * @param externalIdentityTokenSet - token set from issueExternalIdentityToken method
     * @return {object} An object that contains token set
     */
    async getUserInfo (externalIdentityTokenSet) {
        throw new Error('Method still not implemented.')
    }

    /**
     * Get authed user id in external identity system
     * @param externalIdentityTokenSet - token set from issueExternalIdentityToken method
     * @return {object} An object that contains token set
     */
    async getUserExternalIdentityId (externalIdentityTokenSet) {
        throw new Error('Method still not implemented.')
    }
}

module.exports = AbstractIdentityIntegration